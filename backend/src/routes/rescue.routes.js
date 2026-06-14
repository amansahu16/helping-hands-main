//  RESCUE REQUESTS — routes/rescue.routes.js
// ============================================================
import express from "express";
import { rescueController } from "../controllers/rescue.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
 
const router = express.Router();
 
// Public — anyone can browse open rescue requests
router.get("/", rescueController.listRescueRequests);
router.get("/:id", rescueController.getRescueById);
 
// User reports a rescue (requires auth)
router.post("/", requireAuth, rescueController.createRescueRequest);
router.put("/:id", requireAuth, rescueController.updateRescueRequest);
router.delete("/:id", requireAuth, rescueController.deleteRescueRequest);
 
// NGO updates status (accept / resolve)
router.put("/:id/status", requireAuth, requireRole("ngo"), rescueController.updateStatus);
router.patch("/:id/status", requireAuth, requireRole("ngo"), rescueController.updateStatus);
 
export default router;