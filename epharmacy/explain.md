# PharmaEase (E‑Pharmacy) — Viva/Teacher Questions with Answers + Code Locations

Use this as a “talk track” while showing the code. Each answer includes the **exact file(s)** to open.

---

## 1) Project overview

### Q1. What is this project and what are the main modules?
**Answer:** It’s a full‑stack e‑pharmacy web app with:
- **Frontend (React)**: pages for search, medicine detail, cart, checkout, login/signup, retailer dashboard, admin dashboard.
- **Backend (Express)**: REST APIs for auth, medicines, cart, orders, prescriptions, retailer/admin operations.
- **Database (MySQL)**: persistent users/retailers/medicines/orders/cart/prescriptions.

**Code locations:**
- `epharmacy/README.md` (overall structure and endpoints)
- Frontend entry: `epharmacy/frontend/src/App.js`, `epharmacy/frontend/src/index.js`
- Backend entry: `epharmacy/backend/src/server.js`
- DB schema: `epharmacy/database/schema.sql`

---

## 2) Tech stack / architecture

### Q2. How does frontend talk to backend?
**Answer:** Frontend uses Axios with base URL `/api`. In dev mode, React dev server proxies `/api/*` requests to backend at `http://localhost:5000` via the `proxy` setting in `frontend/package.json`.

**Code locations:**
- Axios client + endpoints: `epharmacy/frontend/src/api/index.js`
- Proxy config: `epharmacy/frontend/package.json` (`"proxy": "http://localhost:5000"`)

### Q3. What is the backend architecture pattern?
**Answer:** Express app with:
- Route modules (auth, medicines, cart, orders, prescriptions, retailer, admin)
- Middleware for JWT auth + role checks, and centralized validation/error handling
- MySQL connection pool via `mysql2`

**Code locations:**
- Route registration: `epharmacy/backend/src/server.js`
- DB pool: `epharmacy/backend/src/config/db.js`
- Auth middleware: `epharmacy/backend/src/middleware/auth.js`
- Validation/error helper: `epharmacy/backend/src/middleware/errorHandler.js`

---

## 3) Database (MySQL) design

### Q4. What are the important tables and why?
**Answer:** Core tables:
- `users`: customers + admins (`role` column), `password_hash`, account status.
- `retailers`: pharmacist/shop accounts with approval gate (`is_approved`).
- `medicines`: catalog, price, stock, category, active flag.
- `cart`: per-user cart items (unique user+medicine).
- `orders` + `order_items`: checkout flow and line items (transactional).
- `prescriptions`: uploaded prescription files and review status.

**Code locations:**
- Schema + seed: `epharmacy/database/schema.sql`

### Q5. How is password stored and why?
**Answer:** Passwords are never stored in plain text. Backend hashes passwords using bcrypt and stores `password_hash` in DB. During login it compares the entered password with the stored hash.

**Code locations:**
- Hash + compare: `epharmacy/backend/src/routes/auth.routes.js` (`bcrypt.hash`, `bcrypt.compare`)

---

## 4) Authentication & authorization (JWT)

### Q6. Explain the login flow (customer/admin).
**Answer:**
1. Frontend sends `email` + `password` to `/api/auth/user/login`.
2. Backend fetches user row from `users`, checks `is_active`, compares bcrypt hash.
3. Backend signs a JWT (payload includes `id` and `role`) and returns token + user info.
4. Frontend stores token in `localStorage` and sends it in `Authorization: Bearer <token>` for protected requests.

**Code locations:**
- User login endpoint: `epharmacy/backend/src/routes/auth.routes.js` (`/user/login`)
- JWT middleware: `epharmacy/backend/src/middleware/auth.js`
- Axios token attach: `epharmacy/frontend/src/api/index.js` (request interceptor)
- Auth state in UI: `epharmacy/frontend/src/context/AuthContext.js`

### Q7. How are roles handled (user vs admin vs retailer)?
**Answer:** JWT contains a `role`. Middleware reads token, attaches decoded user to request, and role‑guard logic blocks endpoints that require certain roles.

**Code locations:**
- JWT verification + guards: `epharmacy/backend/src/middleware/auth.js`
- Admin routes: `epharmacy/backend/src/routes/admin.routes.js`
- Retailer routes: `epharmacy/backend/src/routes/retailer.routes.js`

### Q8. What is the “Retailer approval gate” business logic?
**Answer:** Retailers can sign up, but cannot login until an admin approves them. On retailer login, backend checks `is_approved`; if false, it returns 403 “pending approval”.

**Code locations:**
- Retailer signup/login checks: `epharmacy/backend/src/routes/auth.routes.js` (`/retailer/signup`, `/retailer/login`)
- Admin approval endpoint: `epharmacy/backend/src/routes/admin.routes.js` (approve retailer)

---

## 5) Validation & error handling

### Q9. How are request validations implemented?
**Answer:** Backend uses `express-validator` to validate and sanitize request body fields. A `validate` middleware returns 400 with structured errors if validation fails.

**Code locations:**
- Validators: `epharmacy/backend/src/routes/auth.routes.js` (e.g., `body('email').isEmail()`)
- Validation handler: `epharmacy/backend/src/middleware/errorHandler.js`

---

## 6) Medicines module

### Q10. How does medicine search work?
**Answer:** Frontend calls `/api/medicines/search` with query params (like `q`, `limit`). Backend queries MySQL and returns matching medicines. This endpoint is public (no JWT needed).

**Code locations:**
- Backend medicines routes: `epharmacy/backend/src/routes/medicine.routes.js`
- Frontend API calls: `epharmacy/frontend/src/api/index.js` (`searchMedicines`, `getCategories`, `getMedicine`)
- Search UI page: `epharmacy/frontend/src/pages/Search.js`

### Q11. How does a pharmacist (retailer) add medicines?
**Answer:**
1. Retailer logs in (must be approved) and gets JWT token.
2. Frontend calls `POST /api/retailer/medicines` with medicine details.
3. Backend inserts into `medicines` (linked to retailer/shop as implemented).

**Code locations:**
- Retailer endpoints: `epharmacy/backend/src/routes/retailer.routes.js` (`POST /medicines`)
- Retailer dashboard UI: `epharmacy/frontend/src/pages/RetailerDashboard.js`

---

## 7) Cart & checkout

### Q12. How is cart stored and updated?
**Answer:** Cart is persisted in DB (`cart` table). Endpoints:
- `GET /api/cart` fetches current cart for logged in user.
- `POST /api/cart` adds/updates quantity.
- `DELETE /api/cart/:mid` removes a medicine from cart.

**Code locations:**
- Backend cart routes: `epharmacy/backend/src/routes/cart.routes.js`
- Frontend cart context: `epharmacy/frontend/src/context/CartContext.js`
- Cart page: `epharmacy/frontend/src/pages/Cart.js`

### Q13. How are orders placed safely (transaction)?
**Answer:** Order placement uses MySQL transactions to ensure atomicity: create order, create order items, and reduce stock as one unit. If any step fails, rollback prevents partial orders.

**Code locations:**
- Backend order logic: `epharmacy/backend/src/routes/order.routes.js`

---

## 8) File uploads (prescriptions)

### Q14. How does prescription upload work?
**Answer:** Frontend sends a multipart form upload to `/api/prescriptions/upload`. Backend uses Multer to store file locally, then creates a DB row in `prescriptions` table.

**Code locations:**
- Multer config: `epharmacy/backend/src/config/upload.js`
- Prescription routes: `epharmacy/backend/src/routes/prescription.routes.js`
- Frontend API: `epharmacy/frontend/src/api/index.js` (`uploadPrescription`)
- Prescriptions page: `epharmacy/frontend/src/pages/Prescriptions.js`

---

## 9) Admin module

### Q15. What can the admin do?
**Answer:** Admin can view stats, manage users/retailers (approve/toggle), view orders, view medicines, and review prescriptions depending on routes implemented.

**Code locations:**
- Admin routes: `epharmacy/backend/src/routes/admin.routes.js`
- Admin UI: `epharmacy/frontend/src/pages/AdminDashboard.js`

### Q16. How do you login as admin in UI?
**Answer:** Admin is a record in `users` table with `role='admin'`, so login from **Customer** tab. After login, frontend redirects to `/admin` if role is admin.

**Code locations:**
- Redirect logic: `epharmacy/frontend/src/pages/Auth.js` (login submit handler)
- User login route: `epharmacy/backend/src/routes/auth.routes.js`

---

## 10) Common debugging questions

### Q17. If frontend shows “Proxy error ECONNREFUSED”, what does it mean?
**Answer:** Frontend cannot reach backend at `http://localhost:5000` (server not running, crashed, wrong port). Fix by starting backend and ensuring DB is connected.

**Code locations:**
- Proxy configuration: `epharmacy/frontend/package.json`
- Backend server boot logs: terminal output of `npm run dev` in `epharmacy/backend`

### Q18. If retailer cannot login even with correct password, why?
**Answer:** Retailer may not be approved (`is_approved=0`) or may be inactive (`is_active=0`). Admin must approve first.

**Code locations:**
- Retailer login checks: `epharmacy/backend/src/routes/auth.routes.js`
- Admin approve endpoint: `epharmacy/backend/src/routes/admin.routes.js`

---

## 11) “Show me in code” checklist (fast navigation)

- **Routes mounted**: `epharmacy/backend/src/server.js`
- **Auth endpoints**: `epharmacy/backend/src/routes/auth.routes.js`
- **JWT middleware**: `epharmacy/backend/src/middleware/auth.js`
- **Validation handler**: `epharmacy/backend/src/middleware/errorHandler.js`
- **Medicines**: `epharmacy/backend/src/routes/medicine.routes.js`
- **Cart**: `epharmacy/backend/src/routes/cart.routes.js`
- **Orders**: `epharmacy/backend/src/routes/order.routes.js`
- **Retailer**: `epharmacy/backend/src/routes/retailer.routes.js`
- **Admin**: `epharmacy/backend/src/routes/admin.routes.js`
- **Uploads**: `epharmacy/backend/src/config/upload.js`
- **Frontend API calls**: `epharmacy/frontend/src/api/index.js`
- **Login/Signup UI**: `epharmacy/frontend/src/pages/Auth.js`

