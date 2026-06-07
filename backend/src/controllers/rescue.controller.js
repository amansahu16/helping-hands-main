//  RESCUE REQUESTS — controllers/rescue.controller.js
// ============================================================
import { prisma } from "../lib/prisma.js";
import { uploadMultipleImages } from "../utils/cloudinary.js";
 
async function listRescueRequests(req, res) {
  try {
    const { status, location, page = 1, limit = 10 } = req.query;
    const rescues = await prisma.rescueRequest.findMany({
      where: {
        ...(status   && { status }),
        ...(location && { location: { contains: location, mode: "insensitive" } }),
      },
      include: {
        reporter:     { select: { id: true, name: true } },
        nearbyCenter: { select: { id: true, name: true, phoneNumber: true } },
      },
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });
    return res.json(rescues);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getRescueById(req, res) {
  try {
    const rescue = await prisma.rescueRequest.findUnique({
      where: { id: req.params.id },
      include: {
        reporter:     { select: { id: true, name: true, phoneNumber: true } },
        nearbyCenter: { select: { id: true, name: true, phoneNumber: true, location: true } },
      },
    });
    if (!rescue) return res.status(404).json({ message: "Rescue request not found" });
    return res.json(rescue);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function createRescueRequest(req, res) {
  try {
    const {
      animalType, location, latitude, longitude,
      description, condition, photos,
      nearbyHospital, nearbyCenterId,
    } = req.body;
 
    const uploadedPhotos = Array.isArray(photos) ? await uploadMultipleImages(photos) : [];

    const rescue = await prisma.rescueRequest.create({
      data: {
        reporterId:     req.user?.id || null,  // optional auth
        location,
        latitude:       latitude ? Number(latitude) : null,
        longitude:      longitude ? Number(longitude) : null,
        description,
        condition:      condition || animalType || null,
        photos:         uploadedPhotos,
        nearbyHospital,
        nearbyCenterId: (nearbyCenterId && nearbyCenterId.trim() !== "") ? nearbyCenterId : null,
      },
    });
    return res.status(201).json(rescue);
  } catch (err) {
    console.error("createRescueRequest error:", err);
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateRescueRequest(req, res) {
  try {
    const rescue = await prisma.rescueRequest.findUnique({ where: { id: req.params.id } });
    if (!rescue) return res.status(404).json({ message: "Rescue request not found" });
    if (rescue.reporterId !== req.user.id) return res.status(403).json({ message: "Forbidden" });
 
    const { location, description, condition, photos, nearbyHospital } = req.body;
    const uploadedPhotos = Array.isArray(photos) ? await uploadMultipleImages(photos) : undefined;

    const updated = await prisma.rescueRequest.update({
      where: { id: req.params.id },
      data: { location, description, condition, photos: uploadedPhotos, nearbyHospital },
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function deleteRescueRequest(req, res) {
  try {
    const rescue = await prisma.rescueRequest.findUnique({ where: { id: req.params.id } });
    if (!rescue) return res.status(404).json({ message: "Rescue request not found" });
    if (rescue.reporterId !== req.user.id) return res.status(403).json({ message: "Forbidden" });
 
    await prisma.rescueRequest.delete({ where: { id: req.params.id } });
    return res.json({ message: "Rescue request deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateStatus(req, res) {
  try {
    const { status } = req.body; // ASSIGNED | RESOLVED | CLOSED
    const allowed = ["ASSIGNED", "RESOLVED", "CLOSED"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status" });
 
    const rescue = await prisma.rescueRequest.findUnique({ where: { id: req.params.id } });
    if (!rescue) return res.status(404).json({ message: "Rescue request not found" });

    let dataToUpdate = { status };
    if (status === "ASSIGNED") {
      // If already assigned to someone else, block it
      if (rescue.nearbyCenterId && rescue.nearbyCenterId !== req.user.id) {
        return res.status(403).json({ message: "This case is already claimed by another center" });
      }
      dataToUpdate.nearbyCenterId = req.user.id;
    } else {
      // RESOLVED or CLOSED require the NGO to be the assigned center
      if (rescue.nearbyCenterId !== req.user.id) {
        return res.status(403).json({ message: "Only the assigned NGO can update status to RESOLVED or CLOSED" });
      }
    }
 
    const updated = await prisma.rescueRequest.update({
      where: { id: req.params.id },
      data: dataToUpdate,
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
export const rescueController = {
  listRescueRequests, getRescueById, createRescueRequest,
  updateRescueRequest, deleteRescueRequest, updateStatus,
};