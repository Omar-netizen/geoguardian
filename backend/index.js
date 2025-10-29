// backend/index.js
import 'dotenv/config';
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import protectedRoutes from "./routes/protected.js";
import preferenceRoutes from "./routes/preferences.js";
import nasaRoutes from "./routes/nasa.js";
import analysisRoutes from "./routes/analysis.js";
import changeDetectionRoutes from "./routes/changeDetection.js";
import timelapseRoutes from "./routes/timelapse.js";
import monitoringRoutes from "./routes/monitoring.js";
import connectDB from "./config/db.js";
import { initGridFS } from "./config/gridfs.js";
import { startScheduler } from "./services/schedulerService.js";

dotenv.config();

const app = express();

// ✅ Enhanced CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://geoguardian.vercel.app'  // ← Fixed: removed trailing comma
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Increase payload size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/preferences", preferenceRoutes);
app.use("/api/nasa", nasaRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/change-detection", changeDetectionRoutes);
app.use("/api/timelapse", timelapseRoutes);
app.use("/api/monitoring", monitoringRoutes);

// Start the monitoring scheduler
startScheduler();

// ✅ Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "GeoGuardian Backend Running 🚀",
    timestamp: new Date().toISOString()
  });
});

// ✅ Health check for API
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK",
    message: "Backend is healthy",
    timestamp: new Date().toISOString()
  });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    timestamp: new Date().toISOString()
  });
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    requested: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

// Connect to DB and start server
connectDB()
  .then((conn) => {
    console.log("✅ MongoDB connected successfully");
    
    // Initialize GridFS after DB connection is ready
    initGridFS(conn);
    console.log("✅ GridFS initialized");

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  🛰️  GeoGuardian Backend               ║
║  ✅ Server: http://localhost:${PORT}     ║
║  📡 CORS: Localhost + Vercel           ║
║  🗄️  GridFS: Ready                     ║
║  ⚡ Status: Running                    ║
╚════════════════════════════════════════╝
      `);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });