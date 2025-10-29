// backend/models/MonitoredRegion.js
import mongoose from "mongoose";

const monitoredRegionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    name: {
      type: String,
      required: true,
      trim: true,
    },
    
    description: {
      type: String,
      default: "",
    },
    
    bbox: {
      type: [Number],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 4,
        message: "BBox must be an array of 4 numbers",
      },
    },
    
    location: {
      type: String,
      default: "Unknown",
    },
    
    // Monitoring settings
    monitoring: {
      enabled: {
        type: Boolean,
        default: true,
      },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
        default: "weekly",
      },
      alertOnSeverity: {
        type: [String],
        default: ["high", "medium"],
        enum: ["low", "medium", "high"],
      },
    },
    
    // Last check info
    lastChecked: {
      type: Date,
      default: null,
    },
    
    lastImageId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    
    lastChangePercentage: {
      type: Number,
      default: 0,
    },
    
    totalAlertsSent: {
      type: Number,
      default: 0,
    },
    
    createdAt: {
      type: Date,
      default: Date.now,
    },
    
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
monitoredRegionSchema.index({ userId: 1, "monitoring.enabled": 1 });

export default mongoose.model("MonitoredRegion", monitoredRegionSchema);