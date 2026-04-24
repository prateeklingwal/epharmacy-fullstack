const router = require('express').Router();
const db     = require('../config/db');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const userOnly = [authenticate, authorizeRoles('user', 'admin')];

/* ─── GET CART ─── */
router.get('/', userOnly, async (req, res, next) => {
  try {
    const [items] = await db.query(
      `SELECT c.id, c.quantity, m.id AS medicine_id, m.name, m.price, m.mrp,
              m.stock_qty, m.requires_rx, m.image_url, r.store_name
       FROM cart c
       JOIN medicines m ON m.id = c.medicine_id
       JOIN retailers r ON r.id = m.retailer_id
       WHERE c.user_id = ? AND m.is_active = 1`,
      [req.user.id]
    );
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    res.json({ success: true, data: { items, total: total.toFixed(2) } });
  } catch (err) { next(err); }
});

/* ─── ADD TO CART / UPDATE QTY ─── */
router.post('/', userOnly, async (req, res, next) => {
  try {
    const { medicine_id, quantity = 1 } = req.body;
    if (!medicine_id) return res.status(400).json({ success: false, message: 'medicine_id required' });

    const [[med]] = await db.query('SELECT id, stock_qty FROM medicines WHERE id = ? AND is_active = 1', [medicine_id]);
    if (!med) return res.status(404).json({ success: false, message: 'Medicine not found' });
    if (quantity > med.stock_qty) return res.status(400).json({ success: false, message: 'Insufficient stock' });

    await db.query(
      `INSERT INTO cart (user_id, medicine_id, quantity) VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE quantity = ?`,
      [req.user.id, medicine_id, quantity, quantity]
    );
    res.json({ success: true, message: 'Cart updated' });
  } catch (err) { next(err); }
});

/* ─── REMOVE FROM CART ─── */
router.delete('/:medicine_id', userOnly, async (req, res, next) => {
  try {
    await db.query('DELETE FROM cart WHERE user_id = ? AND medicine_id = ?', [req.user.id, req.params.medicine_id]);
    res.json({ success: true, message: 'Removed from cart' });
  } catch (err) { next(err); }
});

/* ─── CLEAR CART ─── */
router.delete('/', userOnly, async (req, res, next) => {
  try {
    await db.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) { next(err); }
});

module.exports = router;
