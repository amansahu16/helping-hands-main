import "./src/loadEnv.js";
import pool from "./src/config/db.js";

console.log("Starting DB query test...");
const startTime = Date.now();

try {
  const res = await pool.query("SELECT 1");
  console.log(`DB query returned:`, res.rows);
  console.log(`Query took ${Date.now() - startTime}ms.`);
} catch (error) {
  console.error("DB query error:", error);
}

process.exit(0);
