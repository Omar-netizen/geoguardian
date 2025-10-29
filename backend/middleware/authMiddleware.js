// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided or invalid format" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(400).json({ error: "Invalid token payload" });
    }

    // Find user and attach to request
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Attach user object (with _id) to request
    req.user = user;
    next();

  } catch (err) {
    console.error("❌ Auth Middleware Error:", err.message);
    res.status(401).json({ error: "Unauthorized or invalid token" });
  }
};
export default authMiddleware;