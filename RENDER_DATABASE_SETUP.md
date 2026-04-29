# 🚀 Render Database Connection Setup

## Step 1: Create MySQL Database

Choose ONE of these options:

### ✅ Option A: Railway (Recommended - Easiest)
1. Go to https://railway.app
2. Sign in with GitHub
3. Click **New Project** → **Provision MySQL**
4. Wait for MySQL to deploy (2-3 minutes)
5. Click on **MySQL** service
6. Go to **Connect** tab
7. Copy the connection details:
   - **Host**: Look for `mysql.railway.internal` or a public host like `monorail.proxy.rlwy.net`
   - **User**: `root` (default)
   - **Password**: Visible on the page
   - **Database**: `railway`

**Note**: If deploying from Render (external), use the **public** host, NOT `mysql.railway.internal`

### Option B: PlanetScale
1. Go to https://planetscale.com
2. Create account & new database
3. Click **Connect** button
4. Select **Connect with Node.js**
5. Copy the connection string - extract:
   - **Host**: `aws.connect.psdb.cloud`
   - **User**: Your username
   - **Password**: Your password
   - **Database**: Your database name

### Option C: Aiven
1. Go to https://aiven.io (free tier available)
2. Create MySQL instance
3. Copy connection details from dashboard

---

## Step 2: Set Environment Variables in Render

1. Go to https://dashboard.render.com
2. Click your **honeybee-backend** service
3. Go to **Environment** tab
4. **Delete any old or incomplete variables**
5. **Add these NEW variables** (one by one):

| Variable Name | Value | Example |
|---|---|---|
| `DB_HOST` | From your database provider | `monorail.proxy.rlwy.net` |
| `DB_USER` | From your database provider | `root` |
| `DB_PASSWORD` | From your database provider | `your_actual_password_here` |
| `DB_NAME` | From your database provider | `railway` |
| `DB_SSL` | `true` | `true` |
| `JWT_SECRET` | Random string (keep safe) | `honey_bee_jwt_secret_2024_random123` |
| `CHECKOUT_TOKEN_SECRET` | Random string (keep safe) | `checkout_secret_2024_xyz789` |
| `RAZORPAY_KEY_ID` | From Razorpay dashboard | `rzp_test_xxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | From Razorpay dashboard | `xxxxxxxxxxxxxxxx` |

**⚠️ IMPORTANT**:
- `DB_SSL=true` is required for most cloud databases
- Don't use quotes in values
- Click **Save** after entering each variable

---

## Step 3: Deploy & Test

1. Go back to your **honeybee-backend** service page
2. Scroll down and click **Manual Deploy** (if needed)
3. Or push to GitHub to trigger auto-deploy:
   ```bash
   git add .
   git commit -m "Configure Render database"
   git push
   ```

4. Watch the deploy logs:
   - Click **Deploy Logs** tab
   - You should see: `✅ Connected to MySQL`
   - If you see `❌ DATABASE CONNECTION FAILED`, check your credentials

---

## Step 4: Verify Connection

Test your API:

```bash
curl https://your-service-name.onrender.com/api/health
```

Should return:
```json
{
  "ok": true,
  "database": "connected"
}
```

Or for debugging:
```bash
curl https://your-service-name.onrender.com/
```

Should show:
```
Honeybee backend running on port 10000
```

---

## ❌ Troubleshooting

### Error: `ECONNREFUSED`
- **Cause**: Database host/port is wrong
- **Fix**: Double-check DB_HOST and DB_PORT in Render dashboard

### Error: `Authentication failed`
- **Cause**: DB_USER or DB_PASSWORD is wrong
- **Fix**: Verify credentials from your database provider

### Error: `Unknown database`
- **Cause**: DB_NAME doesn't exist
- **Fix**: Make sure the database name matches what your provider shows

### Server runs but API returns errors
- **Cause**: Database is not properly initialized
- **Fix**: Run `npm run setup` locally to create tables, then sync to Render

---

## Local Development (.env)

Your local `.env` is already set up for localhost. To test locally:

```bash
cd backend
npm install
npm start
```

Visit: http://localhost:10000/api/health

---

## 🎯 Quick Checklist

- [ ] Created MySQL database on Railway/PlanetScale/Aiven
- [ ] Copied DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
- [ ] Added all variables to Render Dashboard → Environment
- [ ] Deployed to Render (manual or git push)
- [ ] Checked deploy logs for `✅ Connected to MySQL`
- [ ] Tested `/api/health` endpoint
- [ ] API endpoints now return data (not empty)

---

Need help? Check Render logs:
1. Go to your service in Render dashboard
2. Click **Logs** tab
3. Search for `DATABASE` or `ERROR`
