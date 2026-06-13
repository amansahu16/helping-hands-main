// ============================================================
//  USER PROFILE — controllers/user.controller.js
// ============================================================
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { uploadSingleImage } from "../utils/cloudinary.js";
 
async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, phoneNumber: true,
        dateOfBirth: true, location: true, occupation: true,
        photoUrl: true, otpVerified: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateProfile(req, res) {
  try {
    const { name, phoneNumber, dateOfBirth, location, occupation, photoUrl } = req.body;
    
    let finalPhotoUrl = photoUrl;
    if (photoUrl && photoUrl.startsWith("data:")) {
      finalPhotoUrl = await uploadSingleImage(photoUrl);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { 
        name, 
        phoneNumber, 
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined, 
        location, 
        occupation, 
        photoUrl: finalPhotoUrl 
      },
      select: { id: true, name: true, email: true, photoUrl: true },
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
 
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_])[A-Za-z\d!@#$%^&*_]{8,16}$/.test(newPassword)) {
      return res.status(400).json({ message: "New password must be 8 to 16 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special symbol from !@#$%^&*__." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function deleteAccount(req, res) {
  try {
    await prisma.user.delete({ where: { id: req.user.id } });
    return res.json({ message: "Account deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getMyDonations(req, res) {
  try {
    const donations = await prisma.donation.findMany({
      where: { donorId: req.user.id },
      include: { items: true, recipientNgo: { select: { id: true, name: true, photoUrl: true, registrationNumber: true, upiId: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json(donations);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getMyAdoptions(req, res) {
  try {
    const adoptions = await prisma.adoption.findMany({
      where: { adopterId: req.user.id },
      include: { animal: true, ngo: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json(adoptions);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getMyRescueRequests(req, res) {
  try {
    const rescues = await prisma.rescueRequest.findMany({
      where: { reporterId: req.user.id },
      include: { nearbyCenter: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json(rescues);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getMyCampaigns(req, res) {
  try {
    const organized = await prisma.campaign.findMany({
      where: { organizerUserId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    const joined = await prisma.campaignParticipant.findMany({
      where: { userId: req.user.id },
      include: { campaign: true },
      orderBy: { joinedAt: "desc" },
    });
    return res.json({ organized, joined });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
export const userController = {
  getProfile, updateProfile, changePassword, deleteAccount,
  getMyDonations, getMyAdoptions, getMyRescueRequests, getMyCampaigns,
};