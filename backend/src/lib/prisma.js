import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

console.log(Object.keys(prisma));