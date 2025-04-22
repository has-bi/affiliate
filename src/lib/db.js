// src/lib/db.js
import { Pool } from "pg";

let pool;

/**
 * Initialize or get the connection pool to PostgreSQL
 */
export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Needed for Neon's SSL connection
      },
    });

    // Log connection success or error
    pool.on("connect", () => {
      console.log("Connected to Neon PostgreSQL database");
    });

    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
      process.exit(-1);
    });
  }

  return pool;
}

/**
 * Execute a SQL query
 *
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters (optional)
 * @returns {Promise<Object>} Query result
 */
export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();

  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    console.log("Executed query", { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error("Error executing query", { text, error });
    throw error;
  }
}

/**
 * Close all database connections
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("Database pool closed");
  }
}
