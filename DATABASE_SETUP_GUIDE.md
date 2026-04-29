# 🗄️ Render Backend + MySQL Database Connection Guide

## Problem
Your Render backend is running but cannot connect to the database. This is usually because:
1. Database credentials are missing or incorrect
2. SSL/TLS is required by the cloud MySQL provider but not configured
3. The database server doesn't allow connections from Render's IP

---

## ✅ What I Already Fixed in Your Code

### 1. `render.yaml` — Removed placeholder values
- **Before**: Had fake values like `your_railway_mysql_host` which Render would literally use
- **After**: Clean file with comments — you must set real values in Render Dashboard

### 2. `backend/db.js` — Added SSL support
- Added `DB_SSL` environment variable check
- If `DB_SSL=true` or `DB_SSL=1`, SSL is enabled with `rejectUnauthorized: false`
- Added `connectTimeout: 10000` (10 seconds) to avoid hanging

### 3. `backend/server.js` — Better error logging
- Logs database config on startup (without password)
- Shows detailed error messages if connection fails
- Tells you exactly what to check

---

## 🚀 Step-by-Step Setup

### Step 1: Choose a MySQL Provider

You need a cloud MySQL database. Here are free options:

| Provider | Free Tier | Connection Method |
|----------|-----------|-------------------|
| **Railway** | 500 MB, $5 credit | MySQL 8 |
| **PlanetScale** | 5 GB | MySQL-compatible (Vitess) |
| **Aiven** | 5 GB | MySQL 8 |
| **AlwaysData** | 100 MB | MySQL 8 |
| **LocalTunnel** | N/A | Expose local MySQL |

**Recommended**: Railway (easiest) or PlanetScale (most generous free tier)

---

### Step 2: Create Database & Get Credentials

#### Option A: Railway (Recommended for beginners)

1. Go to [railway.app](https://railway.app) and sign up
2. Click **New Project** → **Provision MySQL**
3. Once created, click on the MySQL service
4. Go to the **Connect** tab
5. You'll see something like:
   ```
   Host: mysql.railway.internal  (or a public host like monorail.proxy.rlwy.net)
   Port: 3306
   User: root
   Password: abc123xyz...
   Database: railway
   ```

6. **Important**: If using from Render (external), use the **public** connection string, not `mysql.railway.internal`

#### Option B: PlanetScale

1. Go to [planetscale.com](https://planetscale.com) and sign up
2. Create a new database
3. Create a new password in the **Connect** tab
4. Select **Connect with: Node.js**
5. You'll get:
   ```
   Host: aws.connect.psdb.cloud
   User: xxxxxxxxxx
   Password: pscale_pw_xxxxxxxx
   Database: your_database_name
   ```

---

### Step 3: Set Environment Variables in Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click your **honeybee-backend** service
3. Go to **Environment** tab
4. Add these environment variables:

| Key | Value | Example |
|-----|-------|---------|
| `DB_HOST` | Your database host | `monorail.proxy.rlwy.net` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD` | Database password | `your_actual_password` |
| `DB_NAME` | Database name | `railway` |
| `DB_SSL` | Enable SSL (usually needed) | `true` |
| `JWT_SECRET` | Random long string | `honeybee_jwt_secret_12345_random` |
| `CHECKOUT_TOKEN_SECRET` | Another random string | `checkout_secret_67890_random` |
| `RAZORPAY_KEY_ID` | Your Razorpay key | `rzp_test_xxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Your Razorpay secret | `xxxxxxxxxxxxxxxx` |

5. Click **Save Changes**

---

### Step 4: Allow Render IP (if needed)

Some providers block external connections by default:

#### For Railway:
- Railway databases are accessible from anywhere by default (using the public host)
- No IP allowlisting needed

#### For PlanetScale:
- PlanetScale uses password-based auth + SSL
- No IP allowlisting needed

#### For other providers (AWS RDS, Google Cloud SQL, etc.):
- You may need to allow Render's outbound IPs
- Render outbound IPs change; check Render docs for current ranges

---

### Step 5: Deploy & Check Logs

1. In Render Dashboard, click **Manual Deploy** → **Deploy latest commit**
2. Wait for build to complete
3. Click on **Logs** tab
4. Look for these messages:
   ```
   📊 Database config: { host: 'your-host', user: 'root', database: 'railway', ssl: 'true' }
   ✅ Connected to MySQL
   ✅ Order tracking columns are ready
   ✅ Coupon tables are ready
   ✅ Coupon discount columns are ready
   ```

5. If you see ❌ errors, the logs will tell you exactly what's wrong

---

### Step 6: Test the Health Endpoint

Open in browser:
```
https://your-render-url.onrender.com/api/health
```

Expected response:
```json
{
  "ok": true,
  "database": "connected"
}
```

If you get `database: "unavailable"`, check the logs for the error code.

---

## 🔧 Common Errors & Fixes

| Error Code | Cause | Fix |
|------------|-------|-----|
| `ECONNREFUSED` | Wrong host or port | Check DB_HOST is correct |
| `ER_ACCESS_DENIED_ERROR` | Wrong password | Check DB_PASSWORD |
| `ENOTFOUND` | Host doesn't exist | Check DB_HOST spelling |
| `Handshake error` | SSL required but not enabled | Set `DB_SSL=true` |
| `PROTOCOL_CONNECTION_LOST` | Network timeout | Check internet/SSL settings |

---

## 🧪 Quick Test Script

Create `test-db.js` in your `backend/` folder:

```javascript
const pool = require('./db.js');

async function test() {
  try {
    const [rows] = await pool.query('SELECT 1 as ok');
    console.log('✅ Database connected:', rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection failed:');
    console.error('   Code:', err.code);
    console.error('   Message:', err.message);
    process.exit(1);
  }
}

test();
```

Run locally (after setting `.env`):
```bash
cd backend
node test-db.js
```

---

## 📋 Checklist Before Deploying

- [ ] Created cloud MySQL database
- [ ] Copied correct host, user, password, database name
- [ ] Added all env vars to Render Dashboard
- [ ] Set `DB_SSL=true` if using cloud provider
- [ ] Set strong `JWT_SECRET` and `CHECKOUT_TOKEN_SECRET`
- [ ] Added Razorpay keys (if using online payments)
- [ ] Deployed and checked logs show "✅ Connected to MySQL"
- [ ] Tested `/api/health` endpoint

---

## 🆘 Still Not Working?

1. **Check Render Logs** — They will show the exact error
2. **Test connection locally** — Use the test script above with the same credentials
3. **Verify SSL** — Most cloud providers REQUIRE SSL; make sure `DB_SSL=true`
4. **Check database is public** — Some providers default to private/internal networks
5. **Try a different provider** — Railway is usually the easiest for beginners

---

## 📝 Files Modified in This Fix

1. `render.yaml` — Removed hardcoded placeholders
2. `backend/db.js` — Added SSL support and timeout
3. `backend/server.js` — Added debug logging and error diagnostics
