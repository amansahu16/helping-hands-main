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
    const donationsCount = await prisma.donation.count();
    const animalsCount = await prisma.rescueRequest.count({ where: { status: "RESOLVED" } });
    const ngosCount = await prisma.ngo.count();
    const volunteersCount = await prisma.user.count();

    return res.json({
      success: true,
      data: {
        donations: donationsCount,
        animals: animalsCount,
        ngos: ngosCount,
        volunteers: volunteersCount
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
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
    const rescued = await prisma.rescueRequest.count({
      where: { status: { in: ["RESOLVED", "CLOSED"] } }
    });
    const adopted = await prisma.adoption.count({
      where: { status: "COMPLETED" }
    });
    const fed = await prisma.campaign.count({
      where: {
        type: "ANIMAL_WELFARE",
        status: "COMPLETED"
      }
    });
    const shelters = await prisma.ngo.count({
      where: {
        areaOfWork: "Animal Welfare"
      }
    });

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
 
export const publicController = {
  listFaqs,
  listTestimonials, createTestimonial,
  subscribeNewsletter, unsubscribeNewsletter,
  sendContactMessage,
  listLocations, getLocationById,
  getStats,
  getLeaderboard,
  getAnimalStats,
};