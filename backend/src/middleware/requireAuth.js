import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") 
      ? authHeader.split(" ")[1] 
      : req.cookies?.token; // fallback to cookies if present

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const secret = process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET || "fallback_secret";
    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Role check (can be user or ngo, default to user if not specified)
    const role = (decoded.role || "user").toLowerCase();

    let userOrNgo = null;
    if (role === "user") {
      userOrNgo = await prisma.user.findUnique({ where: { id: decoded.id } });
    } else if (role === "ngo") {
      userOrNgo = await prisma.ngo.findUnique({ where: { id: decoded.id } });
    } else if (role === "admin") {
      userOrNgo = await prisma.admin.findUnique({ where: { id: decoded.id } });
    }

    if (!userOrNgo) {
      return res.status(401).json({ message: "User or NGO not found" });
    }

    // Attach user record with role info to req
    req.user = {
      ...userOrNgo,
      id: userOrNgo.id,
      role: role
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token", error: error.message });
  }
};
