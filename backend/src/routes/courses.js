const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../config/db");
const { authMiddleware, adminOnly } = require("../config/auth");
const { paginate } = require("../utils/paginate");

router.use(authMiddleware, (req, res, next) => {
  if (!["admin", "agent"].includes(req.user.role)) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  next();
});

// GET /api/courses — admin: tous les cours ; agent: cours publiés uniquement, avec sa progression
// filtres optionnels : page, limit
router.get("/", async (req, res) => {
  try {
    const { page, limit } = req.query;
    const where = req.user.role === "admin" ? "" : "WHERE c.status = 'published'";
    const selectSql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM course_lessons cl WHERE cl.course_id = c.id) AS lesson_count,
             (SELECT COUNT(*) FROM course_progress cp WHERE cp.course_id = c.id AND cp.user_id = ?) AS completed_count,
             EXISTS(SELECT 1 FROM certificates cert WHERE cert.course_id = c.id AND cert.user_id = ?) AS certified
      FROM courses c
      ${where}
      ORDER BY c.created_at DESC`;
    const countSql = `SELECT COUNT(*) AS count FROM courses c ${where}`;

    const result = await paginate(db, { selectSql, countSql, params: [req.user.id, req.user.id], countParams: [], page, limit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:id — détail + leçons (avec progression de l'utilisateur courant)
router.get("/:id", async (req, res) => {
  try {
    const { rows: courseRows } = await db.query("SELECT * FROM courses WHERE id = ?", [req.params.id]);
    if (!courseRows.length) return res.status(404).json({ error: "Cours introuvable" });
    const course = courseRows[0];
    if (req.user.role !== "admin" && course.status !== "published") {
      return res.status(404).json({ error: "Cours introuvable" });
    }
    const { rows: lessons } = await db.query(
      `SELECT cl.*, cp.completed_at, cp.quiz_score
       FROM course_lessons cl
       LEFT JOIN course_progress cp ON cp.lesson_id = cl.id AND cp.user_id = ?
       WHERE cl.course_id = ?
       ORDER BY cl.position ASC, cl.created_at ASC`,
      [req.user.id, req.params.id]
    );
    const { rows: certRows } = await db.query(
      "SELECT 1 FROM certificates WHERE course_id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    res.json({ ...course, lessons, certified: certRows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses — admin uniquement
router.post("/", adminOnly, async (req, res) => {
  const { title, description, thumbnail_url, is_free, price, status } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: "Titre requis" });
  try {
    const id = uuidv4();
    await db.query(
      `INSERT INTO courses (id, title, description, thumbnail_url, is_free, price, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title.trim(), description || null, thumbnail_url || null,
        is_free !== false, price || 0, status === "published" ? "published" : "draft", req.user.id]
    );
    const { rows } = await db.query("SELECT * FROM courses WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/courses/:id — admin uniquement
router.patch("/:id", adminOnly, async (req, res) => {
  const allowed = ["title", "description", "thumbnail_url", "is_free", "price", "status"];
  const fields = Object.keys(req.body).filter((k) => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: "Aucun champ valide" });
  try {
    const set = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => req.body[f]);
    await db.query(`UPDATE courses SET ${set}, updated_at = NOW() WHERE id = ?`, [...values, req.params.id]);
    const { rows } = await db.query("SELECT * FROM courses WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Cours introuvable" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/courses/:id — admin uniquement
router.delete("/:id", adminOnly, async (req, res) => {
  try {
    await db.query("DELETE FROM courses WHERE id = ?", [req.params.id]);
    res.json({ message: "Cours supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses/:id/lessons — admin uniquement
router.post("/:id/lessons", adminOnly, async (req, res) => {
  const { title, type, content_url, quiz_data, position } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: "Titre requis" });
  if (!["video", "pdf", "quiz"].includes(type)) return res.status(400).json({ error: "Type invalide" });
  try {
    const { rows: countRows } = await db.query("SELECT COUNT(*) AS count FROM course_lessons WHERE course_id = ?", [req.params.id]);
    const id = uuidv4();
    await db.query(
      `INSERT INTO course_lessons (id, course_id, title, type, content_url, quiz_data, position)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, req.params.id, title.trim(), type, content_url || null,
        quiz_data ? JSON.stringify(quiz_data) : null,
        position !== undefined ? position : Number(countRows[0].count)]
    );
    const { rows } = await db.query("SELECT * FROM course_lessons WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/courses/lessons/:lessonId — admin uniquement
router.patch("/lessons/:lessonId", adminOnly, async (req, res) => {
  const allowed = ["title", "type", "content_url", "quiz_data", "position"];
  const fields = Object.keys(req.body).filter((k) => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: "Aucun champ valide" });
  try {
    const set = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => (f === "quiz_data" ? JSON.stringify(req.body[f]) : req.body[f]));
    await db.query(`UPDATE course_lessons SET ${set} WHERE id = ?`, [...values, req.params.lessonId]);
    const { rows } = await db.query("SELECT * FROM course_lessons WHERE id = ?", [req.params.lessonId]);
    if (!rows.length) return res.status(404).json({ error: "Leçon introuvable" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/courses/lessons/:lessonId — admin uniquement
router.delete("/lessons/:lessonId", adminOnly, async (req, res) => {
  try {
    await db.query("DELETE FROM course_lessons WHERE id = ?", [req.params.lessonId]);
    res.json({ message: "Leçon supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses/:id/lessons/:lessonId/complete — marque une leçon comme terminée pour l'utilisateur courant
router.post("/:id/lessons/:lessonId/complete", async (req, res) => {
  const { quiz_score } = req.body;
  try {
    await db.query(
      `INSERT INTO course_progress (id, user_id, course_id, lesson_id, quiz_score)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET quiz_score = ?, completed_at = NOW()`,
      [uuidv4(), req.user.id, req.params.id, req.params.lessonId, quiz_score ?? null, quiz_score ?? null]
    );

    const { rows: totalRows } = await db.query("SELECT COUNT(*) AS count FROM course_lessons WHERE course_id = ?", [req.params.id]);
    const { rows: doneRows } = await db.query(
      "SELECT COUNT(*) AS count FROM course_progress WHERE course_id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    let certified = false;
    if (Number(totalRows[0].count) > 0 && Number(doneRows[0].count) >= Number(totalRows[0].count)) {
      await db.query(
        "INSERT INTO certificates (id, user_id, course_id) VALUES (?, ?, ?) ON CONFLICT (user_id, course_id) DO NOTHING",
        [uuidv4(), req.user.id, req.params.id]
      );
      certified = true;
    }
    res.json({ completed: true, certified });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/certificates/me — mes certificats
router.get("/certificates/me", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT cert.id, cert.issued_at, c.id AS course_id, c.title AS course_title
       FROM certificates cert
       JOIN courses c ON c.id = cert.course_id
       WHERE cert.user_id = ?
       ORDER BY cert.issued_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
