import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header("Authorization"); // Expecting "Bearer TOKEN"

    if (!token) return res.status(401).json({ message: "No token, access denied 🚫" });

    // remove "Bearer " prefix if present
    const actualToken = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

    // verify token
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);

    req.user = decoded.id; // attach user ID to request object
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid ❌" });
  }
};

export default authMiddleware;
