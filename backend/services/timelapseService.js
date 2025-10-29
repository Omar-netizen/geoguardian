// backend/services/timelapseService.js
import { fetchSatelliteImage } from "./sentinelService.js";
import sharp from "sharp";
import { getGFS } from "../config/gridfs.js";
import mongoose from "mongoose";

/**
 * Generate time-lapse animation frames (stored individually)
 * @param {Array} dates - Array of dates in YYYY-MM-DD format
 * @param {Array} bbox - Bounding box coordinates
 * @param {Number} width - Frame width
 * @param {Number} height - Frame height
 * @returns {Object} - Frame data and metadata
 */
export const generateTimelapseFrames = async (dates, bbox, width = 512, height = 512) => {
  try {
    console.log(`🎬 Starting time-lapse generation for ${dates.length} frames...`);
    
    if (!dates || dates.length < 2) {
      throw new Error("At least 2 dates required for time-lapse");
    }

    const frames = [];
    let frameCount = 0;

    // Fetch and process each frame
    for (const date of dates) {
      try {
        console.log(`📥 Fetching frame ${frameCount + 1}/${dates.length} for date: ${date}`);
        
        const imageBuffer = await fetchSatelliteImage(date, bbox, width, height);
        
        if (!imageBuffer || imageBuffer.length < 1000) {
          console.warn(`⚠️ Skipping ${date} - insufficient data`);
          continue;
        }

        // Add date label to image using sharp
        const svg = `
          <svg width="${width}" height="${height}">
            <rect x="10" y="${height - 40}" width="150" height="30" fill="rgba(0,0,0,0.7)" rx="5"/>
            <text x="20" y="${height - 18}" font-family="Arial" font-size="16" font-weight="bold" fill="white">${date}</text>
          </svg>
        `;

        const labeledImage = await sharp(imageBuffer)
          .resize(width, height)
          .composite([{
            input: Buffer.from(svg),
            gravity: 'southeast'
          }])
          .jpeg({ quality: 85 })
          .toBuffer();

        frames.push({
          date,
          buffer: labeledImage,
          size: labeledImage.length,
        });

        frameCount++;
        console.log(`✅ Frame ${frameCount} processed successfully`);
        
      } catch (frameError) {
        console.error(`❌ Error processing frame for ${date}:`, frameError.message);
        // Continue with next frame
      }
    }

    if (frameCount === 0) {
      throw new Error("No frames could be generated. Check dates and location.");
    }

    console.log(`✅ Time-lapse frames ready: ${frameCount} frames`);

    return {
      frames,
      frameCount,
      dates: frames.map(f => f.date),
    };
  } catch (error) {
    console.error("❌ Time-lapse generation error:", error.message);
    throw new Error(`Time-lapse generation failed: ${error.message}`);
  }
};

/**
 * Generate date range for time-lapse
 * @param {String} startDate - Start date YYYY-MM-DD
 * @param {String} endDate - End date YYYY-MM-DD
 * @param {Number} intervalDays - Days between frames (default: 15)
 * @returns {Array} - Array of date strings
 */
export const generateDateRange = (startDate, endDate, intervalDays = 15) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    throw new Error("Start date must be before end date");
  }

  let currentDate = new Date(start);
  
  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + intervalDays);
  }

  // Always include end date if not already included
  const lastDate = dates[dates.length - 1];
  const endDateStr = endDate;
  if (lastDate !== endDateStr) {
    dates.push(endDateStr);
  }

  console.log(`📅 Generated ${dates.length} dates from ${startDate} to ${endDate}`);
  return dates;
};

/**
 * Save time-lapse frames to GridFS
 * @param {Array} frames - Array of frame objects
 * @param {Object} metadata - Time-lapse metadata
 * @returns {Object} - Parent ID and frame URLs
 */
export const saveTimelapseToGridFS = async (frames, metadata) => {
  try {
    const gfs = getGFS();
    const parentId = new mongoose.Types.ObjectId();
    const savedFrames = [];

    console.log(`💾 Saving ${frames.length} frames to GridFS...`);

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const fileId = new mongoose.Types.ObjectId();
      const filename = `timelapse_frame_${i}_${frame.date}.jpg`;

      const uploadStream = gfs.openUploadStreamWithId(fileId, filename, {
        metadata: {
          type: "timelapse_frame",
          parentId: parentId.toString(),
          frameNumber: i,
          date: frame.date,
          startDate: metadata.startDate,
          endDate: metadata.endDate,
          bbox: metadata.bbox,
          uploadDate: new Date(),
        },
        contentType: "image/jpeg",
      });

      await new Promise((resolve, reject) => {
        uploadStream.on("finish", () => {
          // THIS IS THE FIX: Add the url property!
          savedFrames.push({
            frameId: fileId.toString(),
            date: frame.date,
            frameNumber: i,
            url: `/api/timelapse/frame/${fileId.toString()}`, // ← ADDED THIS LINE
          });
          console.log(`✅ Saved frame ${i + 1}: ${filename} (${fileId})`);
          resolve();
        });
        uploadStream.on("error", (err) => {
          console.error(`❌ Failed to save frame ${i}:`, err.message);
          reject(err);
        });
        uploadStream.end(frame.buffer);
      });
    }

    console.log(`✅ ${frames.length} frames saved to GridFS with parent ID: ${parentId}`);
    console.log(`📋 Frame URLs:`, savedFrames.map(f => f.url));

    return {
      parentId: parentId.toString(),
      frames: savedFrames, // Now includes url property!
    };
  } catch (error) {
    console.error("❌ Save time-lapse error:", error.message);
    throw error;
  }
};