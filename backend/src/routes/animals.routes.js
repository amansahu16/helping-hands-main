//  ANIMALS — routes/animal.routes.js
// ============================================================
import express from "express";
import { animalController } from "../controllers/animals.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
 
const router = express.Router();
 
// Public browsing
router.get("/",      animalController.listAnimals);
router.get("/:id",   animalController.getAnimalById);
 
// Authenticated (user or NGO can post)
router.get("/adoptions/incoming", requireAuth, animalController.getIncomingAdoptions);
router.post("/",     requireAuth, animalController.createAnimal);
router.put("/:id",   requireAuth, animalController.updateAnimal);
router.delete("/:id",requireAuth, animalController.deleteAnimal);
 
// Adoption sub-resource
router.post("/:id/adopt", requireAuth, animalController.initiateAdoption);
router.post("/:id/confirm-adoption", requireAuth, animalController.confirmAdoption);
router.post("/:id/reject-adoption", requireAuth, animalController.rejectAdoption);

export default router;