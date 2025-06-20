import jwt from "jsonwebtoken";
import JWT_CONFIG from "../config/jwtConfig.js";

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.SECRET);
    req.user = { id: decoded.userId }; // Attach user info to request
    next(); // Proceed to the route
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}
