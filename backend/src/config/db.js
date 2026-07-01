import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                  // Allow up to 20 concurrent connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Terminate connection attempts after 2 seconds
});

pool.on("connect", () => {
  // Connection succeeded
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

// Helper to convert snake_case string to camelCase
export function snakeToCamel(str) {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", "")
  );
}

// Helper to convert camelCase string to snake_case (useful for dynamic SQL queries)
export function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// Deep/shallow convert database row keys from snake_case to camelCase
export function mapRowKeys(row) {
  if (!row) return null;
  const newRow = {};
  for (const key of Object.keys(row)) {
    // If the value is a nested object and not an array/date, map its keys recursively
    const val = row[key];
    if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      newRow[snakeToCamel(key)] = mapRowKeys(val);
    } else {
      newRow[snakeToCamel(key)] = val;
    }
  }
  return newRow;
}

export function mapRows(rows) {
  if (!rows) return [];
  return rows.map(mapRowKeys);
}

export default pool;
