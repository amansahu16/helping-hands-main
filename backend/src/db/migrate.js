import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, "schema.sql");

async function migrate() {
    try {
        console.log("Starting PostgreSQL database migration...");
        
        // Drop compat schema if exists to start fresh
        console.log("Dropping existing compatibility schema if any...");
        await pool.query("DROP SCHEMA IF EXISTS compat CASCADE");

        // 1. Get all tables in the public schema
        const tablesRes = await pool.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
        );
        const tables = tablesRes.rows.map(r => r.table_name);
        
        if (tables.length > 0) {
            console.log(`Dropping existing tables: ${tables.join(", ")}`);
            for (const table of tables) {
                await pool.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
            }
        } else {
            console.log("No tables to drop.");
        }
        
        // 2. Get all custom user-defined types (enums) in the public schema and drop them
        const typesRes = await pool.query(`
            SELECT t.typname 
            FROM pg_type t 
            JOIN pg_namespace n ON n.oid = t.typnamespace 
            WHERE n.nspname = 'public' 
              AND t.typtype = 'e'
        `);
        const types = typesRes.rows.map(r => r.typname);
        if (types.length > 0) {
            console.log(`Dropping custom types/enums: ${types.join(", ")}`);
            for (const type of types) {
                await pool.query(`DROP TYPE IF EXISTS "${type}" CASCADE`);
            }
        } else {
            console.log("No custom types/enums to drop.");
        }

        // 3. Read and execute schema.sql
        if (fs.existsSync(schemaPath)) {
            console.log(`Reading schema.sql from: ${schemaPath}`);
            const schemaSql = fs.readFileSync(schemaPath, "utf8");
            console.log("Executing schema.sql to recreate tables, constraints, and indexes...");
            await pool.query(schemaSql);
            console.log("Database schema initialized successfully.");
        } else {
            throw new Error(`schema.sql not found at ${schemaPath}`);
        }

        // 4. Seed the default admin
        console.log("Checking and seeding default admin account...");
        const email = "amansahuat799959@gmail.com";
        const passwordHash = "$2b$12$BUlhO1hZh057Aw0MJgkDeO2r6GOPMovZz90.5LSJ82acAagDWM98i"; // hash for @Man1619
        const name = "Aman Sahu";
        const phoneNumber = "6267718876";
        const id = crypto.randomUUID();

        // Inserts default admin directly into public.accounts table
        await pool.query(
            "INSERT INTO public.accounts (id, name, email, password_hash, phone_number, role, otp_verified, created_at) VALUES ($1, $2, $3, $4, $5, 'ADMIN', TRUE, NOW()) ON CONFLICT (email) DO UPDATE SET name = $2, phone_number = $5, password_hash = $4",
            [id, name, email, passwordHash, phoneNumber]
        );
        console.log("Default admin account check complete.");
        console.log("PostgreSQL schema migration completed successfully!");
        
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        await pool.end();
        process.exit(1);
    }
}

migrate();
