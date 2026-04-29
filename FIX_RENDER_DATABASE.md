# 🔧 Fix Render Database Connection

## ⚠️ I Cannot Give You the Actual Values

**Database credentials are PRIVATE secrets.** I don't have access to your Railway/PlanetScale/Aiven dashboard. You must copy them yourself.

**But don't worry — this guide shows you EXACTLY where to find them.**

---

## Step 1: Find Your Database Provider

You need a cloud MySQL database. The most common free option is **Railway**.

### If you already have a Railway database:
Skip to **Step 2** below.

### If you DON'T have a database yet:
1. Go to https://railway.app
2. Sign in with GitHub
3. Click **New Project** → **Provision MySQL**
4. Wait 2-3 minutes for it to deploy
5. Click on the **MySQL** service
6. Go to the **Connect** tab

---

## Step 2: Copy Your Credentials from Railway

In Railway Dashboard → Your MySQL Service → **Connect** tab, look for:

```
mysql://root:PASSWORD@HOST:PORT/DATABASE
```

**Extract these 4 values:**

| Variable | Where to find | Example |
|----------|--------------|---------|
| **DB_HOST** | After `@` symbol, before `:` | `monorail.proxy.rlwy.net` |
| **DB_PORT** | After `:` symbol, before `/` | `3306` |
| **DB_USER** | After `mysql://` and before `:` | `root` |
| **DB_PASSWORD** | After `:` and before `@` | `abc123XYZ789` |
| **DB_NAME** | After `/` at the end | `railway` |

### ⚠️ CRITICAL: Use the PUBLIC host
- ❌ WRONG: `mysql.railway.internal` (only works inside Railway)
- ✅ CORRECT: `monorail.proxy.rlwy.net` (works from Render)

If you only see `mysql.railway.internal`, look for a **"Public Network"** or **"Public Host"** section in the Connect tab.

---

## Step 3: Add Variables to Render Dashboard

1. Go to https://dashboard.render.com
2. Click your **honeybee-backend** service
3. Click **Environment** tab (on the left)
4. Click **Add Environment Variable**
5. Add EACH of these ONE BY ONE:

```
Key: DB_HOST
Value: monorail.proxy.rlwy.net   (YOUR actual host)

Key: DB_PORT
Value: 3306

Key: DB_USER
Value: root                        (YOUR actual user)

Key: DB_PASSWORD
Value: your_actual_password_here   (YOUR actual password)

Key: DB_NAME
Value: railway                     (YOUR actual database name)

Key: DB_SSL
Value: true
```

**Important rules:**
- ❌ NO quotes around values
- ❌ NO spaces at start/end
- ✅ Copy EXACTLY as shown in Railway
- ✅ Click **Save** after each variable

---

## Step 4: Add Other Required Variables

Also add these (create your own random secrets):

```
Key: JWT_SECRET
Value: honeybee_jwt_secret_2024_random_xyz123

Key: CHECKOUT_TOKEN_SECRET
Value: checkout_secret_2024_abc789_def456
```

If using Razorpay payments:
```
Key: RAZORPAY_KEY_ID
Value: rzp_test_your_actual_key

Key: RAZORPAY_KEY_SECRET
Value: your_actual_razorpay_secret
```

---

## Step 5: Deploy & Test

1. In Render Dashboard, scroll down and click **Manual Deploy**
2. Wait for deployment to finish
3. Check the **Logs** tab — look for:
   - ✅ `Connected to MySQL` = SUCCESS
   - ❌ `DATABASE CONNECTION FAILED` = Check credentials

4. Test in browser:
   ```
   https://your-service-name.onrender.com/api/health
   ```
   Should return: `{"ok": true, "database": "connected"}`

5. If still failing, visit:
   ```
   https://your-service-name.onrender.com/api/debug/database
   ```
   This will show EXACTLY what's wrong (without exposing your password).

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED` | Wrong host or port | Check DB_HOST is public host, not `mysql.railway.internal` |
| `ER_ACCESS_DENIED_ERROR` | Wrong password | Copy password again from Railway, no extra spaces |
| `ER_BAD_DB_ERROR` | Wrong database name | Railway default is `railway`, not `honeybee` |
| `ETIMEDOUT` | SSL missing or blocked | Set `DB_SSL=true`, enable public network in Railway |
| `Connection reset` | SSL not enabled | Set `DB_SSL=true` |

---

## Quick Test Locally First

Before deploying to Render, test locally with the SAME credentials:

1. Create `backend/.env` file:
```env
DB_HOST=monorail.proxy.rlwy.net
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=railway
DB_SSL=true
```

2. Run:
```bash
cd backend
npm install
npm run test-db
```

3. If it says ✅ SUCCESS, those credentials will work on Render too.

---

## Still Stuck?

1. Go to Render → Logs → copy the EXACT error message
2. Go to Railway → Connect → take a screenshot of the connection details
3. Compare the host, user, password character by character

**The #1 mistake is using `mysql.railway.internal` instead of the public host like `monorail.proxy.rlwy.net`.**

