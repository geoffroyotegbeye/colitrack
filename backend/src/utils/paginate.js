/**
 * Pagination générique. Si `page` est absent, renvoie le tableau complet (comportement historique,
 * utilisé par les dashboards/agrégations qui ont besoin de tout l'ensemble). Si `page` est fourni,
 * renvoie { data, total } avec LIMIT/OFFSET appliqué côté SQL.
 */
async function paginate(db, { selectSql, countSql, params, countParams, page, limit }) {
  if (!page) {
    const { rows } = await db.query(selectSql, params);
    return rows;
  }
  const limitNum = Math.min(Math.max(Number(limit) || 8, 1), 100);
  const pageNum = Math.max(Number(page) || 1, 1);
  const offset = (pageNum - 1) * limitNum;
  const { rows: data } = await db.query(`${selectSql} LIMIT ? OFFSET ?`, [...params, limitNum, offset]);
  const { rows: countRows } = await db.query(countSql, countParams !== undefined ? countParams : params);
  return { data, total: Number(countRows[0].count) };
}

module.exports = { paginate };
