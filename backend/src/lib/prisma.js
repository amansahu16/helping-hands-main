
import { PrismaClient } from "../generated/prisma/index.js";

export const prisma = new PrismaClient();

console.log(typeof prisma.user);