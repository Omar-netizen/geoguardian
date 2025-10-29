import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import MapSelector from "../components/MapSelector";
import { Film, Calendar, Map, Sliders, Play, Pause, ChevronLeft, ChevronRight, AlertCircle, Info, Flame, Sprout, Trees } from "lucide-react";
import config from "../config";

const TimeLapse = () => {
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-07-01");
  const [bbox, setBbox] = useState("-121.8,39.8,-121.3,40.3");
  const [intervalDays, setIntervalDays] = useState(15);
  const [showMap, setShowMap] = useState(false);

  const [frames, setFrames] = useState([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");
  const timerRef = useRef(null);

  // Slideshow logic
  useEffect(() => {
    if (isPlaying && frames.length > 0) {
      timerRef.current = setInterval(() => {
        setCurrentFrame((frame) =>
          frame < frames.length - 1 ? frame + 1 : 0
        );
      }, metadata?.delay || 800);

      return () => clearInterval(timerRef.current);
    } else {
      clearInterval(timerRef.current);
    }
  }, [isPlaying, frames.length, metadata]);

  const generateTimelapse = async () => {
    try {
      setGenerating(true);
      setError(null);
      setFrames([]);
      setProgress("📅 Calculating date range...");

      const bboxArray = bbox.split(",").map((val) => parseFloat(val.trim()));

      setProgress(`🛰️ Fetching satellite images...`);

      const response = await axios.post(
        `${config.API_URL}/api/timelapse/generate`,
        {
          startDate,
          endDate,
          bbox: bboxArray,
          intervalDays: parseInt(intervalDays),
          width: 512,
          height: 512,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("🔍 Response received:", response.data);
      console.log("🔍 Frames array:", response.data.frames);
      console.log("🔍 First frame:", response.data.frames[0]);

      setFrames(response.data.frames);
      setMetadata(response.data.metadata);
      setCurrentFrame(0);
      setProgress("✅ Frames ready!");
      
      console.log(`✅ Successfully loaded ${response.data.frames.length} frames`);
    } catch (err) {
      console.error("❌ Error generating timelapse:", err);
      setError(err.response?.data?.details || err.message || "Failed to generate frames");
      setProgress("");
    } finally {
      setGenerating(false);
      setIsPlaying(false);
    }
  };

  const handleMapBBoxSelect = (mapBbox) => {
    const bboxString = `${mapBbox.west},${mapBbox.south},${mapBbox.east},${mapBbox.north}`;
    setBbox(bboxString);
    setShowMap(false);
  };

  const estimateFrames = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const framesCount = Math.floor(diffDays / intervalDays) + 1;
    return Math.min(framesCount, 20);
  };

  // Slideshow controls
  const goToPrevFrame = () => setCurrentFrame((frame) => Math.max(frame - 1, 0));
  const goToNextFrame = () => setCurrentFrame((frame) => Math.min(frame + 1, frames.length - 1));
  const togglePlay = () => setIsPlaying((play) => !play);

  // Get current frame image URL
  const getCurrentImageUrl = () => {
    if (!frames[currentFrame]) return "";
    const frameUrl = frames[currentFrame].url;
    const fullUrl = `${config.API_URL}${frameUrl}`;
    console.log(`🖼️ Loading frame ${currentFrame + 1}: ${fullUrl}`);
    return fullUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white py-12 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Film className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Time-Lapse Generator</h1>
          </div>
          <p className="text-purple-100 text-lg">Create interactive slideshows of environmental changes over time</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Input Form Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            Configure Time-Lapse
          </h2>
          
          {/* Date Range */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {/* Interval Slider */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              Interval Between Frames: {intervalDays} days
            </label>
            <input
              type="range"
              min="5"
              max="30"
              value={intervalDays}
              onChange={(e) => setIntervalDays(e.target.value)}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <p className="text-xs text-slate-500 mt-2">
              Estimated frames: <span className="font-semibold text-purple-600">{estimateFrames()}</span> (max 20)
            </p>
          </div>

          {/* Bounding Box */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Map className="w-4 h-4 text-purple-600" />
              Bounding Box (Region)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={bbox}
                onChange={(e) => setBbox(e.target.value)}
                placeholder="west,south,east,north"
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
              />
              <button
                onClick={() => setShowMap(!showMap)}
                className={`px-6 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
                  showMap ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                <Map className="w-5 h-5" />
                {showMap ? "Close Map" : "Select on Map"}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              California: -121.8,39.8,-121.3,40.3 | Amazon: -54.5,-3.5,-54.0,-3.0
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateTimelapse}
            disabled={generating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Film className="w-6 h-6" />
            {generating ? progress : "🎬 Generate Time-Lapse"}
          </button>
        </div>

        {/* Map Selector */}
        {showMap && (
          <div className="mb-8">
            <MapSelector
              onBBoxSelect={handleMapBBoxSelect}
              initialBBox={
                bbox
                  ? {
                      west: parseFloat(bbox.split(",")[0]),
                      south: parseFloat(bbox.split(",")[1]),
                      east: parseFloat(bbox.split(",")[2]),
                      north: parseFloat(bbox.split(",")[3]),
                    }
                  : null
              }
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-8 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        {metadata && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Info className="w-6 h-6 text-purple-600" />
              Time-Lapse Information
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-slate-600 mb-1">Date Range</p>
                <p className="text-sm text-slate-800">{metadata.startDate} to {metadata.endDate}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-slate-600 mb-1">Frames</p>
                <p className="text-sm text-slate-800 font-bold">{metadata.frameCount}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-slate-600 mb-1">Frame Delay</p>
                <p className="text-sm text-slate-800">{metadata.delay}ms</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-slate-600 mb-1">Dimensions</p>
                <p className="text-sm text-slate-800">{metadata.dimensions}</p>
              </div>
            </div>
          </div>
        )}

        {/* Frame-by-frame Slideshow */}
        {frames.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-purple-500">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3 justify-center">
              <Film className="w-8 h-8 text-purple-600" />
              Interactive Animation Preview
            </h2>
            
            {/* Image Display */}
            <div className="flex justify-center items-center min-h-96 mb-6 bg-slate-50 rounded-lg p-4">
              <img
                src={getCurrentImageUrl()}
                alt={`Frame ${currentFrame + 1}`}
                className="max-w-full rounded-lg shadow-xl border-4 border-purple-500"
                onLoad={() => console.log(`✅ Frame ${currentFrame + 1} loaded successfully`)}
                onError={(e) => {
                  console.error(`❌ Frame ${currentFrame + 1} failed to load`);
                  console.error("Failed URL:", e.target.src);
                  console.error("Frame data:", frames[currentFrame]);
                }}
              />
            </div>

            {/* Date Display */}
            <div className="text-center mb-6">
              <p className="text-xl font-bold text-slate-800">
                {frames[currentFrame]?.date || "N/A"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Frame {currentFrame + 1} / {frames.length}
              </p>
            </div>

            {/* Playback Controls */}
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={goToPrevFrame}
                disabled={currentFrame === 0}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Prev
              </button>
              <button
                onClick={togglePlay}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Play
                  </>
                )}
              </button>
              <button
                onClick={goToNextFrame}
                disabled={currentFrame === frames.length - 1}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Examples */}
        {!frames.length && !generating && (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">💡 Example Use Cases</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200 text-center">
                <div className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flame className="w-8 h-8 text-orange-700" />
                </div>
                <h4 className="font-bold text-slate-800 mb-2 text-lg">Wildfire Progression</h4>
                <p className="text-slate-600 mb-3">Track fire spread over weeks</p>
                <p className="text-xs text-slate-500 bg-white p-2 rounded">2024-07-01 to 2024-08-01, 3-day intervals</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 text-center">
                <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sprout className="w-8 h-8 text-green-700" />
                </div>
                <h4 className="font-bold text-slate-800 mb-2 text-lg">Agricultural Seasons</h4>
                <p className="text-slate-600 mb-3">Watch crops grow from planting to harvest</p>
                <p className="text-xs text-slate-500 bg-white p-2 rounded">2024-03-01 to 2024-09-01, 15-day intervals</p>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200 text-center">
                <div className="w-16 h-16 bg-teal-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trees className="w-8 h-8 text-teal-700" />
                </div>
                <h4 className="font-bold text-slate-800 mb-2 text-lg">Deforestation</h4>
                <p className="text-slate-600 mb-3">Document forest loss over months</p>
                <p className="text-xs text-slate-500 bg-white p-2 rounded">2024-01-01 to 2024-12-01, 30-day intervals</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeLapse;