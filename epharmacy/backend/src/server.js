require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ─── Middleware ───
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ───
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/medicines',     require('./routes/medicine.routes'));
app.use('/api/cart',          require('./routes/cart.routes'));
app.use('/api/orders',        require('./routes/order.routes'));
app.use('/api/prescriptions', require('./routes/prescription.routes'));
app.use('/api/retailer',      require('./routes/retailer.routes'));
app.use('/api/admin',         require('./routes/admin.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── Error Handlers ───
const { errorHandler, notFound } = require('./middleware/errorHandler');
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

module.exports = app;
