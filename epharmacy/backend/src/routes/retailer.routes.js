const router = require('express').Router();
const db     = require('../config/db');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const retailerOnly = [authenticate, authorizeRoles('retailer')];

/* ─── GET MY MEDICINES ─── */
router.get('/medicines', retailerOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [medicines] = await db.query(
      'SELECT * FROM medicines WHERE retailer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM medicines WHERE retailer_id = ?',
      [req.user.id]
    );
    res.json({ success: true, data: medicines, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
});

/* ─── ADD MEDICINE ─── */
router.post('/medicines', retailerOnly, async (req, res, next) => {
  try {
    const { name, salt_composition, manufacturer, category, description, price, mrp, stock_qty, unit, requires_rx, image_url } = req.body;
    if (!name || !salt_composition || !manufacturer || price == null || mrp == null) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }
    const [result] = await db.query(
      `INSERT INTO medicines (retailer_id, name, salt_composition, manufacturer, category, description, price, mrp, stock_qty, unit, requires_rx, image_url)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.id, name, salt_composition, manufacturer, category || null, description || null,
       price, mrp, stock_qty || 0, unit || 'strip', requires_rx ? 1 : 0, image_url || null]
    );
    res.status(201).json({ success: true, id: result.insertId, message: 'Medicine added' });
  } catch (err) { next(err); }
});

/* ─── UPDATE MEDICINE ─── */
router.put('/medicines/:id', retailerOnly, async (req, res, next) => {
  try {
    const { name, salt_composition, manufacturer, category, description, price, mrp, stock_qty, unit, requires_rx, image_url, is_active } = req.body;
    const [[med]] = await db.query('SELECT id FROM medicines WHERE id = ? AND retailer_id = ?', [req.params.id, req.user.id]);
    if (!med) return res.status(404).json({ success: false, message: 'Medicine not found' });

    await db.query(
      `UPDATE medicines SET name=COALESCE(?,name), salt_composition=COALESCE(?,salt_composition),
       manufacturer=COALESCE(?,manufacturer), category=COALESCE(?,category),
       description=COALESCE(?,description), price=COALESCE(?,price), mrp=COALESCE(?,mrp),
       stock_qty=COALESCE(?,stock_qty), unit=COALESCE(?,unit),
       requires_rx=COALESCE(?,requires_rx), image_url=COALESCE(?,image_url),
       is_active=COALESCE(?,is_active)
       WHERE id = ?`,
      [name, salt_composition, manufacturer, category, description, price, mrp,
       stock_qty, unit, requires_rx != null ? (requires_rx ? 1 : 0) : null,
       image_url, is_active != null ? (is_active ? 1 : 0) : null, req.params.id]
    );
    res.json({ success: true, message: 'Medicine updated' });
  } catch (err) { next(err); }
});

/* ─── DELETE MEDICINE ─── */
router.delete('/medicines/:id', retailerOnly, async (req, res, next) => {
  try {
    const [[med]] = await db.query('SELECT id FROM medicines WHERE id = ? AND retailer_id = ?', [req.params.id, req.user.id]);
    if (!med) return res.status(404).json({ success: false, message: 'Medicine not found' });
    await db.query('UPDATE medicines SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Medicine removed' });
  } catch (err) { next(err); }
});

/* ─── UPDATE STOCK ─── */
router.patch('/medicines/:id/stock', retailerOnly, async (req, res, next) => {
  try {
    const { stock_qty } = req.body;
    if (stock_qty == null || stock_qty < 0) return res.status(400).json({ success: false, message: 'Invalid stock_qty' });
    const [[med]] = await db.query('SELECT id FROM medicines WHERE id = ? AND retailer_id = ?', [req.params.id, req.user.id]);
    if (!med) return res.status(404).json({ success: false, message: 'Medicine not found' });
    await db.query('UPDATE medicines SET stock_qty = ? WHERE id = ?', [stock_qty, req.params.id]);
    res.json({ success: true, message: 'Stock updated' });
  } catch (err) { next(err); }
});

/* ─── GET ORDERS FOR MY MEDICINES ─── */
router.get('/orders', retailerOnly, async (req, res, next) => {
  try {
    const [orders] = await db.query(
      `SELECT DISTINCT o.id, o.status, o.total_amount, o.placed_at, o.payment_status,
              u.name AS user_name, u.email AS user_email
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN users u ON u.id = o.user_id
       WHERE oi.retailer_id = ?
       ORDER BY o.placed_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

/* ─── UPDATE ORDER STATUS ─── */
router.patch('/orders/:id/status', retailerOnly, async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'packed', 'shipped', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Order marked as ${status}` });
  } catch (err) { next(err); }
});

module.exports = router;
