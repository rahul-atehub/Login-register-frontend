import express from "express";
import cors from "cors"; // Add this import
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/auth.js"; // Import auth routes
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Vite's default port
    credentials: true, // Enable credentials (cookies, authorization headers, etc)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
  })
  .catch((error) => {
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1); // Exit process with failure
  });

// Middleware
app.use(express.json()); // Parse JSON body

// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes); // Use auth routes

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Express ES Module Backend!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
