// backend/controllers/changeDetectionController.js
import { detectChanges, createDiffImage } from "../services/changeDetectionService.js";
import { sendChangeAlert } from "../services/emailService.js";
import { getGFS } from "../config/gridfs.js";
import mongoose from "mongoose";

/**
 * 🔍 POST /api/change-detection
 * Compare two satellite images and detect changes
 */
export const compareImages = async (req, res) => {
  try {
    const { beforeImageId, afterImageId, enableAlerts = true } = req.body;
    const userId = req.user._id;
    const userEmail = req.user.email || req.user.username;

    if (!userEmail) {
      console.warn("⚠️ No user email found — alerts will be skipped.");
    }

    // Validate input
    if (!beforeImageId || !afterImageId) {
      return res.status(400).json({
        error: "Missing required fields: beforeImageId, afterImageId",
      });
    }

    console.log(`🔍 Comparing images: ${beforeImageId} vs ${afterImageId}`);

    const gfs = getGFS();

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(beforeImageId) ||
      !mongoose.Types.ObjectId.isValid(afterImageId)
    ) {
      return res.status(400).json({ error: "Invalid image ID format" });
    }

    // Fetch before image
    console.log("📥 Fetching before image...");
    const beforeChunks = [];
    const beforeStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(beforeImageId));
    await new Promise((resolve, reject) => {
      beforeStream.on("data", (chunk) => beforeChunks.push(chunk));
      beforeStream.on("end", resolve);
      beforeStream.on("error", reject);
    });
    const beforeBuffer = Buffer.concat(beforeChunks);

    console.log(`✅ Before image loaded: ${beforeBuffer.length} bytes`);

    // Fetch after image
    console.log("📥 Fetching after image...");
    const afterChunks = [];
    const afterStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(afterImageId));
    await new Promise((resolve, reject) => {
      afterStream.on("data", (chunk) => afterChunks.push(chunk));
      afterStream.on("end", resolve);
      afterStream.on("error", reject);
    });
    const afterBuffer = Buffer.concat(afterChunks);

    console.log(`✅ After image loaded: ${afterBuffer.length} bytes`);

    // Run change detection
    const analysis = await detectChanges(beforeBuffer, afterBuffer);
    console.log("📊 Change analysis completed:", analysis);

    // 📩 Send alert if change significant
    if (enableAlerts && userEmail && analysis?.changePercentage > 20) {
      console.log("📧 Significant change detected — sending email alert...");
      await sendChangeAlert(userEmail, analysis);
      console.log("✅ Alert email sent!");
    }

    // Create difference visualization
    let diffImageId = null;
    try {
      console.log("🎨 Creating diff image...");
      const diffImage = await createDiffImage(beforeBuffer, afterBuffer);

      const diffFileId = new mongoose.Types.ObjectId();
      const diffStream = gfs.openUploadStreamWithId(
        diffFileId,
        `diff_${Date.now()}.png`,
        {
          contentType: "image/png",
          metadata: { type: "difference_map" },
        }
      );

      diffStream.end(diffImage);

      await new Promise((resolve, reject) => {
        diffStream.on("finish", resolve);
        diffStream.on("error", reject);
      });

      diffImageId = diffFileId;
      console.log(`✅ Diff image saved: ${diffFileId}`);
    } catch (diffError) {
      console.warn("⚠️ Diff image creation failed:", diffError.message);
    }

    return res.json({
      success: true,
      message: "Change detection completed",
      analysis: {
        ...analysis,
        diffImageId: diffImageId?.toString() || null,
      },
    });
  } catch (err) {
    console.error("❌ Change Detection Error:", err.message);
    return res.status(500).json({
      error: "Change detection failed",
      details: err.message,
    });
  }
};

/**
 * 📊 GET /api/change-detection/diff/:id
 * Retrieve difference image
 */
export const getDiffImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid image ID" });
    }

    const gfs = getGFS();
    const objectId = new mongoose.Types.ObjectId(id);

    const files = await gfs.find({ _id: objectId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ error: "Diff image not found" });
    }

    const file = files[0];
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", file.length);

    const downloadStream = gfs.openDownloadStream(objectId);
    downloadStream.pipe(res);

    downloadStream.on("error", (err) => {
      console.error("❌ Error streaming diff image:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming image" });
      }
    });
  } catch (err) {
    console.error("❌ getDiffImage Error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
};
