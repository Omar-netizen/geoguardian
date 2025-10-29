// backend/controllers/analysisController.js
import Analysis from "../models/Analysis.js";
import mongoose from "mongoose";

/**
 * 💾 POST /api/analysis
 * Save a new analysis result
 */
export const saveAnalysis = async (req, res) => {
  try {
    const userId = req.user._id; // From authMiddleware
    const {
      title,
      description,
      location,
      bbox,
      nasaLayer,
      date,
      imageFileId,
      analysis,
    } = req.body;

    console.log("📥 Received save analysis request:");
    console.log("User ID:", userId);
    console.log("Body:", req.body);

    // Validate required fields
    if (!imageFileId || !bbox || !nasaLayer || !date) {
      console.log("❌ Validation failed:");
      console.log("imageFileId:", imageFileId);
      console.log("bbox:", bbox);
      console.log("nasaLayer:", nasaLayer);
      console.log("date:", date);
      
      return res.status(400).json({
        error: "Missing required fields: imageFileId, bbox, nasaLayer, date",
      });
    }

    console.log(`📊 Saving analysis for user: ${userId}`);

    // Create new analysis record
    const newAnalysis = new Analysis({
      userId,
      title: title || "Satellite Analysis",
      description,
      location,
      bbox,
      nasaLayer,
      date: new Date(date),
      imageFileId: new mongoose.Types.ObjectId(imageFileId),
      analysis: analysis || {},
      status: "completed",
    });

    // Save to database
    await newAnalysis.save();

    console.log(`✅ Analysis saved: ${newAnalysis._id}`);

    res.status(201).json({
      success: true,
      message: "Analysis saved successfully",
      analysisId: newAnalysis._id,
      data: newAnalysis,
    });
  } catch (err) {
    console.error("❌ Save Analysis Error:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({
      error: "Failed to save analysis",
      details: err.message,
    });
  }
};

/**
 * 📜 GET /api/analysis
 * Get all analyses for current user
 */
export const getUserAnalyses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, sortBy = "createdAt" } = req.query;

    console.log(`📋 Fetching analyses for user: ${userId}`);

    const skip = (page - 1) * limit;

    // Fetch analyses with pagination
    // REMOVED .select("-imageFileId") - we need the imageFileId!
    const analyses = await Analysis.find({ userId })
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Return plain JS objects for better performance

    // Get total count
    const total = await Analysis.countDocuments({ userId });

    console.log(`✅ Found ${analyses.length} analyses (total: ${total})`);
    
    // Debug: Log first analysis to verify imageFileId is present
    if (analyses.length > 0) {
      console.log(`🔍 Sample analysis imageFileId:`, analyses[0].imageFileId);
    }

    res.json({
      success: true,
      data: analyses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ Get Analyses Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch analyses",
      details: err.message,
    });
  }
};

/**
 * 🔍 GET /api/analysis/:id
 * Get a specific analysis by ID
 */
export const getAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid analysis ID" });
    }

    console.log(`🔍 Fetching analysis: ${id}`);

    // Find analysis and ensure it belongs to current user
    const analysis = await Analysis.findOne({
      _id: id,
      userId,
    });

    if (!analysis) {
      return res.status(404).json({
        error: "Analysis not found or access denied",
      });
    }

    console.log(`✅ Found analysis: ${analysis.title}`);
    console.log(`🔍 Analysis imageFileId:`, analysis.imageFileId);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    console.error("❌ Get Analysis Error:", err.message);
    res.status(500).json({
      error: "Failed to fetch analysis",
      details: err.message,
    });
  }
};

/**
 * 🗑️ DELETE /api/analysis/:id
 * Delete an analysis
 */
export const deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid analysis ID" });
    }

    console.log(`🗑️ Deleting analysis: ${id}`);

    // Delete and ensure it belongs to current user
    const result = await Analysis.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!result) {
      return res.status(404).json({
        error: "Analysis not found or access denied",
      });
    }

    console.log(`✅ Analysis deleted: ${id}`);

    res.json({
      success: true,
      message: "Analysis deleted successfully",
    });
  } catch (err) {
    console.error("❌ Delete Analysis Error:", err.message);
    res.status(500).json({
      error: "Failed to delete analysis",
      details: err.message,
    });
  }
};

/**
 * 📝 PUT /api/analysis/:id
 * Update analysis (title, description, notes)
 */
export const updateAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { title, description, location } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid analysis ID" });
    }

    console.log(`📝 Updating analysis: ${id}`);

    const updatedAnalysis = await Analysis.findOneAndUpdate(
      { _id: id, userId },
      {
        title,
        description,
        location,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedAnalysis) {
      return res.status(404).json({
        error: "Analysis not found or access denied",
      });
    }

    console.log(`✅ Analysis updated: ${id}`);

    res.json({
      success: true,
      message: "Analysis updated successfully",
      data: updatedAnalysis,
    });
  } catch (err) {
    console.error("❌ Update Analysis Error:", err.message);
    res.status(500).json({
      error: "Failed to update analysis",
      details: err.message,
    });
  }
};