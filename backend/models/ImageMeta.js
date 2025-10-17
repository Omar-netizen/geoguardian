import mongoose from "mongoose";

const ImageMetaSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    layer: { type: String, required: true },
    bbox: { type: String, required: true },
    filename: { type: String, required: true }, // stored in GridFS
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("ImageMeta", ImageMetaSchema);
