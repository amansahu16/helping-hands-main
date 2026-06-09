//  ANIMALS — controllers/animal.controller.js
// ============================================================
import { prisma } from "../lib/prisma.js";
import { uploadMultipleImages } from "../utils/cloudinary.js";
 
async function listAnimals(req, res) {
  try {
    const { status, category, location, page = 1, limit = 12 } = req.query;
    const animals = await prisma.animal.findMany({
      where: {
        status: status ? status : { not: "ADOPTED" },
        ...(category && { category: { contains: category, mode: "insensitive" } }),
        ...(location && { location: { contains: location, mode: "insensitive" } }),
      },
      include: {
        postedByUser: { select: { id: true, name: true } },
        postedByNgo:  { select: { id: true, name: true, photoUrl: true, phoneNumber: true, email: true } },
      },
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });
    return res.json(animals);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getAnimalById(req, res) {
  try {
    const animal = await prisma.animal.findUnique({
      where: { id: req.params.id },
      include: {
        postedByUser: { select: { id: true, name: true, photoUrl: true } },
        postedByNgo:  { select: { id: true, name: true, photoUrl: true } },
        adoptions:    { select: { status: true, adoptedAt: true } },
      },
    });
    if (!animal) return res.status(404).json({ message: "Animal not found" });
    return res.json(animal);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function createAnimal(req, res) {
  try {
    const { category, name, age, location, latitude, longitude, description, photos } = req.body;
    const { id: posterId, role } = req.user;
 
    const uploadedPhotos = Array.isArray(photos) ? await uploadMultipleImages(photos) : [];

    const animal = await prisma.animal.create({
      data: {
        category, name: name || null, age: age || null,
        location, description,
        latitude:  latitude  ? Number(latitude)  : null,
        longitude: longitude ? Number(longitude) : null,
        photos: uploadedPhotos,
        ...(role === "user" && { postedByUserId: posterId }),
        ...(role === "ngo"  && { postedByNgoId:  posterId }),
      },
    });
    return res.status(201).json(animal);
  } catch (err) {
    console.error("createAnimal error:", err);
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateAnimal(req, res) {
  try {
    const animal = await prisma.animal.findUnique({ where: { id: req.params.id } });
    if (!animal) return res.status(404).json({ message: "Animal not found" });
 
    const { id, role } = req.user;
    const isOwner =
      (role === "user" && animal.postedByUserId === id) ||
      (role === "ngo"  && animal.postedByNgoId  === id);
    if (!isOwner) return res.status(403).json({ message: "Forbidden" });
 
    const { category, location, description, photos, status } = req.body;
    const uploadedPhotos = Array.isArray(photos) ? await uploadMultipleImages(photos) : undefined;

    const updated = await prisma.animal.update({
      where: { id: req.params.id },
      data: { category, location, description, photos: uploadedPhotos, status },
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function deleteAnimal(req, res) {
  try {
    const animal = await prisma.animal.findUnique({ where: { id: req.params.id } });
    if (!animal) return res.status(404).json({ message: "Animal not found" });
 
    const { id, role } = req.user;
    const isOwner =
      (role === "user" && animal.postedByUserId === id) ||
      (role === "ngo"  && animal.postedByNgoId  === id);
    if (!isOwner) return res.status(403).json({ message: "Forbidden" });
 
    await prisma.animal.delete({ where: { id: req.params.id } });
    return res.json({ message: "Animal listing deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function initiateAdoption(req, res) {
  try {
    const animal = await prisma.animal.findUnique({ where: { id: req.params.id } });
    if (!animal) return res.status(404).json({ message: "Animal not found" });
    if (animal.status !== "AVAILABLE") {
      return res.status(409).json({ message: "Animal is not available for adoption" });
    }
 
    const adoption = await prisma.$transaction(async (tx) => {
      const a = await tx.adoption.create({
        data: {
          animalId:  animal.id,
          adopterId: req.user.id,
          ngoId:     animal.postedByNgoId ?? null,
          status:    "IN_PROGRESS",
        },
      });
      await tx.animal.update({ where: { id: animal.id }, data: { status: "ADOPTED" } });
      return a;
    });
 
    return res.status(201).json(adoption);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
export const animalController = {
  listAnimals, getAnimalById, createAnimal, updateAnimal, deleteAnimal, initiateAdoption,
};