//  PUBLIC / MISC — controllers/public.controller.js
// ============================================================
import { prisma } from "../lib/prisma.js";

// ── FAQs ─────────────────────────────────────────────────────

async function listFaqs(req, res) {
  try {
    const { category } = req.query;
    const faqs = await prisma.faq.findMany({
      where: category ? { category: { contains: category, mode: "insensitive" } } : {},
      orderBy: { category: "asc" },
    });
    return res.json(faqs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Testimonials ─────────────────────────────────────────────

async function listTestimonials(req, res) {
  try {
    const testimonials = await prisma.testimonial.findMany({
      include: { user: { select: { id: true, name: true, photoUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return res.json(testimonials);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function createTestimonial(req, res) {
  try {
    const { content, rating } = req.body;

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const testimonial = await prisma.testimonial.create({
      data: { userId: req.user.id, content, rating },
    });
    return res.status(201).json(testimonial);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Newsletter ────────────────────────────────────────────────

async function subscribeNewsletter(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const subscription = await prisma.newsletter.upsert({
      where: { email },
      update: {},                        // already subscribed — idempotent
      create: { email },
    });
    return res.status(201).json({ message: "Subscribed successfully", id: subscription.id });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function unsubscribeNewsletter(req, res) {
  try {
    const { email } = req.body;
    await prisma.newsletter.deleteMany({ where: { email } });
    return res.json({ message: "Unsubscribed successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Contact ───────────────────────────────────────────────────

async function sendContactMessage(req, res) {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required" });
    }

    const contact = await prisma.contactMessage.create({
      data: { name, email, phone, message },
    });

    // Optionally: trigger an email notification to admin here
    return res.status(201).json({ message: "Message received. We'll get back to you soon.", id: contact.id });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ── Locations ─────────────────────────────────────────────────

async function listLocations(req, res) {
  try {
    const { type } = req.query;
    const locations = await prisma.location.findMany({
      where: type ? { type } : {},
      orderBy: { name: "asc" },
    });
    return res.json(locations);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getLocationById(req, res) {
  try {
    const location = await prisma.location.findUnique({ where: { id: req.params.id } });
    if (!location) return res.status(404).json({ message: "Location not found" });
    return res.json(location);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getStats(req, res) {
  try {
    const [donationsCount, animalsCount, ngosCount, volunteersCount] = await Promise.all([
      prisma.donation.count().catch(() => 0),
      prisma.rescueRequest.count({ where: { status: "RESOLVED" } }).catch(() => 0),
      prisma.ngo.count().catch(() => 0),
      prisma.user.count().catch(() => 0)
    ]);

    return res.json({
      success: true,
      data: {
        donations: donationsCount,
        animals: animalsCount,
        ngos: ngosCount,
        volunteers: volunteersCount,
      },
    });
  } catch (err) {
    console.error("Failed to query stats from DB:", err.message);
    return res.json({
      success: true,
      data: {
        donations: 0,
        animals: 0,
        ngos: 0,
        volunteers: 0,
      },
    });
  }
}

async function getLeaderboard(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        photoUrl: true,
        _count: {
          select: {
            campaignsOrganized: true,
            campaignsJoined: true,
            donations: true,
            rescueRequests: true,
            adoptions: true,
          }
        }
      }
    });

    const leaderboard = users.map(user => {
      const organized = user._count.campaignsOrganized || 0;
      const joined = user._count.campaignsJoined || 0;
      const donations = user._count.donations || 0;
      const rescues = user._count.rescueRequests || 0;
      const adoptions = user._count.adoptions || 0;

      const points = (organized * 10) + (joined * 5) + (donations * 5) + (rescues * 8) + (adoptions * 10);

      return {
        id: user.id,
        name: user.name,
        photoUrl: user.photoUrl,
        points
      };
    })
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);

    return res.json(leaderboard);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getAnimalStats(req, res) {
  try {
    const [rescued, adopted, fed, shelters] = await Promise.all([
      prisma.rescueRequest.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }).catch(() => 0),
      prisma.adoption.count({ where: { status: "COMPLETED" } }).catch(() => 0),
      prisma.campaign.count({ where: { type: "ANIMAL_WELFARE", status: "COMPLETED" } }).catch(() => 0),
      prisma.ngo.count({ where: { areaOfWork: "Animal Welfare" } }).catch(() => 0)
    ]);

    return res.json({
      rescued,
      adopted,
      fed,
      shelters
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function getOsmShelters(req, res) {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: "data=" + encodeURIComponent(query),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!response.ok) {
      throw new Error(`Overpass API responded with status ${response.status}`);
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error("Error calling Overpass API:", err.message);
    return res.status(500).json({ message: "Failed to fetch from Overpass API", error: err.message });
  }
}

export const publicController = {
  listFaqs,
  listTestimonials, createTestimonial,
  subscribeNewsletter, unsubscribeNewsletter,
  sendContactMessage,
  listLocations, getLocationById,
  getStats,
  getLeaderboard,
  getAnimalStats,
  getOsmShelters,
};