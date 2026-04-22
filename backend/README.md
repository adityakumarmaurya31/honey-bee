# Honey Bee Admin Backend

## Setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Update `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create the database schema using `schema.sql`.
5. If your database already exists, run `add_tracking_number.sql` to add tracking support for orders.

## Run

```bash
npm run dev
```

The backend will be available at http://localhost:5000.

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
