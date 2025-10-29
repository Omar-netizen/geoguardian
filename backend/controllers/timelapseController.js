// backend/controllers/timelapseController.js
import { 
  generateTimelapseFrames, 
  generateDateRange, 
  saveTimelapseToGridFS 
} from "../services/timelapseService.js";
import { getGFS } from "../config/gridfs.js";
import mongoose from "mongoose";

/**
 * POST /api/timelapse/generate
 * Generate time-lapse animation frames
 */
export const createTimelapse = async (req, res) => {
  try {
    const { startDate, endDate, bbox, intervalDays = 15, width = 512, height = 512 } = req.body;

    // Validate inputs
    if (!startDate || !endDate || !bbox) {
      return res.status(400).json({
        error: "Missing required fields: startDate, endDate, bbox",
      });
    }

    console.log(`🎬 Time-lapse request: ${startDate} to ${endDate}`);

    // Parse bbox if string
    let bboxArray = bbox;
    if (typeof bbox === 'string') {
      bboxArray = bbox.split(',').map(val => parseFloat(val.trim()));
    }

    // Validate bbox
    if (!Array.isArray(bboxArray) || bboxArray.length !== 4) {
      return res.status(400).json({
        error: "BBox must be an array of 4 numbers",
      });
    }

    // Generate date range
    const dates = generateDateRange(startDate, endDate, parseInt(intervalDays));
    
    if (dates.length > 20) {
      return res.status(400).json({
        error: `Too many frames (${dates.length}). Maximum 20 frames allowed. Try increasing intervalDays.`,
      });
    }

    console.log(`📅 Generating ${dates.length} frames...`);

    // Generate time-lapse frames
    const timelapseData = await generateTimelapseFrames(
      dates, 
      bboxArray, 
      parseInt(width), 
      parseInt(height)
    );

    // Save to GridFS
    const savedData = await saveTimelapseToGridFS(timelapseData.frames, {
      startDate,
      endDate,
      bbox: bboxArray,
      frameCount: timelapseData.frameCount,
      dates: timelapseData.dates,
    });

    console.log(`✅ Generated ${savedData.frames.length} frames successfully`);

    res.json({
      success: true,
      message: "Time-lapse generated successfully",
      timelapseId: savedData.parentId,
      frames: savedData.frames, // These should have url property like "/api/timelapse/frame/:id"
      metadata: {
        startDate,
        endDate,
        frameCount: timelapseData.frameCount,
        dates: timelapseData.dates,
        dimensions: `${width}x${height}`,
        totalFrames: savedData.frames.length,
        delay: 800, // milliseconds between frames
      },
    });
  } catch (error) {
    console.error("❌ Create time-lapse error:", error.message);
    console.error(error.stack);
    res.status(500).json({
      error: "Time-lapse generation failed",
      details: error.message,
    });
  }
};

/**
 * GET /api/timelapse/:parentId/frames
 * Get all frames for a time-lapse
 */
export const getTimelapseFrames = async (req, res) => {
  try {
    const { parentId } = req.params;

    const gfs = getGFS();

    // Find all frames with this parentId
    const frames = await gfs
      .find({ "metadata.parentId": parentId, "metadata.type": "timelapse_frame" })
      .sort({ "metadata.frameNumber": 1 })
      .toArray();

    if (!frames || frames.length === 0) {
      return res.status(404).json({ error: "Time-lapse frames not found" });
    }

    const frameList = frames.map(f => ({
      frameId: f._id.toString(),
      frameNumber: f.metadata.frameNumber,
      date: f.metadata.date,
      url: `/api/timelapse/frame/${f._id}`,
    }));

    res.json({
      success: true,
      parentId,
      frameCount: frames.length,
      frames: frameList,
      metadata: {
        startDate: frames[0].metadata.startDate,
        endDate: frames[0].metadata.endDate,
        bbox: frames[0].metadata.bbox,
      },
    });
  } catch (error) {
    console.error("❌ Get frames error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/timelapse/frame/:frameId
 * Get single frame image
 */
export const getFrame = async (req, res) => {
  try {
    const { frameId } = req.params;

    console.log(`🖼️ Fetching frame: ${frameId}`);

    // Validate frameId
    if (!mongoose.Types.ObjectId.isValid(frameId)) {
      console.error(`❌ Invalid frame ID: ${frameId}`);
      return res.status(400).json({ error: "Invalid frame ID" });
    }

    const gfs = getGFS();
    const objectId = new mongoose.Types.ObjectId(frameId);

    // Get file metadata first
    const files = await gfs.find({ _id: objectId }).toArray();
    
    if (!files || files.length === 0) {
      console.error(`❌ Frame not found: ${frameId}`);
      return res.status(404).json({ error: "Frame not found" });
    }

    const file = files[0];
    console.log(`✅ Found frame: ${file.filename}, size: ${file.length} bytes`);

    // Set headers
    const contentType = file.contentType || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", file.length);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow CORS

    // Stream the file
    const downloadStream = gfs.openDownloadStream(objectId);
    
    downloadStream.on("error", (error) => {
      console.error("❌ Stream error:", error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming frame" });
      }
    });

    downloadStream.on("end", () => {
      console.log(`✅ Frame streamed successfully: ${frameId}`);
    });

    // Pipe the stream to response
    downloadStream.pipe(res);

  } catch (error) {
    console.error("❌ Get frame error:", error.message);
    console.error(error.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
};