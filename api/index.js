import { createServer } from 'node:http';
import { createRequestListener } from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mysql from 'mysql2/promise';

// Load env
dotenv.config();

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
    const connection = await pool.getConnection();
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

// Static uploads (Vercel public dir would be needed, fallback)
app.use('/uploads', express.static(path.join(process.cwd(), 'backend/uploads')) || (req, res) => res.status(404).json({error: 'uploads not available'}));

// Routes
app.get('/', (_req, res) => res.send('Honeybee backend on Vercel'));

app.get('/api/health', async (_req, res) => {
  const result = await testConnection();
  res.status(result.success ? 200 : 503).json(result);
});

// TODO: Add all backend routes here
// For now, minimal health check
// Full migration needs controllers/routes ported as modules

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
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

