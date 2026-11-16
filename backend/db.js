const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const dbPort = parseInt(process.env.DB_PORT, 10) || 5432;
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sslEnabled = ['true', '1', 'yes', 'require'].includes((process.env.DB_SSL || '').toLowerCase().trim());

const poolConfig = databaseUrl
  ? { connectionString: databaseUrl, ssl: sslEnabled ? { rejectUnauthorized: false } : undefined }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: dbPort,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'honeybee',
      max: 10,
      connectionTimeoutMillis: 15000,
      ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
    };

const pgPool = new Pool(poolConfig);

function buildQuery(sql, params = []) {
  let index = 0;
  const values = [];
  const text = sql
    .replace(/IFNULL\s*\(/gi, 'COALESCE(')
    .replace(/\?/g, () => {
      const value = params[index++];

      if (Array.isArray(value)) {
        if (value.length > 0 && Array.isArray(value[0])) {
          return value.map((row) => `(${row.map((item) => {
            values.push(item);
            return `$${values.length}`;
          }).join(', ')})`).join(', ');
        }

        return value.map((item) => {
          values.push(item);
          return `$${values.length}`;
        }).join(', ') || 'NULL';
      }

      values.push(value);
      return `$${values.length}`;
    });

  return { text, values };
}

function normalizeRow(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => {
    const normalizedKey = {
      paymentmethod: 'paymentMethod',
      trackingnumber: 'trackingNumber',
      trackingassignedat: 'trackingAssignedAt',
    }[key] || key;
    return [normalizedKey, value];
  }));
}

async function executeQuery(executor, sql, params = []) {
  const isInsert = /^\s*INSERT\s+INTO\s/i.test(sql);
  const statement = isInsert && !/\bRETURNING\b/i.test(sql)
    ? `${sql.trim().replace(/;$/, '')} RETURNING id`
    : sql;
  const result = await executor.query(buildQuery(statement, params));

  if (/^\s*SELECT\b/i.test(sql) || /\bRETURNING\b/i.test(sql)) {
    return [result.rows.map(normalizeRow), result.fields];
  }

  return [{
    insertId: result.rows[0]?.id,
    affectedRows: result.rowCount,
    rowCount: result.rowCount,
    rows: result.rows,
  }, result.fields];
}

async function query(sql, params = []) {
  return executeQuery(pgPool, sql, params);
}

function createConnection(client) {
  return {
    query: (sql, params = []) => executeQuery(client, sql, params),
    async beginTransaction() { await client.query('BEGIN'); },
    async commit() { await client.query('COMMIT'); },
    async rollback() { await client.query('ROLLBACK'); },
    release() { client.release(); },
  };
}

const pool = {
  query,
  async getConnection() {
    return createConnection(await pgPool.connect());
  },
  async end() {
    await pgPool.end();
  },
};

async function testConnection() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: dbPort,
    user: process.env.DB_USER || 'postgres',
    database: process.env.DB_NAME || 'honeybee',
    ssl: process.env.DB_SSL || 'not set',
    passwordSet: !!(process.env.DB_PASSWORD || databaseUrl),
  };

  try {
    await pool.query('SELECT 1 AS connection_test');
    return { success: true, config, message: 'Connected successfully' };
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

  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    hints.push('Check the public Aiven PostgreSQL host and DB_PORT=5432.');
  }
  if (error.code === '28P01') hints.push('Wrong PostgreSQL username or password.');
  if (error.code === '3D000') hints.push(`Database "${config.database}" does not exist on this PostgreSQL server.`);
  if (error.code === 'ETIMEDOUT') hints.push('Connection timed out. Check Aiven public access and DB_SSL=true.');
  if (config.ssl === 'not set' || config.ssl === 'false') hints.push('Aiven PostgreSQL normally requires DB_SSL=true.');
  if (!config.passwordSet) hints.push('DB_PASSWORD or DATABASE_URL is not set.');
  if (hints.length === 0) hints.push('Verify DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, and DB_SSL.');

  return hints;
}

module.exports = pool;
module.exports.testConnection = testConnection;