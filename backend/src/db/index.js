import { prisma } from "../lib/prisma.js";

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("\n PostgreSQL connected !!");

        // Seed/Upsert the default Admin
        const email = "amantest045@gmail.com";
        const passwordHash = "$2b$12$EONxQJD056rGi6Pzs1c5Xea7u8Rm.J6hwTLha20XftSynY8anoGQu"; // hash for aman1619
        
        await prisma.admin.upsert({
            where: { email },
            update: {
                name: "Aman Sahu",
                phoneNumber: "9999999999",
                passwordHash
            },
            create: {
                name: "Aman Sahu",
                email,
                phoneNumber: "9999999999",
                passwordHash
            }
        });
        console.log("Default admin account check complete.");
    } catch (error) {
        console.log("PostgreSQL connection FAILED. Starting server anyway to serve the client frontend. Error details: ", error.message);
    }
};

export default connectDB;