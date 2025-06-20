import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true },
  password: { type: String, required: true },
  refreshToken: { type: String }, // store latest refresh token
});

const User = mongoose.model("User", userSchema);
export default User;
