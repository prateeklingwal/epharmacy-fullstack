# RunProgram.md — Run PharmaEase (E-Pharmacy) locally (Windows / PowerShell)

## Prerequisites
- **Node.js** v18 or v20
- **MySQL Server** running locally (8+ recommended)

## 0) Go to project folder

```powershell
cd "D:\Downloads\epharmacy-fullstack"
```

## 1) (Optional) Initialize/Reset the database from `schema.sql`

This will create the database (if missing) and import `epharmacy\database\schema.sql`.

> Before running this, open `epharmacy\backend\.env` and ensure your MySQL values are correct:
> `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

```powershell
cd ".\epharmacy\backend"
node -e "require('dotenv').config();const fs=require('fs');const path=require('path');const mysql=require('mysql2/promise');(async()=>{const cfg={host:process.env.DB_HOST,port:+process.env.DB_PORT,user:process.env.DB_USER,password:process.env.DB_PASSWORD};const c1=await mysql.createConnection(cfg);await c1.query('CREATE DATABASE IF NOT EXISTS '+process.env.DB_NAME);await c1.end();const sql=fs.readFileSync(path.resolve('..','database','schema.sql'),'utf8');const c2=await mysql.createConnection({...cfg,database:process.env.DB_NAME,multipleStatements:true});await c2.query(sql);await c2.end();console.log('✅ Database initialized');})().catch(e=>{console.error(e.sqlMessage||e.message);process.exit(1);});"
```

If you see a message like `Table 'users' already exists`, your DB is already initialized and you can continue.

## 2) Start the backend (Terminal 1)

Open a new terminal window/tab and run:

```powershell
cd "D:\Downloads\epharmacy-fullstack\epharmacy\backend"
npm install
npm run dev
```

Backend should start on:
- `http://localhost:5000`

## 3) Start the frontend (Terminal 2)

Open a second terminal window/tab and run:

```powershell
cd "D:\Downloads\epharmacy-fullstack\epharmacy\frontend"
npm install
npm start
```

Frontend should start on:
- `http://localhost:3000`

## 4) Open the app
- Open `http://localhost:3000`

## Seed login (optional)
- **Admin**: `admin@epharmacy.com` / `Admin@123`
- **User**: `aman@gmail.com` / `User@123`
- **Retailer**: `rajesh@medplus.com` / `Retail@123`

