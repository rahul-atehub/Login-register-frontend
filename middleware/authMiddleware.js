import jwt from "jsonwebtoken";
import { promisify } from "util";

// Promisify jwt methods for better async handling
const verifyAsync = promisify(jwt.verify);
const signAsync = promisify(jwt.sign);

// Configuration constants
const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || "your-secret-key",
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
  ACCESS_TOKEN_EXPIRY: process.env.JWT_EXPIRY || "15m",
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",
  ISSUER: process.env.JWT_ISSUER || "your-app-name",
  AUDIENCE: process.env.JWT_AUDIENCE || "your-app-users",
};

/**
 * Enhanced JWT verification middleware with comprehensive error handling
 */
export function verifyToken(req, res, next) {
  try {
    // 1. Get token from multiple sources (header, cookie, query)
    let token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
        code: "NO_TOKEN",
      });
    }

    // 2. Verify token with enhanced options
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithms: ["HS256"],
    });

    // 3. Check if token is about to expire (optional refresh warning)
    const timeUntilExpiry = decoded.exp - Math.floor(Date.now() / 1000);
    if (timeUntilExpiry < 300) {
      // Less than 5 minutes
      res.set("X-Token-Refresh-Warning", "true");
    }

    // 4. Attach user info to request object
    req.user = {
      id: decoded.userId || decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role || "user",
      iat: decoded.iat,
      exp: decoded.exp,
    };

    // 5. Store original token for potential refresh
    req.token = token;

    // 6. Go to next middleware/route
    next();
  } catch (error) {
    handleTokenError(error, res);
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_CONFIG.SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithms: ["HS256"],
    });

    req.user = {
      id: decoded.userId || decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role || "user",
    };

    next();
  } catch (error) {
    // If token is invalid, continue without user
    req.user = null;
    next();
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required",
        code: "NO_AUTH",
      });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        code: "FORBIDDEN",
        required: allowedRoles,
        current: userRole,
      });
    }

    next();
  };
}

/**
 * Enhanced token generation with comprehensive payload
 */
export async function generateTokens(user) {
  try {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
    };

    const tokenOptions = {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithm: "HS256",
    };

    // Generate access token
    const accessToken = await signAsync(payload, JWT_CONFIG.SECRET, {
      ...tokenOptions,
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    });

    // Generate refresh token with minimal payload
    const refreshToken = await signAsync(
      { userId: user.id, type: "refresh" },
      JWT_CONFIG.REFRESH_SECRET,
      {
        ...tokenOptions,
        expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
      }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error(`Token generation failed: ${error.message}`);
  }
}

/**
 * Refresh token validation and new token generation
 */
export async function refreshAccessToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: "Refresh token required",
        code: "NO_REFRESH_TOKEN",
      });
    }

    // Verify refresh token
    const decoded = await verifyAsync(refreshToken, JWT_CONFIG.REFRESH_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithms: ["HS256"],
    });

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        error: "Invalid token type",
        code: "INVALID_TOKEN_TYPE",
      });
    }

    // TODO: Check if refresh token exists in database and is not blacklisted
    // const storedToken = await RefreshToken.findOne({ token: refreshToken, userId: decoded.userId });
    // if (!storedToken) {
    //   return res.status(401).json({ error: "Invalid refresh token" });
    // }

    // TODO: Get user from database
    // const user = await User.findById(decoded.userId);
    // if (!user) {
    //   return res.status(401).json({ error: "User not found" });
    // }

    // For demo purposes - replace with actual user data
    const user = {
      id: decoded.userId,
      username: "demo-user",
      email: "demo@example.com",
      role: "user",
    };

    // Generate new tokens
    const tokens = await generateTokens(user);

    res.status(200).json({
      message: "Token refreshed successfully",
      ...tokens,
    });
  } catch (error) {
    handleTokenError(error, res);
  }
}

/**
 * Logout and token invalidation
 */
export async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    const accessToken = req.token;

    // TODO: Add tokens to blacklist in database
    // await TokenBlacklist.create({ token: accessToken, expiresAt: new Date(req.user.exp * 1000) });
    // if (refreshToken) {
    //   await RefreshToken.deleteOne({ token: refreshToken });
    // }

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Logout failed",
    });
  }
}

/**
 * Extract token from various sources
 */
function extractToken(req) {
  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // 2. Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // 3. Check query parameter (less secure, use with caution)
  if (req.query && req.query.token) {
    return req.query.token;
  }

  return null;
}

/**
 * Centralized token error handling
 */
function handleTokenError(error, res) {
  console.error("Token verification error:", error);

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      error: "Token expired",
      code: "TOKEN_EXPIRED",
      expiredAt: error.expiredAt,
    });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      error: "Invalid token",
      code: "INVALID_TOKEN",
    });
  }

  if (error.name === "NotBeforeError") {
    return res.status(401).json({
      error: "Token not active",
      code: "TOKEN_NOT_ACTIVE",
    });
  }

  // Generic error
  res.status(401).json({
    error: "Authentication failed",
    code: "AUTH_FAILED",
  });
}

/**
 * Middleware to check if user owns the resource
 */
export function requireOwnership(resourceIdParam = "id") {
  return (req, res, next) => {
    const resourceId = req.params[resourceIdParam];
    const userId = req.user.id;

    // Admin can access everything
    if (req.user.role === "admin") {
      return next();
    }

    // TODO: Implement resource ownership check
    // Example: Check if user owns the resource
    // const resource = await Resource.findById(resourceId);
    // if (resource.userId !== userId) {
    //   return res.status(403).json({ error: "Access denied" });
    // }

    next();
  };
}

/**
 * Rate limiting by user ID
 */
export function createUserRateLimit(
  maxRequests = 100,
  windowMs = 15 * 60 * 1000
) {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) return next();

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (userRequests.has(userId)) {
      const requests = userRequests
        .get(userId)
        .filter((time) => time > windowStart);
      userRequests.set(userId, requests);
    } else {
      userRequests.set(userId, []);
    }

    const currentRequests = userRequests.get(userId);

    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: "Too many requests",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    currentRequests.push(now);
    next();
  };
}
