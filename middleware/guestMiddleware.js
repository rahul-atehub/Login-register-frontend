import { GUEST_CONFIG } from "../config/guestConfig.js";

export function handleGuestAccess(allowedRoles = ["user", "guest"]) {
  return (req, res, next) => {
    const user = req.user;

    // If no user or no role, deny access
    if (!user || !user.role) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    // If user is guest, check if action is allowed
    if (user.role === "guest") {
      // Check if the route/action is allowed for guests
      const isAllowed = GUEST_CONFIG.permissions.includes(req.method.toLowerCase());
      
      if (!isAllowed) {
        return res.status(403).json({
          error: "This action is not allowed for guest users",
          message: "Please sign up for full access"
        });
      }
    }

    // Check if user role is allowed
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: allowedRoles,
        current: user.role
      });
    }

    next();
  };
}