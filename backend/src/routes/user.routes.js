// ============================================================
//  USER PROFILE — routes/user.routes.js
// ============================================================
import express from "express";
import { userController } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
 
const router = express.Router();
 
// All routes require authentication
router.use(requireAuth);
 
router.get("/",           requireRole("user"), userController.getProfile);
router.put("/",           requireRole("user"), userController.updateProfile);
router.put("/password",   requireRole("user"), userController.changePassword);
router.delete("/",        requireRole("user"), userController.deleteAccount);
router.get("/donations",  requireRole("user"), userController.getMyDonations);
router.get("/adoptions",  requireRole("user"), userController.getMyAdoptions);
router.get("/rescues",    requireRole("user"), userController.getMyRescueRequests);
router.get("/campaigns",  requireRole("user"), userController.getMyCampaigns);
 
export default router;
 