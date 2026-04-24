const router = require('express').Router();
const db     = require('../config/db');
const upload = require('../config/upload');
const { authenticate, authorizeRoles } = require('../middleware/auth');

/* ─── UPLOAD PRESCRIPTION ─── */
router.post('/upload',
  authenticate,
  authorizeRoles('user', 'admin'),
  upload.single('prescription'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
      const fileUrl = `/uploads/${req.file.filename}`;
      const [result] = await db.query(
        'INSERT INTO prescriptions (user_id, file_url, file_name) VALUES (?,?,?)',
        [req.user.id, fileUrl, req.file.originalname]
      );
      res.status(201).json({ success: true, id: result.insertId, file_url: fileUrl });
    } catch (err) { next(err); }
  }
);

/* ─── GET MY PRESCRIPTIONS ─── */
router.get('/my', authenticate, authorizeRoles('user', 'admin'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM prescriptions WHERE user_id = ? ORDER BY uploaded_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
