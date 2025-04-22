// scripts/init-db.js
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

async function initializeDatabase() {
  // Create a connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Needed for Neon's SSL connection
    },
  });

  try {
    console.log("Connecting to database...");

    // Read the schema SQL file
    const schemaPath = path.join(__dirname, "../src/lib/db/schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    console.log("Executing schema creation...");

    // Execute the schema
    await pool.query(schemaSql);

    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the initialization
initializeDatabase()
  .then(() => {
    console.log("Database setup completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Database setup failed:", err);
    process.exit(1);
  });
