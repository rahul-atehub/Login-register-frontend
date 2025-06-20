import bcrypt from "bcrypt";
import { promisify } from "util";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { GUEST_CONFIG } from "../config/guestConfig.js";
import JWT_CONFIG from "../config/jwtConfig.js"; // Adjust the import based on your project structure
import User from "../models/User.js"; // Adjust the import based on your project structure
import { STRONG_PASSWORD_REGEX } from "../constants/validation.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Enhanced salt rounds for better security
const SALT_ROUNDS = 12;

// Generate secure random salt (optional - bcrypt handles this automatically)
const generateSalt = promisify(crypto.randomBytes);

/**
 * Enhanced user registration with improved security
 */
export async function register(req, res) {
  try {
    const { username, password, email } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required",
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    // Check for password complexity
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        error:
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character, and be at least 8 characters long",
      });
    }

    // Hash password with enhanced salt rounds
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Check if user exists
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    // Save user
    await User.create({ username, email, password: hashedPassword });

    // Don't send sensitive data back
    res.status(201).json({
      message: "User registered successfully",
      user: { username, email },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

/**
 * Enhanced login with secure password comparison
 */
export async function login(req, res) {
  try {
    const { username, password } = req.body;

    console.log("Login attempt:", {
      username,
      passwordLength: password?.length,
    });

    // Find user
    const user = await User.findOne({ username });
    console.log("User found:", !!user);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    console.log("Password valid:", isValid);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ Create access token
    const accessToken = jwt.sign({ userId: user._id }, JWT_CONFIG.SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    });

    // ✅ Create refresh token
    const refreshToken = jwt.sign(
      { userId: user._id },
      JWT_CONFIG.REFRESH_SECRET,
      {
        expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
      }
    );

    // ✅ Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      token: accessToken,
      refreshToken, // <--- send refresh token too
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function refreshTokenHandler(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token required" });
  }

  try {
    // Verify refresh token
    const payload = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_SECRET);

    const user = await User.findById(payload.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(403)
        .json({ error: "Invalid or expired refresh token" });
    }

    // Generate new access token
    const newAccessToken = jwt.sign({ userId: user._id }, JWT_CONFIG.SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    });

    res.status(200).json({ token: newAccessToken });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(403).json({ error: "Invalid refresh token" });
  }
}

/**
 * Change password with additional security
 */
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id; // Assuming user is authenticated

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required",
      });
    }

    // Password strength validation for new password
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "New password must be at least 8 characters long",
      });
    }

    // TODO: Fetch user from DB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // TODO: Update password in DB
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}

/**
 * Utility function to hash password (for use in other parts of app)
 */
export async function hashPassword(password) {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new Error("Password hashing failed");
  }
}

/**
 * Utility function to verify password
 */
export async function verifyPassword(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error("Password verification failed");
  }
}

/**
 * Guest login function for temporary access
 */
export async function guestLogin(req, res) {
  try {
    // Create guest user object
    const guestUser = {
      id: `guest_${Date.now()}`, // Generate unique guest ID
      username: GUEST_CONFIG.username,
      email: GUEST_CONFIG.email,
      role: GUEST_CONFIG.role,
      permissions: GUEST_CONFIG.permissions,
    };

    // Generate limited-time token for guest
    const token = jwt.sign(
      {
        userId: guestUser.id,
        role: guestUser.role,
        permissions: guestUser.permissions,
      },
      JWT_CONFIG.SECRET,
      {
        expiresIn: GUEST_CONFIG.expiresIn,
      }
    );

    // Optional: Save guest session in database
    // await GuestSession.create({
    //   guestId: guestUser.id,
    //   createdAt: new Date(),
    //   expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    // });

    res.status(200).json({
      message: "Guest login successful",
      user: guestUser,
      token,
      expiresIn: GUEST_CONFIG.expiresIn,
    });
  } catch (error) {
    console.error("Guest login error:", error);
    res.status(500).json({
      error: "Failed to create guest session",
    });
  }
}

/**
 * Logout function to invalidate user session
 */
export async function logout(req, res) {
  try {
    const userId = req.user.id;

    // Find user and clear their refresh token
    const user = await User.findById(userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.status(200).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Error during logout",
      success: false,
    });
  }
}

/**
 * Google login function
 */
export async function googleLogin(req, res) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: "Missing Google credential" });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // payload contains: email, name, sub (Google user ID), etc.
    const { email, name, sub } = payload;

    // Find or create user in your DB
    let user = await User.findOne({ email });
    if (!user) {
      // You can set a random password since Google users won't use it
      user = await User.create({
        username: name || email,
        email,
        password: Math.random().toString(36).slice(-8), // random password
      });
    }

    // Create your own JWT for the session
    const token = jwt.sign({ userId: user._id }, JWT_CONFIG.SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    });

    res.status(200).json({
      message: "Google login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(401).json({ error: "Invalid Google token" });
  }
}
