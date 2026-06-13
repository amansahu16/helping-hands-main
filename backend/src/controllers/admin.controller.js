import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { sendAdminLoginOtp, verifyOtp } from "../services/otp.service.js";

// Helper functions for JWT
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "7d" });
}

function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ── Admin Auth ───────────────────────────────────────────────

async function registerAdmin(req, res) {
  try {
    const { name, email, password, phoneNumber } = req.body;

    if (!name || !email || !password || !phoneNumber) {
      return res.status(400).json({ message: "Name, email, password, and phone number are required" });
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_])[A-Za-z\d!@#$%^&*_]{8,16}$/.test(password)) {
      return res.status(400).json({ message: "Password must be 8 to 16 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special symbol from !@#$%^&*__." });
    }

    const exists = await prisma.admin.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ message: "Email already registered as admin" });

    const passwordHash = await hashPassword(password);

    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        phoneNumber,
        passwordHash,
      },
    });

    return res.status(201).json({
      message: "Admin registered successfully! You can now login.",
      adminId: admin.id,
    });
  } catch (err) {
    console.error("registerAdmin error:", err);
    return res.status(500).json({ message: "Admin registration failed", error: err.message });
  }
}

async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return res.status(401).json({ message: "Invalid admin credentials" });

    const valid = await comparePassword(password, admin.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid admin credentials" });

    // Send login OTP instead of generating token immediately
    await sendAdminLoginOtp(admin.email);

    return res.json({
      success: true,
      requiresOtp: true,
      email: admin.email,
    });
  } catch (err) {
    console.error("loginAdmin error:", err);
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
}

async function verifyLoginOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const valid = await verifyOtp(email, otp);
    if (!valid) {
      return res.status(400).json({ message: "Invalid or expired verification code." });
    }

    const token = signToken({ id: admin.id, role: "admin" });
    return res.json({
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phoneNumber: admin.phoneNumber,
        role: "admin",
      },
    });
  } catch (err) {
    console.error("verifyLoginOtp error:", err);
    return res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
}

// ── Admin Stats ──────────────────────────────────────────────

async function getStats(req, res) {
  try {
    const [
      donationsCount,
      animalsCount,
      ngosCount,
      usersCount,
      campaignsCount,
      complaintsCount,
      openRescues,
      activeRescues,
      resolvedRescues,
      completedCampaigns,
      ongoingCampaigns,
      plannedCampaigns,
      adoptedAnimals,
      animalsFed,
      activeDonationsCount,
      transactionStats
    ] = await Promise.all([
      prisma.donation.count(),
      prisma.animal.count(),
      prisma.ngo.count(),
      prisma.user.count(),
      prisma.campaign.count(),
      prisma.complaint.count(),
      prisma.rescueRequest.count({ where: { status: "OPEN" } }),
      prisma.rescueRequest.count({ where: { status: "ASSIGNED" } }),
      prisma.rescueRequest.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
      prisma.campaign.count({ where: { status: "COMPLETED" } }),
      prisma.campaign.count({ where: { status: "ONGOING" } }),
      prisma.campaign.count({ where: { status: "PLANNED" } }),
      prisma.adoption.count({ where: { status: "COMPLETED" } }),
      prisma.campaign.count({
        where: {
          type: "ANIMAL_WELFARE",
          status: "COMPLETED",
        },
      }),
      prisma.donation.count({
        where: { status: { in: ["ACCEPTED", "PICKED_UP", "DELIVERED"] } }
      }),
      prisma.donation.aggregate({
        where: {
          amount: { not: null }
        },
        _count: true,
        _sum: {
          amount: true
        }
      })
    ]);

    return res.json({
      core: {
        donations: donationsCount,
        animals: animalsCount,
        ngos: ngosCount,
        users: usersCount,
        campaigns: campaignsCount,
        complaints: complaintsCount,
      },
      rescues: {
        open: openRescues,
        active: activeRescues,
        resolved: resolvedRescues,
      },
      campaigns: {
        completed: completedCampaigns,
        ongoing: ongoingCampaigns,
        planned: plannedCampaigns,
      },
      welfare: {
        adopted: adoptedAnimals,
        fed: animalsFed,
      },
      goods: {
        circulated: activeDonationsCount,
      },
      transactions: {
        count: transactionStats._count || 0,
        sum: transactionStats._sum.amount || 0
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── NGO Verification & Management ───────────────────────────

async function listNgos(req, res) {
  try {
    const ngos = await prisma.ngo.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(ngos);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function verifyNgo(req, res) {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    if (verified === undefined) {
      return res.status(400).json({ message: "verified field is required" });
    }

    const ngo = await prisma.ngo.update({
      where: { id },
      data: { verified: !!verified },
    });

    return res.json({ message: `NGO verified status set to ${verified}`, ngo });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Operation Moderator (Discarding operations/users) ────────

async function listOperations(req, res) {
  try {
    const [campaigns, donations, rescues, users, ngos] = await Promise.all([
      prisma.campaign.findMany({ include: { organizerUser: { select: { name: true } }, organizerNgo: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.donation.findMany({ include: { donor: { select: { name: true } }, donorNgo: { select: { name: true } }, recipientNgo: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.rescueRequest.findMany({ include: { reporter: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.user.findMany({ select: { id: true, name: true, email: true, phoneNumber: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
      prisma.ngo.findMany({ select: { id: true, name: true, email: true, registrationNumber: true, verified: true, createdAt: true }, orderBy: { createdAt: "desc" } })
    ]);

    return res.json({ campaigns, donations, rescues, users, ngos });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteOperation(req, res) {
  try {
    const { type, id } = req.params;

    if (type === "campaign") {
      await prisma.campaign.delete({ where: { id } });
    } else if (type === "donation") {
      await prisma.donation.delete({ where: { id } });
    } else if (type === "rescue") {
      await prisma.rescueRequest.delete({ where: { id } });
    } else if (type === "user") {
      await prisma.user.delete({ where: { id } });
    } else if (type === "ngo") {
      await prisma.ngo.delete({ where: { id } });
    } else {
      return res.status(400).json({ message: "Invalid operation type" });
    }

    return res.json({ message: `${type} deleted successfully` });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Contact settings & Office Locations ──────────────────────

async function getContactSettings(req, res) {
  try {
    const settings = await prisma.systemSetting.findMany();
    // Transform array to key-value object
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    // Provide fallbacks if not seeded
    return res.json({
      contact_email: settingsObj.contact_email || "hello@helpinghands.org",
      contact_phone: settingsObj.contact_phone || "+91 12345 67890",
      contact_network: settingsObj.contact_network || "Pan-India (25+ cities)",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function updateContactSettings(req, res) {
  try {
    const { contact_email, contact_phone, contact_network } = req.body;

    if (contact_email) {
      await prisma.systemSetting.upsert({
        where: { key: "contact_email" },
        update: { value: contact_email },
        create: { key: "contact_email", value: contact_email }
      });
    }
    if (contact_phone) {
      await prisma.systemSetting.upsert({
        where: { key: "contact_phone" },
        update: { value: contact_phone },
        create: { key: "contact_phone", value: contact_phone }
      });
    }
    if (contact_network) {
      await prisma.systemSetting.upsert({
        where: { key: "contact_network" },
        update: { value: contact_network },
        create: { key: "contact_network", value: contact_network }
      });
    }

    return res.json({ message: "Contact settings updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function addLocation(req, res) {
  try {
    const { name, address, latitude, longitude, type } = req.body;
    if (!name || !address) {
      return res.status(400).json({ message: "Name and address are required" });
    }

    const location = await prisma.location.create({
      data: {
        name,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        type: type || "GENERAL",
      },
    });

    return res.status(201).json(location);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteLocation(req, res) {
  try {
    const { id } = req.params;
    await prisma.location.delete({ where: { id } });
    return res.json({ message: "Location deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Feedback, Contact Messages & Complaints ──────────────────

async function listFeedbacks(req, res) {
  try {
    const [testimonials, contactMessages, complaints] = await Promise.all([
      prisma.testimonial.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.complaint.findMany({
        include: { reporter: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      })
    ]);

    return res.json({ testimonials, contactMessages, complaints });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function deleteFeedback(req, res) {
  try {
    const { type, id } = req.params;
    if (type === "testimonial") {
      await prisma.testimonial.delete({ where: { id } });
    } else if (type === "message") {
      await prisma.contactMessage.delete({ where: { id } });
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function resolveComplaint(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // RESOLVED | DISMISSED | PENDING

    const complaint = await prisma.complaint.update({
      where: { id },
      data: { status },
    });

    return res.json({ message: `Complaint status updated to ${status}`, complaint });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function reportComplaint(req, res) {
  try {
    const { title, description, targetType, targetId } = req.body;
    if (!title || !description || !targetType || !targetId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const complaint = await prisma.complaint.create({
      data: {
        reporterId: req.user?.id || null,
        title,
        description,
        targetType,
        targetId,
      },
    });

    return res.status(201).json({ message: "Complaint filed successfully", complaint });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

export const adminController = {
  registerAdmin,
  loginAdmin,
  verifyLoginOtp,
  getStats,
  listNgos,
  verifyNgo,
  listOperations,
  deleteOperation,
  getContactSettings,
  updateContactSettings,
  addLocation,
  deleteLocation,
  listFeedbacks,
  deleteFeedback,
  resolveComplaint,
  reportComplaint,
};
