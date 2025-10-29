// backend/services/schedulerService.js
import cron from "node-cron";
import MonitoredRegion from "../models/MonitoredRegion.js";
import { fetchSatelliteImage } from "./sentinelService.js";
import { detectChanges } from "./changeDetectionService.js";
import { sendChangeAlert } from "./emailService.js";
import { getGFS } from "../config/gridfs.js";
import mongoose from "mongoose";

/**
 * Start automated monitoring scheduler
 */
export const startScheduler = () => {
  console.log("🕐 Starting automated monitoring scheduler...");

  // Run daily at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Daily monitoring check started...");
    await checkDailyRegions();
  });

  // Run weekly on Monday at 9:00 AM
  cron.schedule("0 9 * * 1", async () => {
    console.log("⏰ Weekly monitoring check started...");
    await checkWeeklyRegions();
  });

  // Run monthly on 1st day at 9:00 AM
  cron.schedule("0 9 1 * *", async () => {
    console.log("⏰ Monthly monitoring check started...");
    await checkMonthlyRegions();
  });

  console.log("✅ Scheduler initialized");
  console.log("📅 Daily checks: 9:00 AM every day");
  console.log("📅 Weekly checks: 9:00 AM every Monday");
  console.log("📅 Monthly checks: 9:00 AM on 1st of month");
};

/**
 * Check regions set for daily monitoring
 */
const checkDailyRegions = async () => {
  await checkRegionsByFrequency("daily");
};

/**
 * Check regions set for weekly monitoring
 */
const checkWeeklyRegions = async () => {
  await checkRegionsByFrequency("weekly");
};

/**
 * Check regions set for monthly monitoring
 */
const checkMonthlyRegions = async () => {
  await checkRegionsByFrequency("monthly");
};

/**
 * Check regions by frequency
 */
const checkRegionsByFrequency = async (frequency) => {
  try {
    console.log(`🔍 Checking ${frequency} monitored regions...`);

    const regions = await MonitoredRegion.find({
      "monitoring.enabled": true,
      "monitoring.frequency": frequency,
    }).populate("userId", "email");

    console.log(`Found ${regions.length} ${frequency} regions to check`);

    for (const region of regions) {
      try {
        await checkRegion(region);
      } catch (error) {
        console.error(`❌ Error checking region ${region._id}:`, error.message);
      }
    }

    console.log(`✅ ${frequency} monitoring check complete`);
  } catch (error) {
    console.error(`❌ Error in ${frequency} check:`, error.message);
  }
};

/**
 * Check a single region for changes
 */
const checkRegion = async (region) => {
  try {
    console.log(`📍 Checking region: ${region.name}`);

    const today = new Date().toISOString().split("T")[0];

    // Fetch new image
    const newImageBuffer = await fetchSatelliteImage(today, region.bbox);

    if (!newImageBuffer || newImageBuffer.length < 1000) {
      console.log(`⚠️ No data for ${region.name} on ${today}`);
      return;
    }

    // Save new image to GridFS
    const gfs = getGFS();
    const newImageId = new mongoose.Types.ObjectId();
    const filename = `monitor_${region.name}_${Date.now()}.jpg`;

    const uploadStream = gfs.openUploadStreamWithId(newImageId, filename, {
      metadata: {
        regionId: region._id,
        date: today,
        type: "monitoring",
      },
      contentType: "image/jpeg",
    });

    await new Promise((resolve, reject) => {
      uploadStream.on("finish", resolve);
      uploadStream.on("error", reject);
      uploadStream.end(newImageBuffer);
    });

    console.log(`✅ New image saved: ${newImageId}`);

    // If this is the first check, just save the image
    if (!region.lastImageId) {
      region.lastImageId = newImageId;
      region.lastChecked = new Date();
      await region.save();
      console.log(`📝 First check for ${region.name} - baseline set`);
      return;
    }

    // Compare with last image
    console.log(`🔍 Comparing with previous image...`);

    // Fetch last image
    const lastImageChunks = [];
    const lastImageStream = gfs.openDownloadStream(region.lastImageId);

    await new Promise((resolve, reject) => {
      lastImageStream.on("data", (chunk) => lastImageChunks.push(chunk));
      lastImageStream.on("end", resolve);
      lastImageStream.on("error", reject);
    });

    const lastImageBuffer = Buffer.concat(lastImageChunks);

    // Run change detection
    const analysis = await detectChanges(lastImageBuffer, newImageBuffer);

    console.log(
      `📊 Change detected: ${analysis.changePercentage}% (${analysis.severity})`
    );

    // Check if alert should be sent
    if (region.monitoring.alertOnSeverity.includes(analysis.severity)) {
      console.log(`📧 Sending alert to user...`);

      try {
        await sendChangeAlert(region.userId.email, {
          ...analysis,
          location: region.name,
          date: today,
        });

        region.totalAlertsSent += 1;
        console.log(`✅ Alert sent to ${region.userId.email}`);
      } catch (emailError) {
        console.error("⚠️ Email alert failed:", emailError.message);
      }
    } else {
      console.log(
        `ℹ️ No alert needed - ${analysis.severity} not in alert list`
      );
    }

    // Update region record
    region.lastImageId = newImageId;
    region.lastChecked = new Date();
    region.lastChangePercentage = analysis.changePercentage;
    await region.save();

    console.log(`✅ Region ${region.name} check complete`);
  } catch (error) {
    console.error(`❌ Error checking region ${region.name}:`, error.message);
    throw error;
  }
};

/**
 * Manually trigger check for a specific region (for testing)
 */
export const manualCheckRegion = async (regionId) => {
  const region = await MonitoredRegion.findById(regionId).populate(
    "userId",
    "email"
  );

  if (!region) {
    throw new Error("Region not found");
  }

  await checkRegion(region);
  return { success: true, message: "Manual check completed" };
};