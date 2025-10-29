// backend/models/Analysis.js
import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // For quick user lookups
    },
    
    // Analysis metadata
    title: {
      type: String,
      default: "Satellite Analysis",
    },
    
    description: {
      type: String,
      default: "",
    },

    // Image references (fileIds from GridFS)
    imageFileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      description: "Reference to satellite image in GridFS",
    },

    // Location info
    location: {
      type: String,
      default: "Unknown",
      example: "New York City",
    },

    bbox: {
      type: [Number], // [minLon, minLat, maxLon, maxLat]
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 4,
        message: "BBox must be an array of 4 numbers",
      },
    },

    // NASA API info
    nasaLayer: {
      type: String,
      required: true,
      example: "MODIS_Terra_CorrectedReflectance_TrueColor",
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    // Analysis results (for future use with change detection)
    analysis: {
      type: {
        // Will be populated after we add change detection
        changePercentage: Number, // e.g., 12.5
        changeType: String, // e.g., "deforestation", "flooding", "fire"
        severity: String, // "low", "medium", "high"
        summary: String, // Human-readable summary
      },
      default: {},
    },

    // Status tracking
    status: {
      type: String,
      enum: ["completed", "pending", "error"],
      default: "completed",
    },

    errorMessage: {
      type: String,
      default: null,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ date: -1 });

export default mongoose.model("Analysis", analysisSchema);