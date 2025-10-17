import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import Preference from "../models/Preference.js";

const router = express.Router();

// ✅ Add a preference
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { regionName, coordinates, threshold } = req.body;

    const preference = new Preference({
      user: req.user,
      regionName,
      coordinates,
      threshold,
    });

    await preference.save();
    res.status(201).json(preference);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all preferences for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const preferences = await Preference.find({ user: req.user });
    res.json(preferences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete a preference
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const pref = await Preference.findOneAndDelete({
      _id: req.params.id,
      user: req.user,
    });

    if (!pref) return res.status(404).json({ message: "Preference not found" });

    res.json({ message: "Preference deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
