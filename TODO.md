# TODO

## Fix Admin Product Image Update - Internal Server Error

### Issue
Admin product image update not working - Internal server error

### Root Cause
The Vercel API (api/index.js) doesn't have the admin routes mounted - only has basic / and /api/health endpoints

### Fix Plan
1. [x] Identify the root cause - api/index.js missing admin routes
2. [x] Fix api/index.js - add multer configuration
3. [x] Fix api/index.js - mount admin routes
4. [x] Fix api/index.js - mount product routes
5. [x] Fix api/index.js - mount other backend routes
6. [x] Update package.json - add backend dependencies

### Files Edited
- api/index.js - Added multer and mounted all backend routes
- package.json - Added backend dependencies (bcryptjs, express, multer, etc.)
