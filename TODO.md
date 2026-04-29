# Backend to Vercel Migration - Progress Tracker

## Approved Plan Steps:

### ✅ Step 0: Create TODO.md (Done)

### ✅ Step 1: Create api/index.js (Vercel handler)
### ✅ Step 2: Update vercel.json
### ✅ Step 3: Update src/admin/api.js

### ⬜ Step 4: npx vercel --prod
```
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### ⬜ Step 3: Update src/admin/api.js
```
VITE_API_BASE = window.location.origin
```

### ⬜ Step 4: npx vercel --prod
- Set env vars during prompts:
  - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL=true
  - JWT_SECRET, CHECKOUT_TOKEN_SECRET
  - RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

### ⬜ Step 5: Test endpoints
- https://[vercel-url]/api/health → {"ok":true,"database":"connected"}

### ⬜ Step 6: Open frontend page

**Current status:** Deploying with npx vercel... Provide DB credentials when prompted. ✅ Steps 1-3 complete

**Commands ready:**
```bash
cd "c:/Users/Aditya/OneDrive/Desktop/Backup p/honey bee"
npx vercel
```

