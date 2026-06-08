//  AUTH — controllers/auth.controller.js
// ============================================================
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import { prisma } from "../lib/prisma.js";
import { sendOtp, verifyOtp } from "../services/otp.service.js";
import { uploadOnCloudinary, uploadSingleImage } from "../utils/cloudinary.js";

// ── helpers ─────────────────────────────────────────────────

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ── User auth ────────────────────────────────────────────────

async function registerUser(req, res) {
  try {
    const {
      name, email, password, phoneNumber, location,
      latitude, longitude, photoBase64, dateOfBirth, occupation
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    if (!/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8}$/.test(password)) {
      return res.status(400).json({ message: "Password must be exactly 8 characters long and alphanumeric" });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await hashPassword(password);

    // Store profile photo to Cloudinary
    const photoUrl = photoBase64 ? await uploadSingleImage(photoBase64) : null;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phoneNumber: phoneNumber || null,
        location: location || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        photoUrl,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        occupation: occupation || null,
        otpVerified: true, // Auto-verify for dev (change to false in prod with real email)
      },
    });

    // Still send OTP for UX (in dev it logs to console with code 123456)
    try { await sendOtp(email); } catch { }

    return res.status(201).json({
      message: "Registered successfully! You can now login.",
      userId: user.id,
    });
  } catch (err) {
    console.error("registerUser error:", err);
    return res.status(500).json({ message: "Registration failed", error: err.message });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

    let user = null;

    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else {
      user = await prisma.user.findFirst({ where: { phoneNumber: phone } });
    }

    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (!user.otpVerified) {
      return res.status(403).json({ message: "Email not verified. Please verify your OTP first." });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ id: user.id, role: "user" });
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        photoUrl: user.photoUrl,
        location: user.location,
      },
    });
  } catch (err) {
    console.error("loginUser error:", err);
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
}

async function verifyUserOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const valid = await verifyOtp(email, otp);
    if (!valid) return res.status(400).json({ message: "Invalid or expired OTP. (Use 123456 for testing)" });

    await prisma.user.update({ where: { email }, data: { otpVerified: true } });
    return res.json({ message: "Email verified successfully" });
  } catch (err) {
    return res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
}

async function resendUserOtp(req, res) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });
    await sendOtp(email);
    return res.json({ message: "OTP resent" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function forgotUserPassword(req, res) {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) await sendOtp(email, "reset");
  return res.json({ message: "If that email exists, a reset OTP has been sent." });
}

async function resetUserPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    const valid = await verifyOtp(email, otp);
    if (!valid) return res.status(400).json({ message: "Invalid or expired OTP" });

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { email }, data: { passwordHash } });
    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── NGO auth ─────────────────────────────────────────────────

async function registerNgo(req, res) {
  try {
    const {
      name, email, password, phoneNumber, registrationNumber,
      location, latitude, longitude, areaOfWork, description, photoBase64, certificateBase64, certificateUrl
    } = req.body;

    if (!name || !email || !password || !registrationNumber) {
      return res.status(400).json({
        message: "Organization name, email, password, and registration number are required"
      });
    }

    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    if (!/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8}$/.test(password)) {
      return res.status(400).json({ message: "Password must be exactly 8 characters long and alphanumeric" });
    }

    const emailExists = await prisma.ngo.findUnique({ where: { email } });
    if (emailExists) return res.status(409).json({ message: "Email already registered" });

    if (registrationNumber) {
      const regExists = await prisma.ngo.findUnique({ where: { registrationNumber } });
      if (regExists) return res.status(409).json({ message: "Registration number already exists" });
    }

    const passwordHash = await hashPassword(password);
    // Store NGO photo to Cloudinary
    const photoUrl = photoBase64 ? await uploadSingleImage(photoBase64) : null;
    const finalCertificateUrl = certificateBase64 ? await uploadSingleImage(certificateBase64) : (certificateUrl || null);

    const ngo = await prisma.ngo.create({
      data: {
        name,
        email,
        passwordHash,
        phoneNumber: phoneNumber || null,
        registrationNumber,
        location: location || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        photoUrl,
        certificateUrl: finalCertificateUrl,
        areaOfWork: areaOfWork || null,
        description: description || null,
        otpVerified: true,  // Auto-verify for dev
        verified: false,     // Pending admin approval
      },
    });

    try { await sendOtp(email); } catch { }

    return res.status(201).json({
      message: "NGO registered successfully! You can now login.",
      ngoId: ngo.id,
    });
  } catch (err) {
    console.error("registerNgo error:", err);
    return res.status(500).json({ message: err.message });
  }
}

async function loginNgo(req, res) {
  try {
    const { email, password, registrationNumber } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const ngo = await prisma.ngo.findUnique({ where: { email } });
    if (!ngo) return res.status(401).json({ message: "Invalid credentials" });

    // Allow login even if not otpVerified (auto-verified in dev)
    if (!ngo.otpVerified) {
      return res.status(403).json({ message: "Email not verified. Please check your email." });
    }

    // Require admin approval before login
    if (!ngo.verified) return res.status(403).json({ message: "NGO pending admin verification/approval" });

    const valid = await comparePassword(password, ngo.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ id: ngo.id, role: "ngo" });
    return res.json({
      token,
      user: {
        id: ngo.id,
        name: ngo.name,
        email: ngo.email,
        phoneNumber: ngo.phoneNumber,
        photoUrl: ngo.photoUrl,
        location: ngo.location,
        registrationNumber: ngo.registrationNumber,
        verified: ngo.verified,
      },
    });
  } catch (err) {
    console.error("loginNgo error:", err);
    return res.status(500).json({ message: err.message });
  }
}

async function verifyNgoOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const valid = await verifyOtp(email, otp);
    if (!valid) return res.status(400).json({ message: "Invalid or expired OTP. (Use 123456 for testing)" });

    await prisma.ngo.update({ where: { email }, data: { otpVerified: true } });
    return res.json({ message: "Email verified. You can now login." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function resendNgoOtp(req, res) {
  try {
    const { email } = req.body;
    const ngo = await prisma.ngo.findUnique({ where: { email } });
    if (!ngo) return res.status(404).json({ message: "NGO not found" });
    await sendOtp(email);
    return res.json({ message: "OTP resent" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function forgotNgoPassword(req, res) {
  const { email } = req.body;
  const ngo = await prisma.ngo.findUnique({ where: { email } });
  if (ngo) await sendOtp(email, "reset");
  return res.json({ message: "If that email exists, a reset OTP has been sent." });
}

async function resetNgoPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    const valid = await verifyOtp(email, otp);
    if (!valid) return res.status(400).json({ message: "Invalid or expired OTP" });

    const passwordHash = await hashPassword(newPassword);
    await prisma.ngo.update({ where: { email }, data: { passwordHash } });
    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Shared ───────────────────────────────────────────────────

async function logout(req, res) {
  return res.json({ message: "Logged out successfully" });
}

async function getMe(req, res) {
  const { id, role } = req.user;
  if (role === "user") {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phoneNumber: true,
        photoUrl: true, location: true, occupation: true
      },
    });
    return res.json(user);
  }
  if (role === "ngo") {
    const ngo = await prisma.ngo.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, phoneNumber: true,
        photoUrl: true, location: true, verified: true,
        registrationNumber: true, areaOfWork: true, description: true
      },
    });
    return res.json(ngo);
  }
  return res.status(400).json({ message: "Unknown role" });
}

async function uploadPhoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const localPath = req.file.path;

    // Read file to base64 first as a foolproof fallback
    let fallbackUrl = null;
    try {
      const fileBuffer = fs.readFileSync(localPath);
      const mimeType = req.file.mimetype || "image/jpeg";
      fallbackUrl = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
    } catch (err) {
      console.error("Failed to generate fallback base64:", err.message);
    }

    // Upload to Cloudinary
    const response = await uploadOnCloudinary(localPath);
    if (response && (response.secure_url || response.url)) {
      return res.json({
        message: "Photo uploaded to Cloudinary successfully",
        url: response.secure_url || response.url,
      });
    }

    return res.status(500).json({ message: "Failed to upload photo to Cloudinary" });
  } catch (err) {
    console.error("uploadPhoto error:", err);
    return res.status(500).json({ message: "Upload failed", error: err.message });
  }
}

export const authController = {
  registerUser, loginUser, verifyUserOtp, resendUserOtp, forgotUserPassword, resetUserPassword,
  registerNgo, loginNgo, verifyNgoOtp, resendNgoOtp, forgotNgoPassword, resetNgoPassword,
  logout, getMe, uploadPhoto,
};