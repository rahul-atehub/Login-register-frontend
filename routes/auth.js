import express from "express";
import {
  login,
  register,
  changePassword,
  refreshTokenHandler,
  guestLogin,
  logout,
  googleLogin, // <-- Add this import
} from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js"; // ✅ Middleware to protect routes
import { loginLimiter } from "../middleware/rateLimiter.js"; // ✅ Rate limiter for login route

const router = express.Router();

router.post("/login", loginLimiter, login); // ✅ Rate limiter added
router.post("/register", register);
router.post("/change-password", authenticateToken, changePassword); // ✅ Protected route
router.post("/refresh", refreshTokenHandler); // ✅ Refresh token route
router.post("/guest", guestLogin); // Add this new route
router.post("/logout", authenticateToken, logout); // Add this new route
router.post("/google", googleLogin); // Add this route for Google login

export default router;
