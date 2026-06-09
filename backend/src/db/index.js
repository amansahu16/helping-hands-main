import { prisma } from "../lib/prisma.js";

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("\n PostgreSQL connected !!");
    } catch (error) {
        console.log("PostgreSQL connection FAILED. Starting server anyway to serve the client frontend. Error details: ", error.message);
    }
};

export default connectDB;