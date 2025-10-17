// config/gridfs.js
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let gfs = null;

export const initGridFS = (conn) => {
  if (!conn || !conn.db) {
    throw new Error("❌ Invalid MongoDB connection provided");
  }
  
  gfs = new GridFSBucket(conn.db, {
    bucketName: "satelliteImages" // Keeping your original collection name
  });
  
  console.log("✅ GridFS initialized");
  return gfs;
};

export const getGFS = () => {
  if (!gfs) {
    // Try to auto-initialize if mongoose connection is ready
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      return initGridFS(mongoose.connection);
    }
    throw new Error("❌ GridFS is not initialized yet");
  }
  return gfs;
};