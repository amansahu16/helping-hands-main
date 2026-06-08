//  DONATIONS — routes/donation.routes.js
// ============================================================
import express from "express";
import { donationController } from "../controllers/donation.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
 
const router = express.Router();
 
// Public — browse donations
router.get("/",      donationController.listDonations);
router.get("/:id",   donationController.getDonationById);
 
// User creates a donation (requires auth)
router.post("/",     requireAuth, donationController.createDonation);
router.put("/:id",   requireAuth, donationController.updateDonation);
router.delete("/:id",requireAuth, donationController.deleteDonation);
 
// Donation items
router.post("/:id/items",          requireAuth, donationController.addItem);
router.put("/:id/items/:itemId",   requireAuth, donationController.updateItem);
router.delete("/:id/items/:itemId",requireAuth, donationController.deleteItem);
 
// NGO updates status (ACCEPTED / PICKED_UP / DELIVERED)
router.put("/:id/status",          requireAuth, requireRole("ngo"), donationController.updateStatus);
router.patch("/:id/status",        requireAuth, requireRole("ngo"), donationController.updateStatus);
router.patch("/:id/reach",         requireAuth, requireRole("ngo"), donationController.markReached);
router.post("/:id/verify-otp",     requireAuth, donationController.verifyOtp);
 
export default router;