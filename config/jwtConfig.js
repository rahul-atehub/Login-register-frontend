// config/jwtConfig.js
import dotenv from "dotenv";
dotenv.config();

const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET,
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRY: process.env.JWT_EXPIRY || "15m",
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",
};

if (!JWT_CONFIG.SECRET || !JWT_CONFIG.REFRESH_SECRET) {
  throw new Error("Missing JWT_SECRET or JWT_REFRESH_SECRET in .env");
}

export default JWT_CONFIG;
