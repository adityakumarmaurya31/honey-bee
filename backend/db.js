const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Build SSL config based on environment
function getSSLConfig() {
  const sslEnv = (process.env.DB_SSL || '').toLowerCase().trim();
  const needsSSL = sslEnv === 'true' || sslEnv === '1' || sslEnv === 'yes';

  if (needsSSL) {
    return {
      rejectUnauthorized: false, // Required for most cloud providers (Railway, PlanetScale, etc.)
    };
  }

  // For local development or if explicitly disabled
  return undefined;
}

// Parse port from env or default to 3306
const dbPort = parseInt(process.env.DB_PORT, 10) || 3306;

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: dbPort,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'honeybee',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: getSSLConfig(),
  connectTimeout: 15000, // 15 seconds
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// Export a helper to test connection and return detailed diagnostics
async function testConnection() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: dbPort,
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'honeybee',
    ssl: process.env.DB_SSL || 'not set',
    passwordSet: !!(process.env.DB_PASSWORD),
  };

  try {
    const [rows] = await pool.query('SELECT 1 as connection_test');
    return {
      success: true,
      config,
      message: 'Connected successfully',
    };
  } catch (error) {
    return {
      success: false,
      config,
      error: {
        code: error.code || 'UNKNOWN',
        message: error.message,
        sqlState: error.sqlState,
        errno: error.errno,
      },
      hints: getErrorHints(error, config),
    };
  }
}

function getErrorHints(error, config) {
  const hints = [];

  if (error.code === 'ECONNREFUSED') {
    hints.push('Cannot reach database server. Check DB_HOST and DB_PORT.');
    hints.push(`Current host: ${config.host}, port: ${config.port}`);
    hints.push('If using Railway: use PUBLIC host (monorail.proxy.rlwy.net), NOT mysql.railway.internal');
    hints.push('If using PlanetScale: host should be something like aws.connect.psdb.cloud');
  }

  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    hints.push('Wrong username or password.');
    hints.push('Check DB_USER and DB_PASSWORD in Render Dashboard.');
    hints.push('Make sure there are no extra spaces or quotes in the values.');
  }

  if (error.code === 'ER_BAD_DB_ERROR') {
    hints.push(`Database "${config.database}" does not exist on this server.`);
    hints.push('Check DB_NAME. For Railway, it is usually "railway".');
    hints.push('You may need to run the schema.sql file to create the database.');
  }

  if (error.code === 'ETIMEDOUT') {
    hints.push('Connection timed out. The database server may be blocking Render\'s IP.');
    hints.push('Enable public/network access in your database provider settings.');
    hints.push('Make sure DB_SSL=true for cloud databases.');
  }

  if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
    hints.push('Connection was reset. This often happens when SSL is required but not enabled.');
    hints.push('Set DB_SSL=true in your environment variables.');
  }

  if (config.ssl === 'not set' || config.ssl === 'false') {
    hints.push('DB_SSL is not enabled. Most cloud providers REQUIRE SSL.');
    hints.push('Set DB_SSL=true in Render Dashboard Environment variables.');
  }

  if (!config.passwordSet) {
    hints.push('DB_PASSWORD is not set! You must set this in Render Dashboard.');
  }

  if (hints.length === 0) {
    hints.push('Unknown error. Check Render logs for full details.');
    hints.push('Verify all environment variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL');
  }

  return hints;
}

module.exports = pool;
module.exports.testConnection = testConnection;

