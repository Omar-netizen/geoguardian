import mongoose from "mongoose";

const preferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  regionName: {
    type: String,
    required: true,
  },
  coordinates: {
    // store bounding box / region of interest
    type: Object, 
    required: true,
    // example: { latMin: -10, latMax: 5, lonMin: -50, lonMax: -40 }
  },
  threshold: {
    type: Number,
    default: 5, // % change to trigger alerts
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Preference", preferenceSchema);
