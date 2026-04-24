const router = require('express').Router();
const db     = require('../config/db');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const userOnly = [authenticate, authorizeRoles('user', 'admin')];

/* ─── PLACE ORDER (from cart) ─── */
router.post('/', userOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { delivery_address, payment_method = 'cod', prescription_id } = req.body;
    if (!delivery_address) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'delivery_address is required' });
    }

    // Get cart items
    const [cartItems] = await conn.query(
      `SELECT c.quantity, m.id AS medicine_id, m.price, m.stock_qty, m.requires_rx, m.retailer_id
       FROM cart c JOIN medicines m ON m.id = c.medicine_id
       WHERE c.user_id = ? AND m.is_active = 1`,
      [req.user.id]
    );
    if (!cartItems.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Check prescription requirement
    const needsRx = cartItems.some(i => i.requires_rx);
    if (needsRx && !prescription_id) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Prescription required for one or more items' });
    }

    // Validate stock and calculate total
    for (const item of cartItems) {
      if (item.quantity > item.stock_qty) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `Insufficient stock for medicine ID ${item.medicine_id}` });
      }
    }
    const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

    // Create order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, prescription_id, total_amount, delivery_address, payment_method)
       VALUES (?,?,?,?,?)`,
      [req.user.id, prescription_id || null, total.toFixed(2), delivery_address, payment_method]
    );
    const orderId = orderResult.insertId;

    // Insert order items + deduct stock
    for (const item of cartItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, medicine_id, retailer_id, quantity, unit_price) VALUES (?,?,?,?,?)`,
        [orderId, item.medicine_id, item.retailer_id, item.quantity, item.price]
      );
      await conn.query(
        'UPDATE medicines SET stock_qty = stock_qty - ? WHERE id = ?',
        [item.quantity, item.medicine_id]
      );
    }

    // Clear cart
    await conn.query('DELETE FROM cart WHERE user_id = ?', [req.user.id]);

    await conn.commit();
    res.status(201).json({ success: true, message: 'Order placed', order_id: orderId });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

/* ─── GET USER ORDERS ─── */
router.get('/my', userOnly, async (req, res, next) => {
  try {
    const [orders] = await db.query(
      `SELECT o.id, o.status, o.total_amount, o.payment_method, o.payment_status, o.placed_at,
              COUNT(oi.id) AS item_count
       FROM orders o JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ?
       GROUP BY o.id ORDER BY o.placed_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

/* ─── GET ORDER DETAIL ─── */
router.get('/:id', userOnly, async (req, res, next) => {
  try {
    const [[order]] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND (user_id = ? OR ? = "admin")',
      [req.params.id, req.user.id, req.user.role]
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const [items] = await db.query(
      `SELECT oi.*, m.name, m.image_url, r.store_name
       FROM order_items oi
       JOIN medicines m ON m.id = oi.medicine_id
       JOIN retailers r ON r.id = oi.retailer_id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );
    res.json({ success: true, data: { ...order, items } });
  } catch (err) { next(err); }
});

/* ─── CANCEL ORDER ─── */
router.patch('/:id/cancel', userOnly, async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!order) { await conn.rollback(); return res.status(404).json({ success: false, message: 'Order not found' }); }
    if (!['pending', 'confirmed'].includes(order.status)) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Cannot cancel this order' });
    }

    await conn.query('UPDATE orders SET status = "cancelled" WHERE id = ?', [order.id]);

    // Restore stock
    const [items] = await conn.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    for (const item of items) {
      await conn.query('UPDATE medicines SET stock_qty = stock_qty + ? WHERE id = ?', [item.quantity, item.medicine_id]);
    }

    await conn.commit();
    res.json({ success: true, message: 'Order cancelled' });
  } catch (err) { await conn.rollback(); next(err); } finally { conn.release(); }
});

module.exports = router;
