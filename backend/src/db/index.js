import pool from "../config/db.js";
import crypto from "crypto";

const connectDB = async () => {
    try {
        // Query to check if the connection works
        await pool.query("SELECT 1");
        console.log("\n PostgreSQL connected !!");

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