const router = require('express').Router();
const db     = require('../config/db');
const { authenticate } = require('../middleware/auth');

/* ─── SEARCH MEDICINES (partial + typo via LIKE + FULLTEXT) ─── */
router.get('/search', async (req, res, next) => {
  try {
    const { q = '', page = 1, limit = 12, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const search = `%${q.trim()}%`;

    let query = `
      SELECT m.id, m.name, m.salt_composition, m.manufacturer, m.category,
             m.price, m.mrp, m.stock_qty, m.unit, m.requires_rx, m.image_url,
             r.store_name, r.id AS retailer_id
      FROM medicines m
      JOIN retailers r ON r.id = m.retailer_id
      WHERE m.is_active = 1 AND r.is_active = 1 AND r.is_approved = 1
        AND (m.name LIKE ? OR m.salt_composition LIKE ? OR m.manufacturer LIKE ?)
    `;
    const params = [search, search, search];

    if (category) { query += ' AND m.category = ?'; params.push(category); }

    query += ' ORDER BY m.stock_qty DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [medicines] = await db.query(query, params);

    // Count
    let countQuery = `
      SELECT COUNT(*) AS total FROM medicines m
      JOIN retailers r ON r.id = m.retailer_id
      WHERE m.is_active = 1 AND r.is_active = 1 AND r.is_approved = 1
        AND (m.name LIKE ? OR m.salt_composition LIKE ? OR m.manufacturer LIKE ?)
    `;
    const countParams = [search, search, search];
    if (category) { countQuery += ' AND m.category = ?'; countParams.push(category); }
    const [[{ total }]] = await db.query(countQuery, countParams);

    res.json({ success: true, data: medicines, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
});

/* ─── GET MEDICINE DETAIL ─── */
router.get('/:id', async (req, res, next) => {
  try {
    const [[medicine]] = await db.query(
      `SELECT m.*, r.store_name, r.phone AS retailer_phone
       FROM medicines m JOIN retailers r ON r.id = m.retailer_id
       WHERE m.id = ? AND m.is_active = 1`,
      [req.params.id]
    );
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });

    // Alternatives by same salt composition
    const [alternatives] = await db.query(
      `SELECT m.id, m.name, m.price, m.mrp, m.manufacturer, m.stock_qty, r.store_name
       FROM medicine_alternatives ma
       JOIN medicines m ON m.id = ma.alt_medicine_id
       JOIN retailers r ON r.id = m.retailer_id
       WHERE ma.medicine_id = ? AND m.is_active = 1
       LIMIT 10`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...medicine, alternatives } });
  } catch (err) { next(err); }
});

/* ─── GET CATEGORIES ─── */
router.get('/meta/categories', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT category FROM medicines WHERE is_active = 1 AND category IS NOT NULL ORDER BY category`
    );
    res.json({ success: true, data: rows.map(r => r.category) });
  } catch (err) { next(err); }
});

module.exports = router;
