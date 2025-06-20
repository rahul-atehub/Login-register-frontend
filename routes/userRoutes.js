import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { handleGuestAccess } from "../middleware/guestMiddleware.js";

const router = express.Router();

router.get("/", handleGuestAccess(["user", "guest"]), getUsers); // Guests can view
router.get("/:id", getUser);
router.post("/", handleGuestAccess(["user"]), createUser); // Guests cannot create
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
