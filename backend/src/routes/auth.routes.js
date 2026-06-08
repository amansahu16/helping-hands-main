//  AUTH — routes/auth.routes.js
// ============================================================
import express from "express";
import { authController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { upload } from "../middlewares/multer.middleware.js";
 
const router = express.Router();
 
// Public
router.post("/user/register",   authController.registerUser);
router.post("/user/login",      authController.loginUser);
router.post("/user/verify-otp", authController.verifyUserOtp);
router.post("/user/resend-otp", authController.resendUserOtp);
router.post("/user/forgot-password",  authController.forgotUserPassword);
router.post("/user/reset-password",   authController.resetUserPassword);
 
router.post("/ngo/register",   authController.registerNgo);
router.post("/ngo/login",      authController.loginNgo);
router.post("/ngo/verify-otp", authController.verifyNgoOtp);
router.post("/ngo/resend-otp", authController.resendNgoOtp);
router.post("/ngo/forgot-password", authController.forgotNgoPassword);
router.post("/ngo/reset-password",  authController.resetNgoPassword);
 
// Protected — refresh / logout
router.post("/logout",         requireAuth, authController.logout);
router.get("/me",              requireAuth, authController.getMe);
router.post("/upload-photo",   upload.single("photo"), authController.uploadPhoto);
 
export default router;