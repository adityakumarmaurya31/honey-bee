# Honey Bee E-commerce Admin + Store

A React + Vite frontend with a Node.js + Express backend and MySQL database for a honey business.

This project includes:
- Public shop pages built in React with Vite
- Tailwind CSS-powered admin panel UI
- JWT admin authentication
- Admin dashboard, products, orders, and user management
- Image upload support with files stored in `backend/uploads`
- MySQL database access using raw SQL queries (no ORM)

## Project Structure

Root frontend:
- `src/` — main store app and admin routes
- `src/admin/` — admin panel components and pages
- `src/components/` — store components
- `src/pages/` — public store pages

Backend:
- `backend/server.js` — Express server entry
- `backend/routes/admin.js` — admin API routes
- `backend/controllers/adminController.js` — admin logic
- `backend/middleware/adminAuth.js` — JWT admin middleware
- `backend/db.js` — MySQL pool connection
- `backend/schema.sql` — database schema and seed data
- `backend/uploads/` — uploaded product images

## Local Setup

### 1. Clone & install frontend packages

```bash
cd "c:\Users\Aditya\OneDrive\Desktop\honey bee\honey bee"
npm install
```

### 2. Install backend packages

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create `.env` files from the examples:

Frontend:
- `cp .env.example .env`

Backend:
- `cd backend`
- `cp .env.example .env`

Update values as needed:
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `CLIENT_URL`

### 4. Create the MySQL database

Run the SQL script in `backend/schema.sql` against your MySQL server.

Example using MySQL CLI:

```sql
SOURCE path/to/backend/schema.sql;
```

This creates:
- `users`
- `products`
- `orders`
- `order_items`

It also seeds one admin user.

## Default Admin Login

- Email: `admin@honeybee.com`
- Password: `admin123`

> Change the seeded password or admin account after first login for production.

## Run the App

### Start backend server

```bash
cd backend
npm run dev
```

Backend default:
- `http://localhost:5000`

### Start frontend app

```bash
cd ..
npm run dev
```

Frontend default:
- `http://localhost:5173`

## Admin Panel Access

Open:

- `http://localhost:5173/admin/login`

After login, the admin panel includes:
- `Dashboard`
- `Products`
- `Orders`
- `Users`

## Admin API Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/admin/login` | Admin email/password login |
| GET | `/api/admin/dashboard-stats` | Dashboard counts and revenue |
| GET | `/api/admin/products` | List products |
| POST | `/api/admin/products` | Create product with image upload |
| PUT | `/api/admin/products/:id` | Update product details |
| DELETE | `/api/admin/products/:id` | Delete product |
| GET | `/api/admin/orders` | List all orders with items |
| PUT | `/api/admin/orders/:id` | Update order status |
| GET | `/api/admin/users` | List users |
| DELETE | `/api/admin/users/:id` | Delete user |

## Notes

- Admin routes are protected by JWT middleware in `backend/middleware/adminAuth.js`.
- Uploaded images are served from `backend/uploads`.
- The frontend admin routes are under `src/admin/` and integrated into `src/App.jsx`.
- Tailwind CSS is configured using `tailwind.config.js` and `postcss.config.js`.

## Optional

If you want, I can also add:
- a public admin link in the website navbar
- logout confirmation
- better validation for product forms
- a production-ready deployment setup
