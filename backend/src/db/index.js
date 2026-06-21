import pool from "../config/db.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, "schema.sql");

const connectDB = async () => {
    try {
        // Query to check if the connection works
        await pool.query("SELECT 1");
        console.log("\n PostgreSQL connected !!");

        // Ensure new payment fields exist in donations table and bank details in ngos table
        await pool.query(`
            ALTER TABLE donations ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'PENDING';
            ALTER TABLE donations ADD COLUMN IF NOT EXISTS settlement_status VARCHAR(50) DEFAULT 'SIMULATED_SUCCESS';
            ALTER TABLE donations ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100);
            ALTER TABLE donations ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100);
            ALTER TABLE donations ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;
            ALTER TABLE donations ADD COLUMN IF NOT EXISTS ngo_id UUID REFERENCES ngos(id) ON DELETE SET NULL;
            ALTER TABLE donations ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

            ALTER TABLE ngos ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
            ALTER TABLE ngos ADD COLUMN IF NOT EXISTS account_holder VARCHAR(150);
            ALTER TABLE ngos ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
            ALTER TABLE ngos ADD COLUMN IF NOT EXISTS ifsc VARCHAR(20);
            ALTER TABLE ngos ADD COLUMN IF NOT EXISTS virtual_balance NUMERIC(12, 2) DEFAULT 0;
        `);
        console.log("Database schema columns checked and updated successfully.");

        // Verify if tables are initialized. If not, auto-execute schema.sql
        const tableCheck = await pool.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')"
        );
        const tablesExist = tableCheck.rows[0].exists;

        if (!tablesExist) {
            console.log("Database tables not found. Initializing schema from schema.sql...");
            if (fs.existsSync(schemaPath)) {
                const schemaSql = fs.readFileSync(schemaPath, "utf8");
                await pool.query(schemaSql);
                console.log("Database schema initialized successfully (tables and indexes created).");
            } else {
                throw new Error(`schema.sql file not found at ${schemaPath}`);
            }
        }

        // Seed/Upsert the default Admin
        const email = "amansahuat799959@gmail.com";
        const passwordHash = "$2b$12$BUlhO1hZh057Aw0MJgkDeO2r6GOPMovZz90.5LSJ82acAagDWM98i"; // hash for @Man1619
        const name = "Aman Sahu";
        const phoneNumber = "6267718876";

        // Check if admin already exists by email
        const checkRes = await pool.query("SELECT id FROM admins WHERE email = $1", [email]);
        if (checkRes.rows.length > 0) {
            // Update existing admin
            await pool.query(
                "UPDATE admins SET name = $1, phone_number = $2, password_hash = $3 WHERE email = $4",
                [name, phoneNumber, passwordHash, email]
            );
        } else {
            // Insert new admin
            const id = crypto.randomUUID();
            await pool.query(
                "INSERT INTO admins (id, name, email, phone_number, password_hash, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
                [id, name, email, phoneNumber, passwordHash]
            );
        }
        
        console.log("Default admin account check complete.");
    } catch (error) {
        console.log("PostgreSQL connection FAILED. Starting server anyway to serve the client frontend. Error details: ", error.message);
    }
};

export default connectDB;