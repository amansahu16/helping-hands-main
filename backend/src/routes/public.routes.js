//  PUBLIC / MISC — routes/public.routes.js
// ============================================================
import express from "express";
import { publicController } from "../controllers/public.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
 
const router = express.Router();
 
// FAQs
router.get("/faqs",           publicController.listFaqs);

// Stats
router.get("/stats",          publicController.getStats);
router.get("/leaderboard",    publicController.getLeaderboard);
router.get("/animal-stats",   publicController.getAnimalStats);
 
// Testimonials
router.get("/testimonials",   publicController.listTestimonials);
router.post("/testimonials",  requireAuth, publicController.createTestimonial);
 
// Newsletter
router.post("/newsletter/subscribe", publicController.subscribeNewsletter);
router.delete("/newsletter/unsubscribe", publicController.unsubscribeNewsletter);
 
// Contact
router.post("/contact",       publicController.sendContactMessage);
 
// Locations
router.get("/locations",      publicController.listLocations);
router.get("/locations/:id",  publicController.getLocationById);
 
export default router;