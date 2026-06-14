//  NGO — routes/ngo.routes.js
// ============================================================
import express from "express";
import { ngoController } from "../controllers/ngo.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
 
const router = express.Router();
 
// Public browsing
router.get("/",          ngoController.listNgos);
router.get("/:id",       ngoController.getNgoById);
router.get("/:id/posts", ngoController.getNgoPosts);
router.get("/:id/reviews", ngoController.listNgoReviews);
router.post("/:id/reviews", requireAuth, ngoController.createNgoReview);
 
// NGO-only (authenticated)
router.use(requireAuth, requireRole("ngo"));
 
router.get("/me/profile",       ngoController.getMyProfile);
router.put("/me/profile",       ngoController.updateMyProfile);
router.put("/me/password",      ngoController.changePassword);
router.get("/me/donations",     ngoController.getMyDonations);
router.get("/me/rescue-requests", ngoController.getNearbyRescueRequests);
 
// NGO posts (CRUD)
router.post("/me/posts",        ngoController.createPost);
router.put("/me/posts/:postId", ngoController.updatePost);
router.delete("/me/posts/:postId", ngoController.deletePost);
 
export default router;