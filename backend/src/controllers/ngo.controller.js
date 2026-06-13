//  NGO — controllers/ngo.controller.js
// ============================================================
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { uploadSingleImage } from "../utils/cloudinary.js";
 
async function listNgos(req, res) {
  try {
    const { verified, location, page = 1, limit = 50 } = req.query;
    const ngos = await prisma.ngo.findMany({
      where: {
        ...(verified !== undefined && { verified: verified === "true" }),
        ...(location && { location: { contains: location, mode: "insensitive" } }),
      },
      select: {
        id: true, name: true, email: true, phoneNumber: true, location: true,
        photoUrl: true, verified: true, areaOfWork: true, description: true,
        registrationNumber: true, createdAt: true,
        latitude: true, longitude: true, upiId: true,
        _count: { select: { contributors: true } }
      },
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });
    return res.json(ngos);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getNgoById(req, res) {
  try {
    const ngo = await prisma.ngo.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, phoneNumber: true,
        registrationNumber: true, location: true, photoUrl: true, verified: true, createdAt: true,
        areaOfWork: true, description: true, achievements: true, workDone: true,
        latitude: true, longitude: true, upiId: true, websiteUrl: true,
      },
    });
    if (!ngo) return res.status(404).json({ message: "NGO not found" });
    return res.json(ngo);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getNgoPosts(req, res) {
  try {
    const posts = await prisma.ngoPost.findMany({
      where: { ngoId: req.params.id },
      orderBy: { createdAt: "desc" },
    });
    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getMyProfile(req, res) {
  try {
    const ngo = await prisma.ngo.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, phoneNumber: true,
        registrationNumber: true, location: true, photoUrl: true,
        verified: true, otpVerified: true, createdAt: true,
        areaOfWork: true, description: true, achievements: true, workDone: true,
        upiId: true, websiteUrl: true,
      },
    });
    return res.json(ngo);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateMyProfile(req, res) {
  try {
    const { name, phoneNumber, location, photoUrl, registrationNumber, areaOfWork, description, achievements, workDone, upiId, websiteUrl } = req.body;
    
    let finalPhotoUrl = photoUrl;
    if (photoUrl && photoUrl.startsWith("data:")) {
      finalPhotoUrl = await uploadSingleImage(photoUrl);
    }

    const updated = await prisma.ngo.update({
      where: { id: req.user.id },
      data: { name, phoneNumber, location, photoUrl: finalPhotoUrl, registrationNumber, areaOfWork, description, achievements, workDone, upiId, websiteUrl },
      select: { 
        id: true, name: true, email: true, photoUrl: true, phoneNumber: true, location: true,
        registrationNumber: true, areaOfWork: true, description: true, achievements: true, workDone: true,
        upiId: true, websiteUrl: true,
      },
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const ngo = await prisma.ngo.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, ngo.passwordHash);
    if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_])[A-Za-z\d!@#$%^&*_]{8,16}$/.test(newPassword)) {
      return res.status(400).json({ message: "New password must be 8 to 16 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special symbol from !@#$%^&*__." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.ngo.update({ where: { id: req.user.id }, data: { passwordHash } });
    return res.json({ message: "Password changed" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getMyDonations(req, res) {
  try {
    const donations = await prisma.donation.findMany({
      where: { recipientNgoId: req.user.id },
      include: {
        items: true,
        donor: { select: { id: true, name: true, phoneNumber: true } },
        donorNgo: { select: { id: true, name: true, phoneNumber: true } }
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(donations);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getNearbyRescueRequests(req, res) {
  try {
    const ngo = await prisma.ngo.findUnique({ where: { id: req.user.id } });
    if (!ngo) return res.status(404).json({ message: "NGO not found" });

    // Fetch all open rescue requests or requests assigned to this NGO
    const rescues = await prisma.rescueRequest.findMany({
      where: {
        OR: [
          { status: "OPEN" },
          { nearbyCenterId: req.user.id }
        ]
      },
      include: { reporter: { select: { id: true, name: true, phoneNumber: true } } },
      orderBy: { createdAt: "desc" },
    });

    let results = rescues;
    if (ngo.latitude && ngo.longitude) {
      results = rescues.map(r => {
        if (r.latitude && r.longitude) {
          const dist = calculateDistance(ngo.latitude, ngo.longitude, r.latitude, r.longitude);
          return { ...r, distance: Number(dist.toFixed(2)) };
        }
        return { ...r, distance: 9999 };
      });
      // Sort by distance
      results.sort((a, b) => a.distance - b.distance);
    } else {
      results = rescues.map(r => ({ ...r, distance: null }));
    }

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getMyContributors(req, res) {
  try {
    const contributors = await prisma.contributor.findMany({
      where: { ngoId: req.user.id },
      include: { user: { select: { id: true, name: true, email: true, photoUrl: true } } },
    });
    return res.json(contributors);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function createPost(req, res) {
  try {
    const { postType, title, description, location } = req.body;
    const post = await prisma.ngoPost.create({
      data: { ngoId: req.user.id, postType, title, description, location },
    });
    return res.status(201).json(post);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function updatePost(req, res) {
  try {
    const { title, description, location, postType } = req.body;
    const post = await prisma.ngoPost.findFirst({
      where: { id: req.params.postId, ngoId: req.user.id },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });
 
    const updated = await prisma.ngoPost.update({
      where: { id: req.params.postId },
      data: { title, description, location, postType },
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function deletePost(req, res) {
  try {
    const post = await prisma.ngoPost.findFirst({
      where: { id: req.params.postId, ngoId: req.user.id },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });
 
    await prisma.ngoPost.delete({ where: { id: req.params.postId } });
    return res.json({ message: "Post deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function createNgoReview(req, res) {
  try {
    const { content, rating } = req.body;
    const ngoId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const ngo = await prisma.ngo.findUnique({ where: { id: ngoId } });
    if (!ngo) return res.status(404).json({ message: "NGO not found" });

    const review = await prisma.ngoReview.create({
      data: {
        ngoId,
        userId: req.user.id,
        content: content || "",
        rating: Number(rating),
      },
      include: {
        user: { select: { id: true, name: true, photoUrl: true } }
      }
    });

    return res.status(201).json(review);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function listNgoReviews(req, res) {
  try {
    const reviews = await prisma.ngoReview.findMany({
      where: { ngoId: req.params.id },
      include: {
        user: { select: { id: true, name: true, photoUrl: true } }
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
export const ngoController = {
  listNgos, getNgoById, getNgoPosts,
  getMyProfile, updateMyProfile, changePassword,
  getMyDonations, getNearbyRescueRequests, getMyContributors,
  createPost, updatePost, deletePost,
  createNgoReview, listNgoReviews,
};
