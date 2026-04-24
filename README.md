# 💊 PharmaEase — E-Pharmacy Web Application

A full-stack E-Pharmacy platform similar to PharmEasy, built with React, Node.js (Express), and MySQL.

---

## 🏗️ Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, React Router v6, Axios    |
| Backend  | Node.js, Express.js                 |
| Database | MySQL 8+ (mysql2 driver)            |
| Auth     | JWT (jsonwebtoken) + bcryptjs       |
| Uploads  | Multer (local disk)                 |
| Styling  | Pure CSS with design system (no UI lib) |

---

## 📁 Project Structure

```
epharmacy/
├── database/
│   └── schema.sql                  ← Full MySQL schema + seed data
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js               ← Express entry point
│       ├── config/
│       │   ├── db.js               ← MySQL connection pool
│       │   └── upload.js           ← Multer config
│       ├── middleware/
│       │   ├── auth.js             ← JWT middleware + role guards
│       │   └── errorHandler.js     ← Validation & error handling
│       └── routes/
│           ├── auth.routes.js      ← Signup/Login (user + retailer)
│           ├── medicine.routes.js  ← Search, detail, alternatives
│           ├── cart.routes.js      ← Cart CRUD
│           ├── order.routes.js     ← Place/view/cancel orders
│           ├── prescription.routes.js ← Upload & view Rx
│           ├── retailer.routes.js  ← Medicine CRUD + stock + orders
│           └── admin.routes.js     ← Stats, users, reports
│
└── frontend/
    ├── package.json
    └── src/
        ├── App.js                  ← Router + providers
        ├── index.js                ← React entry
        ├── index.css               ← Global design system
        ├── api/index.js            ← All Axios API calls
        ├── context/
        │   ├── AuthContext.js      ← Auth state (user + retailer)
        │   └── CartContext.js      ← Cart state
        ├── components/
        │   ├── Navbar.js / .css
        │   ├── MedicineCard.js / .css
        │   └── ProtectedRoute.js
        └── pages/
            ├── Home.js / .css
            ├── Search.js / .css
            ├── MedicineDetail.js / .css
            ├── Cart.js / .css
            ├── Checkout.js / .css
            ├── Orders.js / .css
            ├── Prescriptions.js / .css
            ├── Auth.js / .css
            ├── RetailerDashboard.js / .css
            └── AdminDashboard.js / .css
```

---

## 🗄️ Database Schema (8 Tables)

| Table                  | Purpose                                  |
|------------------------|------------------------------------------|
| `users`                | Customers + admins (role ENUM)           |
| `retailers`            | Pharmacy owners (approval gate)          |
| `medicines`            | Product catalog (FULLTEXT index)         |
| `medicine_alternatives`| Same-salt medicine pairs (self-ref)      |
| `orders`               | Customer orders (transactional)          |
| `order_items`          | Line items (GENERATED subtotal column)   |
| `cart`                 | Persisted cart (UNIQUE user+medicine)    |
| `prescriptions`        | Uploaded Rx files with review status     |

---

## 🚀 Setup & Running

### Prerequisites
- **Node.js** (recommended: **v18/v20** for best compatibility with `react-scripts`)
- **MySQL Server** running locally (8+ recommended)

### Step 1 — MySQL Database (creates DB + tables + seed)

#### Option A (recommended on Windows) — Import using Node (no `mysql` CLI needed)
```bash
cd epharmacy/backend
cp .env.example .env
# Edit backend/.env with your MySQL credentials first (DB_USER / DB_PASSWORD)
node -e "require('dotenv').config();const fs=require('fs');const path=require('path');const mysql=require('mysql2/promise');(async()=>{const cfg={host:process.env.DB_HOST,port:+process.env.DB_PORT,user:process.env.DB_USER,password:process.env.DB_PASSWORD};const c1=await mysql.createConnection(cfg);await c1.query('CREATE DATABASE IF NOT EXISTS '+process.env.DB_NAME);await c1.end();const sql=fs.readFileSync(path.resolve('..','database','schema.sql'),'utf8');const c2=await mysql.createConnection({...cfg,database:process.env.DB_NAME,multipleStatements:true});await c2.query(sql);await c2.end();console.log('✅ Database initialized');})().catch(e=>{console.error(e.sqlMessage||e.message);process.exit(1);});"
```

#### Option B — Import using MySQL CLI
```bash
mysql -u root -p < epharmacy/database/schema.sql
```
This creates the `epharmacy` database with all tables, indexes, and sample data.

### Step 2 — Backend
```bash
cd epharmacy/backend
cp .env.example .env
# Edit .env with your MySQL credentials
npm install
npm run dev          # Starts on http://localhost:5000
```

### Step 3 — Frontend
```bash
cd epharmacy/frontend
npm install
npm start            # Starts on http://localhost:3000
```
The frontend proxies API calls to `:5000` via the `"proxy"` field in `package.json`.

---

## 👤 Default Credentials (from seed data)

| Role     | Email                   | Password    |
|----------|-------------------------|-------------|
| Admin    | admin@epharmacy.com     | Admin@123   |
| Retailer | rajesh@medplus.com      | Retail@123  |
| Retailer | priya@healthkart.com    | Retail@123  |
| User     | aman@gmail.com          | User@123    |

> ⚠️ The seed data uses pre-hashed passwords. If you re-import the schema or change any auth logic, these passwords may not match your current hashes. In that case, reset the password in DB (or create a new account via Signup).

### Admin login (UI)
- Use **Login → Customer tab** (admin is a `users` row with `role='admin'`)
- Email: `admin@epharmacy.com`
- Password: `Admin@123`

### Retailer (Pharmacist) login (UI)
- Use **Login → Pharmacy tab**
- Retailers must be **approved by Admin** before they can login (`is_approved = 1`).

---

## 🔌 API Reference

### Auth
| Method | Endpoint                  | Body                          | Description          |
|--------|---------------------------|-------------------------------|----------------------|
| POST   | `/api/auth/user/signup`   | name, email, password, phone  | Register user        |
| POST   | `/api/auth/user/login`    | email, password               | Login user           |
| POST   | `/api/auth/retailer/signup` | name, email, password, store_name, license_no | Register retailer |
| POST   | `/api/auth/retailer/login` | email, password              | Login retailer       |

### Medicines (Public)
| Method | Endpoint                        | Query Params         | Description              |
|--------|---------------------------------|----------------------|--------------------------|
| GET    | `/api/medicines/search`         | q, page, limit, category | Search medicines    |
| GET    | `/api/medicines/:id`            | —                    | Detail + alternatives    |
| GET    | `/api/medicines/meta/categories`| —                    | List all categories      |

### Cart (User)
| Method | Endpoint              | Body                    | Description        |
|--------|-----------------------|-------------------------|--------------------|
| GET    | `/api/cart`           | —                       | Get cart           |
| POST   | `/api/cart`           | medicine_id, quantity   | Add/update item    |
| DELETE | `/api/cart/:mid`      | —                       | Remove item        |
| DELETE | `/api/cart`           | —                       | Clear cart         |

### Orders (User)
| Method | Endpoint                  | Body                                | Description        |
|--------|---------------------------|-------------------------------------|--------------------|
| POST   | `/api/orders`             | delivery_address, payment_method, prescription_id? | Place order |
| GET    | `/api/orders/my`          | —                                   | My orders          |
| GET    | `/api/orders/:id`         | —                                   | Order detail       |
| PATCH  | `/api/orders/:id/cancel`  | —                                   | Cancel order       |

### Prescriptions (User)
| Method | Endpoint                       | Body/File     | Description      |
|--------|--------------------------------|---------------|------------------|
| POST   | `/api/prescriptions/upload`    | multipart file| Upload Rx        |
| GET    | `/api/prescriptions/my`        | —             | My prescriptions |

### Retailer (Retailer JWT)
| Method | Endpoint                             | Description           |
|--------|--------------------------------------|-----------------------|
| GET    | `/api/retailer/medicines`            | List my medicines     |
| POST   | `/api/retailer/medicines`            | Add medicine          |
| PUT    | `/api/retailer/medicines/:id`        | Update medicine       |
| DELETE | `/api/retailer/medicines/:id`        | Soft-delete medicine  |
| PATCH  | `/api/retailer/medicines/:id/stock`  | Update stock qty      |
| GET    | `/api/retailer/orders`               | Orders for my meds    |
| PATCH  | `/api/retailer/orders/:id/status`    | Update order status   |

### Admin (Admin JWT)
| Method | Endpoint                         | Description               |
|--------|----------------------------------|---------------------------|
| GET    | `/api/admin/stats`               | Dashboard stats           |
| GET    | `/api/admin/users`               | All users                 |
| PATCH  | `/api/admin/users/:id/toggle`    | Suspend/activate user     |
| GET    | `/api/admin/retailers`           | All retailers             |
| PATCH  | `/api/admin/retailers/:id/approve` | Approve retailer        |
| PATCH  | `/api/admin/retailers/:id/toggle`| Suspend/activate retailer |
| GET    | `/api/admin/medicines`           | All medicines             |
| GET    | `/api/admin/orders`              | All orders                |
| GET    | `/api/admin/prescriptions`       | All prescriptions         |
| PATCH  | `/api/admin/prescriptions/:id`   | Approve/reject Rx         |
| GET    | `/api/admin/reports/revenue`     | Monthly revenue report    |

---

## 🎨 Frontend Pages

| Page                | Route              | Access    |
|---------------------|--------------------|-----------|
| Home                | `/`                | Public    |
| Search Results      | `/search?q=`       | Public    |
| Medicine Detail     | `/medicine/:id`    | Public    |
| Login               | `/login`           | Public    |
| Signup              | `/signup`          | Public    |
| Cart                | `/cart`            | User      |
| Checkout (4-step)   | `/checkout`        | User      |
| My Orders           | `/orders`          | User      |
| Order Detail        | `/orders/:id`      | User      |
| My Prescriptions    | `/prescriptions`   | User      |
| Retailer Dashboard  | `/retailer`        | Retailer  |
| Admin Dashboard     | `/admin`           | Admin     |

---

## ✨ Key Features

- **JWT Authentication** — separate flows for users, retailers, admin
- **Medicine Search** — LIKE-based partial match on name, salt, manufacturer
- **Same-Salt Alternatives** — medicine_alternatives join table
- **MySQL Transactions** — order placement atomically deducts stock
- **GENERATED columns** — `subtotal = quantity × unit_price` computed by MySQL
- **Prescription Upload** — Multer + admin review workflow
- **Retailer Approval Gate** — retailers need admin approval before login
- **Soft Deletes** — medicines use `is_active` flag (no hard deletes)
- **4-step Checkout** — address → Rx → payment → review
- **Admin Reports** — monthly revenue bar chart + top medicines table
- **Responsive Design** — mobile-first, pure CSS design system

---

## 🔒 Security Notes for Production

1. Move `JWT_SECRET` to a secrets manager (AWS Secrets Manager, Vault)
2. Add rate limiting: `npm i express-rate-limit`
3. Add helmet: `npm i helmet`
4. Use HTTPS only; set `secure: true` cookies
5. Move file uploads to S3/CloudFront
6. Add input sanitization: `npm i express-mongo-sanitize` (or use parameterized queries — already done with `mysql2`)
7. Hash all passwords with bcrypt cost factor ≥ 12 (currently 10)

---

## 📦 Production Build

```bash
# Frontend
cd frontend && npm run build
# Serve the build/ folder with nginx or serve it from Express:
# app.use(express.static(path.join(__dirname, '../frontend/build')))
```
