# Vercel + Render Backend Connection - Deployment Plan

## ✅ Plan Approved
Frontend on Vercel → Backend on Render (https://honeybee-tmr8.onrender.com) → MySQL DB
Current status: Backend deployed but DB failed (ECONNREFUSED).

## Step-by-Step Deployment (Run in order)

### 1. Fix Render Database Connection [Priority]
```
Status: ❌ Database connection failed (ECONNREFUSED)
```
**Action Required:**
1. Go to https://dashboard.render.com → honeybee-backend service → Environment
2. Add these variables (get from Railway/PlanetScale):
   ```
   DB_HOST=monorail.proxy.rlwy.net (or your DB host)
   DB_USER=root
   DB_PASSWORD=your_db_password
   DB_NAME=railway (or your DB name)
   DB_SSL=true
   JWT_SECRET=your_random_secret_32chars
   CHECKOUT_TOKEN_SECRET=another_random_secret
   RAZORPAY_KEY_ID=rzp_test_xxx (from Razorpay)
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```
3. Save → Manual Deploy (or git push)
4. Test: https://honeybee-tmr8.onrender.com/api/health
   Expected: `{"ok":true,"database":"connected"}`

**Full guide:** honey bee/RENDER_DATABASE_SETUP.md

### 2. Connect Frontend to Render Backend [Completed]
```
Status: ✅ Configured
```
- `src/admin/api.js`: `VITE_API_BASE = 'https://honeybee-tmr8.onrender.com'`
- All frontend API calls use this URL

### 3. Deploy Frontend to Vercel
```
cd "honey bee"
npm install
npm run build
```
**Local CLI (recommended):**
```
npx vercel --prod
```
**Or GitHub → Vercel auto-deploy**

**Vercel Environment Variables:**
```
VITE_API_BASE=https://honeybee-tmr8.onrender.com
```

### 4. Test Full Flow
1. Backend health: ✅ https://honeybee-tmr8.onrender.com/api/health
2. Frontend loads: Vercel URL
3. API calls: Products/Orders load from Render
4. Admin panel: Login → Dashboard works

### 5. Local Testing (Already Works)
```
cd honey bee/backend
npm start  # http://localhost:10000
```

## Progress Tracker
- [ ] Step 1: Render DB fixed
- [ ] Step 2: Backend health ✅
- [ ] Step 3: Vercel frontend deployed
- [ ] Step 4: Full e2e test passed

## Commands Ready to Copy
**Test Render:** `curl https://honeybee-tmr8.onrender.com/api/health`

**Deploy Vercel:** `cd "c:/Users/Aditya/OneDrive/Desktop/Backup p/honey bee" && npx vercel --prod`

**Git push:** `git add . && git commit -m "Fix Render DB" && git push`

## Next Action
1️⃣ Set Render env vars → Deploy → Test health endpoint
Share the `/api/health` result after deploy!

