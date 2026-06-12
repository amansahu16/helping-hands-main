import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFilePath = path.resolve(__dirname, "../../auth_debug.log");

function writeDebugLog(message) {
  try {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
  } catch (err) {
    console.error("Failed to write to debug log file:", err.message);
  }
}

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") 
      ? authHeader.split(" ")[1] 
      : req.cookies?.token; // fallback to cookies if present

    writeDebugLog(`--- Auth Request received ---`);
    writeDebugLog(`Path: ${req.originalUrl}, Method: ${req.method}`);
    writeDebugLog(`Headers: ${JSON.stringify(req.headers)}`);
    writeDebugLog(`Token extracted: ${token ? `${token.substring(0, 25)}...` : "NONE"}`);

    if (!token) {
      writeDebugLog(`Error: No token found`);
      return res.status(401).json({ message: "Authentication required" });
    }

    const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET || "fallback_secret";
    writeDebugLog(`Using JWT Secret (first 5 chars): ${(secret || "").substring(0, 5)}...`);
    
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
      writeDebugLog(`JWT Verified successfully: ${JSON.stringify(decoded)}`);
    } catch (jwtErr) {
      writeDebugLog(`JWT Verification failed: ${jwtErr.message}`);
      return res.status(401).json({ message: "Unauthorized: Invalid token", error: jwtErr.message });
    }

    if (!decoded || !decoded.id) {
      writeDebugLog(`Error: Decoded token lacks id: ${JSON.stringify(decoded)}`);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Role check (can be user or ngo, default to user if not specified)
    const role = (decoded.role || "user").toLowerCase();
    writeDebugLog(`Decoded ID: ${decoded.id}, Role: ${role}`);

    let userOrNgo = null;
    if (role === "user") {
      userOrNgo = await prisma.user.findUnique({ where: { id: decoded.id } });
    } else if (role === "ngo") {
      userOrNgo = await prisma.ngo.findUnique({ where: { id: decoded.id } });
    } else if (role === "admin") {
      userOrNgo = await prisma.admin.findUnique({ where: { id: decoded.id } });
    }

    if (!userOrNgo) {
      writeDebugLog(`Error: DB lookup returned null for role ${role} and ID ${decoded.id}`);
      return res.status(401).json({ message: "User or NGO not found" });
    }

    writeDebugLog(`User/NGO found in DB: ${userOrNgo.name || userOrNgo.email || "No Name"}`);

    // Attach user record with role info to req
    req.user = {
      ...userOrNgo,
      id: userOrNgo.id,
      role: role
    };

    next();
  } catch (error) {
    writeDebugLog(`Exception caught in requireAuth middleware: ${error.stack}`);
    return res.status(401).json({ message: "Unauthorized: Invalid token", error: error.message });
  }
};
