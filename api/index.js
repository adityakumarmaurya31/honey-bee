import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

// Load env
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    await connection.ping();
    connection.release();
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.code || error.message,
      config: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL,
        passwordSet: !!process.env.DB_PASSWORD
      },
      hints: [
        'Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in Vercel env',
        'DB_SSL=true for external DBs',
        'Check Railway/PlanetScale dashboard for credentials'
      ]
    };
  }
}

// Express app
const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads directory
const uploadsDir = path.join(__dirname, '..', 'backend', 'uploads');
if (fs.existsSync(uploadsDir)) {
  app.use('/uploads', express.static(uploadsDir));
}

// Health check endpoint
app.get('/', (_req, res) => res.send('Honeybee backend on Vercel'));

app.get('/api/health', async (_req, res) => {
  const result = await testConnection();
  res.status(result.success ? 200 : 503).json(result);
});

// Import backend routes
let adminRoutes, productRoutes, orderRoutes, enquiryRoutes, galleryRoutes, couponRoutes;

try {
  // Admin routes (includes authentication and product CRUD with file upload)
  const adminModule = await import('../backend/routes/admin.js');
  adminRoutes = adminModule.default;
  
  // Product routes (public read-only)
  const productModule = await import('../backend/routes/products.js');
  productRoutes = productModule.default;
  
  // Order routes
  const orderModule = await import('../backend/routes/orderRoutes.js');
  orderRoutes = orderModule.default;
  
  // Enquiry routes
  const enquiryModule = await import('../backend/routes/enquiryRoutes.js');
  enquiryRoutes = enquiryModule.default;
  
  // Gallery routes
  const galleryModule = await import('../backend/routes/galleryRoutes.js');
  galleryRoutes = galleryModule.default;
  
  // Coupon routes
  const couponModule = await import('../backend/routes/couponRoutes.js');
  couponRoutes = couponModule.default;
  
  console.log('✅ All backend routes imported successfully');
} catch (err) {
  console.error('❌ Failed to import backend routes:', err.message);
}

// Mount admin routes under /api/admin
if (adminRoutes) {
  app.use('/api/admin', adminRoutes);
}

// Mount product routes under /api/products
if (productRoutes) {
  app.use('/api/products', productRoutes);
}

// Mount order routes under /api/orders
if (orderRoutes) {
  app.use('/api/orders', orderRoutes);
}

// Mount enquiry routes under /api/enquiries
if (enquiryRoutes) {
  app.use('/api/enquiries', enquiryRoutes);
}

// Mount gallery routes under /api/gallery
if (galleryRoutes) {
  app.use('/api/gallery', galleryRoutes);
}

// Mount coupon routes under /api/coupons
if (couponRoutes) {
  app.use('/api/coupons', couponRoutes);
}

// Error handler
app.use((err, _req, res, _next) => {
  console.error('API Error:', err);
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Image is too large. Please upload an image under 5 MB.'
      : err.message;
    return res.status(400).json({ message, code: err.code });
  }

  res.status(500).json({
    message: err.message || 'Internal server error',
    error: err.name || 'ServerError',
  });
});

// Vercel export
export default async function handler(req, res) {
  return new Promise((resolve) => {
    app(req, res, () => {
      res.status(404).end();
      resolve();
    });
  });
}

// For Vercel to detect serverless function
export const config = {
  api: {
    bodyParser: false,
  },
};
