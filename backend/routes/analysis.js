// backend/routes/analysis.js
import express from "express";
import {
  saveAnalysis,
  getUserAnalyses,
  getAnalysisById,
  deleteAnalysis,
  updateAnalysis,
} from "../controllers/analysisController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All analysis routes require authentication
router.use(authMiddleware);

// POST: Save new analysis
router.post("/", saveAnalysis);

// GET: List all analyses for current user (with pagination)
router.get("/", getUserAnalyses);

// GET: Get specific analysis by ID
router.get("/:id", getAnalysisById);

// PUT: Update analysis details
router.put("/:id", updateAnalysis);

// DELETE: Delete analysis
router.delete("/:id", deleteAnalysis);

export default router;