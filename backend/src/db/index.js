import pg from "pg";
import {DB_NAME} from "../constents.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const connectDB = async () => {
    try {

        const connectionInstance = await pool.connect();

        console.log(
            `\n PostgreSQL connected !! DB HOST: ${connectionInstance.host}`
        );

        connectionInstance.release();

    } catch (error) {

        console.log("PostgreSQL connection FAILED. Starting server anyway to serve the client frontend. Error details: ", error.message);

    }
};

export default connectDB;
export { prisma };
export { pool };