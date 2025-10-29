// backend/controllers/monitoringController.js
import MonitoredRegion from "../models/MonitoredRegion.js";
import { manualCheckRegion } from "../services/schedulerService.js";

/**
 * POST /api/monitoring/regions
 * Add new region to monitor
 */
export const addMonitoredRegion = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, description, bbox, location, frequency, alertOnSeverity } = req.body;

    if (!name || !bbox) {
      return res.status(400).json({
        error: "Missing required fields: name, bbox",
      });
    }

    // Parse bbox if string
    let bboxArray = bbox;
    if (typeof bbox === "string") {
      bboxArray = bbox.split(",").map((val) => parseFloat(val.trim()));
    }

    const newRegion = new MonitoredRegion({
      userId,
      name,
      description,
      bbox: bboxArray,
      location: location || "Unknown",
      monitoring: {
        enabled: true,
        frequency: frequency || "weekly",
        alertOnSeverity: alertOnSeverity || ["high", "medium"],
      },
    });

    await newRegion.save();

    console.log(`✅ New monitored region added: ${name}`);

    res.status(201).json({
      success: true,
      message: "Region added to monitoring",
      region: newRegion,
    });
  } catch (error) {
    console.error("❌ Add region error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/monitoring/regions
 * Get all monitored regions for user
 */
export const getMonitoredRegions = async (req, res) => {
  try {
    const userId = req.user._id;

    const regions = await MonitoredRegion.find({ userId }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: regions.length,
      regions,
    });
  } catch (error) {
    console.error("❌ Get regions error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/monitoring/regions/:id
 * Get specific region details
 */
export const getMonitoredRegionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const region = await MonitoredRegion.findOne({ _id: id, userId });

    if (!region) {
      return res.status(404).json({ error: "Region not found" });
    }

    res.json({
      success: true,
      region,
    });
  } catch (error) {
    console.error("❌ Get region error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/monitoring/regions/:id
 * Update monitored region settings
 */
export const updateMonitoredRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const region = await MonitoredRegion.findOneAndUpdate(
      { _id: id, userId },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!region) {
      return res.status(404).json({ error: "Region not found" });
    }

    res.json({
      success: true,
      message: "Region updated",
      region,
    });
  } catch (error) {
    console.error("❌ Update region error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/monitoring/regions/:id
 * Delete monitored region
 */
export const deleteMonitoredRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const region = await MonitoredRegion.findOneAndDelete({ _id: id, userId });

    if (!region) {
      return res.status(404).json({ error: "Region not found" });
    }

    res.json({
      success: true,
      message: "Region deleted from monitoring",
    });
  } catch (error) {
    console.error("❌ Delete region error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/monitoring/regions/:id/check
 * Manually trigger check for region (for testing)
 */
export const triggerManualCheck = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Verify ownership
    const region = await MonitoredRegion.findOne({ _id: id, userId });
    if (!region) {
      return res.status(404).json({ error: "Region not found" });
    }

    console.log(`🔍 Manual check triggered for: ${region.name}`);

    // Run check in background
    manualCheckRegion(id)
      .then(() => console.log(`✅ Manual check complete for ${region.name}`))
      .catch((err) => console.error(`❌ Manual check failed:`, err));

    res.json({
      success: true,
      message: "Manual check started",
      note: "Check is running in background, you will receive email if changes detected",
    });
  } catch (error) {
    console.error("❌ Manual check error:", error.message);
    res.status(500).json({ error: error.message });
  }
};