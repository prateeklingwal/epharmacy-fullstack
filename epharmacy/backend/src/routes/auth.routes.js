const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body } = require('express-validator');
const db       = require('../config/db');
const { validate } = require('../middleware/errorHandler');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/* ─── USER SIGNUP ─── */
router.post('/user/signup',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('phone').optional().isMobilePhone(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, phone, address } = req.body;
      const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (rows.length) return res.status(409).json({ success: false, message: 'Email already registered' });

      const hash = await bcrypt.hash(password, 10);
      const [result] = await db.query(
        'INSERT INTO users (name, email, password_hash, phone, address) VALUES (?,?,?,?,?)',
        [name, email, hash, phone || null, address || null]
      );
      const token = signToken({ id: result.insertId, role: 'user' });
      res.status(201).json({ success: true, token, user: { id: result.insertId, name, email, role: 'user' } });
    } catch (err) { next(err); }
  }
);

/* ─── USER LOGIN ─── */
router.post('/user/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const user = rows[0];
      if (!user.is_active) return res.status(403).json({ success: false, message: 'Account suspended' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const token = signToken({ id: user.id, role: user.role });
      res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) { next(err); }
  }
);

/* ─── RETAILER SIGNUP ─── */
router.post('/retailer/signup',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('store_name').trim().notEmpty(),
    body('license_no').trim().notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, phone, store_name, store_address, license_no } = req.body;
      const [rows] = await db.query('SELECT id FROM retailers WHERE email = ?', [email]);
      if (rows.length) return res.status(409).json({ success: false, message: 'Email already registered' });

      const hash = await bcrypt.hash(password, 10);
      const [result] = await db.query(
        'INSERT INTO retailers (name, email, password_hash, phone, store_name, store_address, license_no) VALUES (?,?,?,?,?,?,?)',
        [name, email, hash, phone || null, store_name, store_address || null, license_no]
      );
      res.status(201).json({ success: true, message: 'Retailer registered. Await admin approval.', id: result.insertId });
    } catch (err) { next(err); }
  }
);

/* ─── RETAILER LOGIN ─── */
router.post('/retailer/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const [rows] = await db.query('SELECT * FROM retailers WHERE email = ?', [email]);
      if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const retailer = rows[0];
      if (!retailer.is_active)   return res.status(403).json({ success: false, message: 'Account suspended' });
      if (!retailer.is_approved) return res.status(403).json({ success: false, message: 'Account pending approval' });
      const ok = await bcrypt.compare(password, retailer.password_hash);
      if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      const token = signToken({ id: retailer.id, role: 'retailer' });
      res.json({ success: true, token, retailer: { id: retailer.id, name: retailer.name, email: retailer.email, store_name: retailer.store_name } });
    } catch (err) { next(err); }
  }
);

module.exports = router;
