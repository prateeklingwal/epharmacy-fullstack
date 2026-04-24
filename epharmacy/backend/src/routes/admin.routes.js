const router = require('express').Router();
const db     = require('../config/db');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const adminOnly = [authenticate, authorizeRoles('admin')];

/* ─── DASHBOARD STATS ─── */
router.get('/stats', adminOnly, async (req, res, next) => {
  try {
    const [[users]]       = await db.query('SELECT COUNT(*) AS total FROM users WHERE role = "user"');
    const [[retailers]]   = await db.query('SELECT COUNT(*) AS total FROM retailers WHERE is_active = 1');
    const [[pending]]     = await db.query('SELECT COUNT(*) AS total FROM retailers WHERE is_approved = 0');
    const [[medicines]]   = await db.query('SELECT COUNT(*) AS total FROM medicines WHERE is_active = 1');
    const [[orders]]      = await db.query('SELECT COUNT(*) AS total FROM orders');
    const [[revenue]]     = await db.query('SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE status = "delivered"');
    const [[lowStock]]    = await db.query('SELECT COUNT(*) AS total FROM medicines WHERE stock_qty < 10 AND is_active = 1');
    const [[prescriptions]] = await db.query('SELECT COUNT(*) AS total FROM prescriptions WHERE status = "pending"');

    res.json({
      success: true,
      data: {
        users:            users.total,
        retailers:        retailers.total,
        pending_retailers: pending.total,
        medicines:        medicines.total,
        orders:           orders.total,
        revenue:          parseFloat(revenue.total),
        low_stock_alerts: lowStock.total,
        pending_prescriptions: prescriptions.total,
      }
    });
  } catch (err) { next(err); }
});

/* ─── LIST USERS ─── */
router.get('/users', adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [users] = await db.query(
      'SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [parseInt(limit), offset]
    );
    const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM users');
    res.json({ success: true, data: users, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) { next(err); }
});

/* ─── TOGGLE USER STATUS ─── */
router.patch('/users/:id/toggle', adminOnly, async (req, res, next) => {
  try {
    await db.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User status toggled' });
  } catch (err) { next(err); }
});

/* ─── LIST RETAILERS ─── */
router.get('/retailers', adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, approved } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let q = 'SELECT id, name, email, store_name, license_no, is_approved, is_active, created_at FROM retailers';
    const params = [];
    if (approved !== undefined) { q += ' WHERE is_approved = ?'; params.push(parseInt(approved)); }
    q += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const [retailers] = await db.query(q, params);
    res.json({ success: true, data: retailers });
  } catch (err) { next(err); }
});

/* ─── APPROVE RETAILER ─── */
router.patch('/retailers/:id/approve', adminOnly, async (req, res, next) => {
  try {
    await db.query('UPDATE retailers SET is_approved = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Retailer approved' });
  } catch (err) { next(err); }
});

/* ─── TOGGLE RETAILER STATUS ─── */
router.patch('/retailers/:id/toggle', adminOnly, async (req, res, next) => {
  try {
    await db.query('UPDATE retailers SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Retailer status toggled' });
  } catch (err) { next(err); }
});

/* ─── ALL MEDICINES ─── */
router.get('/medicines', adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, low_stock } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let q = `SELECT m.*, r.store_name FROM medicines m JOIN retailers r ON r.id = m.retailer_id`;
    if (low_stock === '1') q += ' WHERE m.stock_qty < 10';
    q += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    const [medicines] = await db.query(q, [parseInt(limit), offset]);
    res.json({ success: true, data: medicines });
  } catch (err) { next(err); }
});

/* ─── ALL ORDERS ─── */
router.get('/orders', adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let q = `SELECT o.*, u.name AS user_name, u.email FROM orders o JOIN users u ON u.id = o.user_id`;
    const params = [];
    if (status) { q += ' WHERE o.status = ?'; params.push(status); }
    q += ' ORDER BY o.placed_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const [orders] = await db.query(q, params);
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

/* ─── MANAGE PRESCRIPTIONS ─── */
router.get('/prescriptions', adminOnly, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.name AS user_name FROM prescriptions p JOIN users u ON u.id = p.user_id
       ORDER BY p.uploaded_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

router.patch('/prescriptions/:id', adminOnly, async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    await db.query(
      'UPDATE prescriptions SET status = ?, notes = ?, reviewed_at = NOW() WHERE id = ?',
      [status, notes || null, req.params.id]
    );
    res.json({ success: true, message: `Prescription ${status}` });
  } catch (err) { next(err); }
});

/* ─── REVENUE REPORT ─── */
router.get('/reports/revenue', adminOnly, async (req, res, next) => {
  try {
    const [monthly] = await db.query(
      `SELECT DATE_FORMAT(placed_at, '%Y-%m') AS month, COUNT(*) AS orders,
              SUM(total_amount) AS revenue
       FROM orders WHERE status = 'delivered'
       GROUP BY month ORDER BY month DESC LIMIT 12`
    );
    const [topMedicines] = await db.query(
      `SELECT m.name, SUM(oi.quantity) AS sold, SUM(oi.subtotal) AS revenue
       FROM order_items oi JOIN medicines m ON m.id = oi.medicine_id
       GROUP BY oi.medicine_id ORDER BY sold DESC LIMIT 10`
    );
    res.json({ success: true, data: { monthly, topMedicines } });
  } catch (err) { next(err); }
});

module.exports = router;
