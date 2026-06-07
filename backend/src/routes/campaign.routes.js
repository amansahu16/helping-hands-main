//  CAMPAIGNS — routes/campaign.routes.js
// ============================================================
import express from "express";
import { campaignController } from "../controllers/campaign.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
 
const router = express.Router();
 
// Public
router.get("/",            campaignController.listCampaigns);
router.get("/:id",         campaignController.getCampaignById);
router.get("/:id/participants", campaignController.getCampaignParticipants);
 
// Authenticated (user or NGO)
router.post("/",                requireAuth, campaignController.createCampaign);
router.put("/:id",              requireAuth, campaignController.updateCampaign);
router.delete("/:id",           requireAuth, campaignController.deleteCampaign);
router.patch("/:id/status",     requireAuth, campaignController.updateStatus);
 
// Participation (users only)
router.post("/:id/join",        requireAuth, campaignController.joinCampaign);
router.delete("/:id/leave",     requireAuth, campaignController.leaveCampaign);
router.patch("/:id/participants/:participantId/status", requireAuth, campaignController.updateParticipantStatus);
 
export default router;