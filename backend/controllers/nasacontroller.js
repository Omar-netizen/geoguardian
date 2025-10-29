import { fetchSatelliteImage } from "../services/sentinelService.js";
import { getGFS } from "../config/gridfs.js";
import mongoose from "mongoose";

/**
 * 📸 POST /api/nasa/image
 * Fetches Sentinel-2 satellite image and stores it in MongoDB GridFS.
 */
export const getSatelliteImage = async (req, res) => {
  try {
    const { date, bbox } = req.body;

    console.log("📥 Received request:", { date, bbox });

    if (!date || !bbox) {
      return res.status(400).json({
        error: "Missing required fields: date, bbox",
      });
    }

    // Ensure bbox is array, not string
    let bboxArray = bbox;
    if (typeof bbox === 'string') {
      bboxArray = bbox.split(',').map(val => parseFloat(val.trim()));
      console.log("🔧 Converted bbox string to array:", bboxArray);
    }

    // Validate bbox array
    if (!Array.isArray(bboxArray) || bboxArray.length !== 4) {
      return res.status(400).json({
        error: "BBox must be an array of 4 numbers: [minLon, minLat, maxLon, maxLat]",
      });
    }

    console.log(`🛰️ Fetching Sentinel-2 image for ${date}`);
    const imageBuffer = await fetchSatelliteImage(date, bboxArray);

    if (!imageBuffer || imageBuffer.length === 0) {
      return res.status(404).json({
        error: "No image data received from Sentinel Hub",
      });
    }

    const gfs = getGFS();
    if (!gfs) throw new Error("GridFS not initialized");

    const fileId = new mongoose.Types.ObjectId();
    const filename = `sentinel_${date}_${Date.now()}.jpg`;

    const uploadStream = gfs.openUploadStreamWithId(fileId, filename, {
      metadata: { date, bbox: bboxArray, uploadDate: new Date(), source: "Sentinel-2" },
      contentType: "image/jpeg",
    });

    uploadStream.end(imageBuffer);

    uploadStream.on("finish", () => {
      console.log(`✅ File uploaded successfully: ${filename}`);
      
      const fileIdString = fileId.toString();
      
      res.json({
        success: true,
        message: "✅ Image saved successfully",
        fileId: fileIdString,
        filename: filename,
        imageUrl: `/api/nasa/image/${fileIdString}`,
        metadata: {
          fileId: fileIdString,
          date,
          layer: "Sentinel-2-L2A",
          bbox: bboxArray,
          uploadDate: new Date().toISOString(),
          size: `${(imageBuffer.length / 1024).toFixed(2)} KB`,
          source: "Sentinel Hub"
        }
      });
    });

    uploadStream.on("error", (err) => {
      console.error("❌ GridFS Upload Error:", err);
      if (!res.headersSent)
        res.status(500).json({ error: "Failed to save image", details: err.message });
    });
  } catch (err) {
    console.error("❌ Sentinel Controller Error:", err.message);
    if (!res.headersSent)
      res.status(500).json({
        error: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
  }
};

/**
 * 🖼️ GET /api/nasa/image/:id
 * Streams image directly from GridFS to browser
 */
export const getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🔍 Fetching image with ID: ${id}`);
    console.log(`📍 Request URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
    
    const gfs = getGFS();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`❌ Invalid ObjectId format: ${id}`);
      return res.status(400).json({ error: "Invalid image ID format" });
    }

    const objectId = new mongoose.Types.ObjectId(id);
    console.log(`🔎 Searching GridFS for ID: ${objectId}`);
    
    const files = await gfs.find({ _id: objectId }).toArray();
    
    if (!files || files.length === 0) {
      console.log(`❌ Image not found in GridFS with ID: ${id}`);
      return res.status(404).json({ error: "Image not found in database" });
    }

    const file = files[0];
    console.log(`✅ Found image: ${file.filename}`);
    console.log(`📊 File size: ${file.length} bytes`);
    
    // Set headers BEFORE piping
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', file.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Accept-Ranges', 'bytes');
    
    console.log(`📤 Response headers set, starting stream...`);

    const downloadStream = gfs.openDownloadStream(file._id);
    
    let bytesReceived = 0;
    downloadStream.on("data", (chunk) => {
      bytesReceived += chunk.length;
    });
    
    downloadStream.on("error", (err) => {
      console.error("❌ Download stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming image" });
      }
    });

    downloadStream.on("end", () => {
      console.log(`✅ Stream complete: ${file.filename} (${bytesReceived} bytes sent)`);
    });

    // Pipe stream to response
    downloadStream.pipe(res);

  } catch (err) {
    console.error("❌ getImageById Error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
};