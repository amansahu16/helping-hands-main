// ============================================================
import { prisma } from "../lib/prisma.js";
import { uploadMultipleImages } from "../utils/cloudinary.js";
 
async function listDonations(req, res) {
  try {
    const { status, category, location, donorId, recipientNgoId, page = 1, limit = 100 } = req.query;
    const donations = await prisma.donation.findMany({
      where: {
        ...(category && { category: { contains: category, mode: "insensitive" } }),
        ...(location && { location: { contains: location, mode: "insensitive" } }),
        ...(donorId  && { donorId }),
        recipientNgoId: recipientNgoId || null,
        status: status ? status : { notIn: ["DELIVERED", "CANCELLED"] },
      },
      include: {
        donor:        { select: { id: true, name: true } },
        donorNgo:     { select: { id: true, name: true, photoUrl: true } },
        recipientNgo: { select: { id: true, name: true, photoUrl: true } },
        _count:       { select: { items: true } },
      },
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });
    return res.json(donations);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getDonationById(req, res) {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id: req.params.id },
      include: {
        donor:        { select: { id: true, name: true, phoneNumber: true } },
        recipientNgo: { select: { id: true, name: true, phoneNumber: true } },
        items:        true,
      },
    });
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    return res.json(donation);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function createDonation(req, res) {
  try {
    const {
      title, category, condition, description, quantity, personsServed,
      location, latitude, longitude, pickupAddress, pickupType,
      timeFrom, timeTo, photos, recipientNgoId, items,
      amount, transactionId, otp, reachedDonor
    } = req.body;
 
    const uploadedPhotos = Array.isArray(photos) ? await uploadMultipleImages(photos) : [];

    const isNgo = req.user?.role === 'ngo';
    const donation = await prisma.donation.create({
      data: {
        donorId:    !isNgo ? (req.user?.id || null) : null,
        donorNgoId: isNgo ? req.user.id : null,
        title,
        category,
        condition,
        description,
        quantity:   quantity ? Number(quantity) : null,
        personsServed: personsServed ? Number(personsServed) : null,
        location,
        latitude:   latitude  ? Number(latitude)  : null,
        longitude:  longitude ? Number(longitude) : null,
        pickupAddress,
        pickupType,
        timeFrom: timeFrom ? new Date(timeFrom) : null,
        timeTo:   timeTo   ? new Date(timeTo)   : null,
        photos:   uploadedPhotos,
        recipientNgoId: (recipientNgoId && recipientNgoId.trim() !== "") ? recipientNgoId : null,
        amount:     amount ? Number(amount) : null,
        transactionId: transactionId || null,
        otp:        otp || null,
        reachedDonor: reachedDonor || false,
        items: items?.length
          ? { create: items.map(i => ({ itemType: i.itemType, description: i.description, quantity: i.quantity })) }
          : undefined,
      },
      include: { items: true },
    });
    return res.status(201).json(donation);
  } catch (err) {
    console.error("createDonation error:", err);
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateDonation(req, res) {
  try {
    const donation = await prisma.donation.findUnique({ where: { id: req.params.id } });
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    const isDonor = (donation.donorId === req.user.id) || (donation.donorNgoId === req.user.id);
    if (!isDonor) return res.status(403).json({ message: "Forbidden" });
    if (donation.status !== "PENDING") {
      return res.status(409).json({ message: "Can only edit PENDING donations" });
    }
 
    const { category, quantity, personsServed, location, pickupAddress, timeFrom, timeTo, photos } = req.body;
    const uploadedPhotos = Array.isArray(photos) ? await uploadMultipleImages(photos) : undefined;

    const updated = await prisma.donation.update({
      where: { id: req.params.id },
      data: { category, quantity, personsServed, location, pickupAddress, timeFrom, timeTo, photos: uploadedPhotos },
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function deleteDonation(req, res) {
  try {
    const donation = await prisma.donation.findUnique({ where: { id: req.params.id } });
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    const isDonor = (donation.donorId === req.user.id) || (donation.donorNgoId === req.user.id);
    if (!isDonor) return res.status(403).json({ message: "Forbidden" });
    if (donation.status !== "PENDING") {
      return res.status(409).json({ message: "Can only cancel PENDING donations" });
    }
 
    await prisma.donation.delete({ where: { id: req.params.id } });
    return res.json({ message: "Donation cancelled and deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
// ── Donation Items ────────────────────────────────────────────
 
async function addItem(req, res) {
  try {
    const { itemType, description, quantity } = req.body;
    const item = await prisma.donationItem.create({
      data: { donationId: req.params.id, itemType, description, quantity },
    });
    return res.status(201).json(item);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateItem(req, res) {
  try {
    const { itemType, description, quantity } = req.body;
    const item = await prisma.donationItem.update({
      where: { id: req.params.itemId },
      data: { itemType, description, quantity },
    });
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function deleteItem(req, res) {
  try {
    await prisma.donationItem.delete({ where: { id: req.params.itemId } });
    return res.json({ message: "Item removed" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
// ── Status (NGO) ──────────────────────────────────────────────
 
async function updateStatus(req, res) {
  try {
    const { status } = req.body; // ACCEPTED | PICKED_UP | DELIVERED | CANCELLED
    const allowed = ["ACCEPTED", "PICKED_UP", "DELIVERED", "CANCELLED"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });
 
    const donation = await prisma.donation.findUnique({ where: { id: req.params.id } });
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    if (donation.recipientNgoId !== req.user.id) {
      return res.status(403).json({ message: "Only the recipient NGO can update status" });
    }
 
    const updated = await prisma.donation.update({ where: { id: req.params.id }, data: { status } });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function markReached(req, res) {
  try {
    const donation = await prisma.donation.findUnique({ where: { id: req.params.id } });
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    if (donation.recipientNgoId !== req.user.id) {
      return res.status(403).json({ message: "Only the recipient NGO can update this" });
    }

    const updated = await prisma.donation.update({
      where: { id: req.params.id },
      data: { reachedDonor: true }
    });
    return res.json({ message: "Donor notified successfully", donation: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const { otp } = req.body;
    const donation = await prisma.donation.findUnique({ where: { id: req.params.id } });
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    const isDonor = (donation.donorId === req.user.id) || (donation.donorNgoId === req.user.id);
    if (!isDonor) {
      return res.status(403).json({ message: "Only the donor can verify the OTP" });
    }

    if (!donation.otp || donation.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP code. Please try again." });
    }

    // OTP matches! Update donation status to PICKED_UP
    const updated = await prisma.donation.update({
      where: { id: req.params.id },
      data: { status: "PICKED_UP", reachedDonor: false }
    });

    return res.json({ message: "OTP verified successfully. Donation picked up!", donation: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
export const donationController = {
  listDonations, getDonationById, createDonation, updateDonation, deleteDonation,
  addItem, updateItem, deleteItem, updateStatus, markReached, verifyOtp,
};