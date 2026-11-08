const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { authMiddleware } = require("../config/auth");

const UPLOAD_DIR = path.join(__dirname, "../../uploads");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const CATEGORIES = ["profile", "produits", "courses"];

const categoryOf = (req) => (CATEGORIES.includes(req.params.category) ? req.params.category : "misc");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_DIR, categoryOf(req));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error("Format d'image non supporté (jpeg, png, webp, gif uniquement)"));
    }
    cb(null, true);
  },
});

// POST /api/upload/:category — upload d'une image classée par usage (profile, produits...), stockée dans backend/uploads/<category>/
router.post("/:category", authMiddleware, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });
    const url = `${req.protocol}://${req.get("host")}/uploads/${categoryOf(req)}/${req.file.filename}`;
    res.status(201).json({ url });
  });
});

module.exports = router;
