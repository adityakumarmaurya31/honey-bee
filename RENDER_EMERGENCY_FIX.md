# 🚨 Emergency Fix: Backend "Not Found" on Render

## Aapka URL: https://honeybee-tmr8.onrender.com

Agar yeh URL "Not Found" de raha hai, toh server crash ho raha hai. **Step-by-step fix karo:**

---

## Step 1: Render Dashboard mein jao

1. https://dashboard.render.com par jao
2. **honeybee-backend** service click karo
3. **Logs** tab click karo (left side menu mein)

**Logs mein kya dikh raha hai?** Yeh text copy-paste karo.

---

## Step 2: Common problems check karo

### Problem A: Service so rahi hai (Free tier)
- **Fix:** "Manual Deploy" button click karo ya service restart karo

### Problem B: Start Command galat hai
- **Check:** Settings tab → Start Command
- **Should be:** `cd backend && node server.js`
- **Agar nahi hai, toh change karo**

### Problem C: Build Command galat hai  
- **Check:** Settings tab → Build Command
- **Should be:** `cd backend && npm install`
- **Agar nahi hai, toh change karo**

### Problem D: Environment variables missing hain
- **Check:** Environment tab
- **Yeh variables hone chahiye:**
```
DB_HOST=monorail.proxy.rlwy.net      (your Railway host)
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=railway
DB_SSL=true
JWT_SECRET=kuch_bhi_random_32_chars
PORT=10000
NODE_ENV=production
```

### Problem E: Code deploy nahi hua
- **Fix:** Manual Deploy → Clear Build Cache & Deploy

---

## Step 3: Sahi settings verify karo

Render Dashboard → honeybee-backend → **Settings** tab:

| Setting | Value |
|---------|-------|
| **Runtime** | Node |
| **Build Command** | `cd backend && npm install` |
| **Start Command** | `cd backend && node server.js` |
| **Branch** | main (ya jo bhi aapki default branch hai) |

---

## Step 4: Force Redeploy

1. Render Dashboard → honeybee-backend
2. Upar right side mein **Manual Deploy** button
3. **Clear Build Cache & Deploy** select karo
4. 3-5 minute wait karo
5. Phir `https://honeybee-tmr8.onrender.com/` open karo

**Should show:** `Honeybee backend running on port 10000`

---

## Step 5: Agar abhi bhi "Not Found" hai

Toh mujhe batao:
1. Logs mein exact error kya hai?
2. Start Command kya set hai?
3. Build Command kya set hai?
4. Environment variables set hain ya nahi?

---

## ⚠️ Important

**Aapne jo maine files update ki hain (db.js, server.js), woh deploy honi chahiye.** 

Agar git se deploy ho raha hai, toh ensure karo ki latest code push hua hai:
```bash
git add .
git commit -m "Fix database connection"
git push origin main
```

Agar zip upload se deploy ho raha hai, toh fresh zip upload karo with updated files.

