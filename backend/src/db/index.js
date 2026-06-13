import { prisma } from "../lib/prisma.js";

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("\n PostgreSQL connected !!");

        // Seed/Upsert the default Admin
        const email = "amansahuat799959@gmail.com";
        const passwordHash = "$2b$12$BUlhO1hZh057Aw0MJgkDeO2r6GOPMovZz90.5LSJ82acAagDWM98i"; // hash for @Man1619
        
        await prisma.admin.upsert({
            where: { email },
            update: {
                name: "Aman Sahu",
                phoneNumber: "6267718876",
                passwordHash
            },
            create: {
                name: "Aman Sahu",
                email,
                phoneNumber: "6267718876",
                passwordHash
            }
        });
        console.log("Default admin account check complete.");
    } catch (error) {
        console.log("PostgreSQL connection FAILED. Starting server anyway to serve the client frontend. Error details: ", error.message);
    }
};

export default connectDB;