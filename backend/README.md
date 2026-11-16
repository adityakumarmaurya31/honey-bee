# Honey Bee Admin Backend

## Setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Update the PostgreSQL connection values. Use either `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_SSL`, or one provider connection string in `DATABASE_URL`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create the database schema using `schema.sql`.

## Run

```bash
npm run dev
```

The backend will be available at http://localhost:5000.

## Render deployment

The Render service must use a MySQL database. PostgreSQL credentials will not work with this backend. Set these Render environment variables from your MySQL provider:

```env
DB_HOST=your-mysql-host
DB_PORT=5432
DB_USER=your-postgres-user
DB_PASSWORD=your-postgres-password
DB_NAME=your-database
DB_SSL=true
```

Alternatively, set `DATABASE_URL` to the provider's PostgreSQL connection string. After deployment, run `npm run setup-db` against that database and verify `/api/health` returns `database: "connected"`.

## Default Admin

- Email: `admin@honeybee.com`
- Password: `admin123`

## API Endpoints

- `POST /api/admin/login`
- `GET /api/admin/dashboard-stats`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/orders`
- `PUT /api/admin/orders/:id`
- `GET /api/admin/users`
- `DELETE /api/admin/users/:id`
- `POST /api/orders/payment-order`
- `POST /api/orders/verify-payment`
