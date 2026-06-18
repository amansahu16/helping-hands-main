import express from "express";
import { adminController } from "../controllers/admin.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = express.Router();

// Custom middleware to check for admin role
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access forbidden: Admin role required" });
};

// Public Admin Auth
router.post("/login",            adminController.loginAdmin);
router.post("/verify-login-otp", adminController.verifyLoginOtp);
router.post("/forgot-password",  adminController.forgotAdminPassword);
router.post("/reset-password",   adminController.resetAdminPassword);

// Secure Admin Registration (Only existing admins can create new admins)
router.post("/register",         requireAuth, requireAdmin, adminController.registerAdmin);

// Settings (Public get, admin update)
router.get("/contact-settings", adminController.getContactSettings);

// Protected Admin routes
router.get("/stats",                      requireAuth, requireAdmin, adminController.getStats);
router.get("/ngos",                       requireAuth, requireAdmin, adminController.listNgos);
router.put("/ngos/:id/verify",            requireAuth, requireAdmin, adminController.verifyNgo);
router.get("/operations",                 requireAuth, requireAdmin, adminController.listOperations);
router.delete("/operations/:type/:id",    requireAuth, requireAdmin, adminController.deleteOperation);
router.put("/contact-settings",           requireAuth, requireAdmin, adminController.updateContactSettings);
router.post("/locations",                 requireAuth, requireAdmin, adminController.addLocation);
router.delete("/locations/:id",           requireAuth, requireAdmin, adminController.deleteLocation);
router.get("/feedbacks",                  requireAuth, requireAdmin, adminController.listFeedbacks);
router.delete("/feedbacks/:type/:id",     requireAuth, requireAdmin, adminController.deleteFeedback);
router.put("/complaints/:id/resolve",     requireAuth, requireAdmin, adminController.resolveComplaint);

// General Complaint reporting (Any authenticated user can file)
router.post("/complaints",                requireAuth, adminController.reportComplaint);

export default router;
