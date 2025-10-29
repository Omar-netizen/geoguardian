// frontend/src/pages/CompareImages.jsx
import React, { useState } from "react";
import axios from "axios";
import MapSelector from "../components/MapSelector";
import AnalysisCharts from "../components/AnalysisCharts";
import { Search, Calendar, Map, Download, Satellite, AlertCircle, TrendingUp, BarChart3, Save, Image } from "lucide-react";

const CompareImages = () => {
  const [beforeDate, setBeforeDate] = useState("2024-07-20");
  const [afterDate, setAfterDate] = useState("2024-07-30");
  const [bbox, setBbox] = useState("-121.8,39.8,-121.3,40.3");
  const [showMap, setShowMap] = useState(false);
  
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [diffImageUrl, setDiffImageUrl] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);
  
  const token = localStorage.getItem("token");

  // Fetch before image
  const fetchBeforeImage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const bboxArray = bbox.split(",").map((val) => parseFloat(val.trim()));
      
      console.log("📥 Fetching BEFORE image...");
      
      const response = await axios.post(
        "http://localhost:5000/api/nasa/image",
        { date: beforeDate, bbox: bboxArray },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("✅ Before image fetched:", response.data);
      
      setBeforeImage({
        fileId: response.data.fileId,
        imageUrl: response.data.imageUrl,
        metadata: response.data.metadata,
      });
    } catch (err) {
      console.error("❌ Error fetching before image:", err);
      setError("Failed to fetch before image: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch after image
  const fetchAfterImage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const bboxArray = bbox.split(",").map((val) => parseFloat(val.trim()));
      
      console.log("📥 Fetching AFTER image...");
      
      const response = await axios.post(
        "http://localhost:5000/api/nasa/image",
        { date: afterDate, bbox: bboxArray },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("✅ After image fetched:", response.data);
      
      setAfterImage({
        fileId: response.data.fileId,
        imageUrl: response.data.imageUrl,
        metadata: response.data.metadata,
      });
    } catch (err) {
      console.error("❌ Error fetching after image:", err);
      setError("Failed to fetch after image: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Compare both images
  const compareImages = async () => {
    if (!beforeImage || !afterImage) {
      alert("Please fetch both images first!");
      return;
    }

    try {
      setComparing(true);
      setError(null);
      
      console.log("🔍 Comparing images...");
      console.log("Before ID:", beforeImage.fileId);
      console.log("After ID:", afterImage.fileId);
      
      const response = await axios.post(
        "http://localhost:5000/api/change-detection",
        {
          beforeImageId: beforeImage.fileId,
          afterImageId: afterImage.fileId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("✅ Comparison complete:", response.data);
      
      setAnalysisResult(response.data.analysis);
      
      if (response.data.analysis.diffImageId) {
        setDiffImageUrl(`/api/change-detection/diff/${response.data.analysis.diffImageId}`);
      }
    } catch (err) {
      console.error("❌ Error comparing images:", err);
      setError("Failed to compare images: " + (err.response?.data?.details || err.message));
    } finally {
      setComparing(false);
    }
  };

  // Save analysis with results
  const saveAnalysis = async () => {
    try {
      console.log("💾 Saving comparison analysis...");
      
      await axios.post(
        "http://localhost:5000/api/analysis",
        {
          title: `Change Detection: ${beforeDate} vs ${afterDate}`,
          description: `Detected ${analysisResult.changePercentage}% change between two dates`,
          location: "Comparison Area",
          bbox: beforeImage.metadata.bbox,
          nasaLayer: "Sentinel-2-L2A",
          date: afterDate,
          imageFileId: afterImage.fileId,
          analysis: {
            changePercentage: analysisResult.changePercentage,
            changeType: analysisResult.changeType,
            severity: analysisResult.severity,
            summary: analysisResult.summary,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("✅ Analysis saved to history!");
    } catch (err) {
      console.error("❌ Error saving analysis:", err);
      alert("Failed to save analysis");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high": return "text-red-600 bg-red-100";
      case "medium": return "text-orange-600 bg-orange-100";
      case "low": return "text-green-600 bg-green-100";
      default: return "text-blue-600 bg-blue-100";
    }
  };

  const handleMapBBoxSelect = (mapBbox) => {
    const bboxString = `${mapBbox.west},${mapBbox.south},${mapBbox.east},${mapBbox.north}`;
    setBbox(bboxString);
    setShowMap(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white py-12 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Search className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Compare Satellite Images</h1>
          </div>
          <p className="text-blue-100 text-lg">Detect environmental changes between two dates using Sentinel-2 (10m resolution)</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Input Form Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Configure Comparison
          </h2>
          
          {/* Date Inputs */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Before Date */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Before Date (YYYY-MM-DD)
              </label>
              <input
                type="text"
                value={beforeDate}
                onChange={(e) => setBeforeDate(e.target.value)}
                placeholder="2024-07-20"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
              <button
                onClick={fetchBeforeImage}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {loading ? "⏳ Fetching..." : "Fetch Before Image"}
              </button>
            </div>

            {/* After Date */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                After Date (YYYY-MM-DD)
              </label>
              <input
                type="text"
                value={afterDate}
                onChange={(e) => setAfterDate(e.target.value)}
                placeholder="2024-07-30"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
              <button
                onClick={fetchAfterImage}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {loading ? "⏳ Fetching..." : "Fetch After Image"}
              </button>
            </div>
          </div>

          {/* Satellite Source */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Satellite className="w-4 h-4 text-blue-600" />
              Satellite Source
            </label>
            <input
              type="text"
              value="Sentinel-2 L2A (10m resolution, cloud-masked)"
              disabled
              className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 cursor-not-allowed"
            />
          </div>

          {/* Bounding Box */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Map className="w-4 h-4 text-blue-600" />
              Bounding Box (Region)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={bbox}
                onChange={(e) => setBbox(e.target.value)}
                placeholder="west,south,east,north"
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
              California wildfire: -121.8,39.8,-121.3,40.3 | Amazon: -54.5,-3.5,-54.0,-3.0
            </p>
          </div>
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

        {/* Before/After Images */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Before Image */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Before ({beforeDate})
            </h3>
            {beforeImage ? (
              <div className="rounded-lg overflow-hidden shadow-md border border-slate-200">
                <img
                  src={`http://localhost:5000${beforeImage.imageUrl}`}
                  alt="Before"
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                <div className="text-center">
                  <Image className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500">Fetch before image</p>
                </div>
              </div>
            )}
          </div>

          {/* After Image */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              After ({afterDate})
            </h3>
            {afterImage ? (
              <div className="rounded-lg overflow-hidden shadow-md border border-slate-200">
                <img
                  src={`http://localhost:5000${afterImage.imageUrl}`}
                  alt="After"
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                <div className="text-center">
                  <Image className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500">Fetch after image</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compare Button */}
        {beforeImage && afterImage && (
          <div className="text-center mb-8">
            <button
              onClick={compareImages}
              disabled={comparing}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 px-12 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto"
            >
              <Search className="w-6 h-6" />
              {comparing ? "⏳ Comparing..." : "Compare & Detect Changes"}
            </button>
          </div>
        )}

        {/* Analysis Results */}
        {analysisResult && (
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-emerald-500">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-emerald-600" />
              Change Detection Results
            </h2>

            <AnalysisCharts analysisResult={analysisResult} />
            
            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200 text-center">
                <p className="text-4xl font-bold text-blue-600 mb-2">{analysisResult.changePercentage}%</p>
                <p className="text-slate-700 font-medium">Change Detected</p>
              </div>
              
              <div className={`p-6 rounded-xl border text-center ${getSeverityColor(analysisResult.severity)}`}>
                <p className="text-4xl font-bold mb-2">{analysisResult.severity?.toUpperCase()}</p>
                <p className="font-medium">Severity Level</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 text-center">
                <p className="text-4xl font-bold text-purple-600 mb-2">
                  {analysisResult.changedPixels?.toLocaleString()}
                </p>
                <p className="text-slate-700 font-medium">Changed Pixels</p>
              </div>
            </div>

            {/* Summary Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Analysis Summary
              </h3>
              <p className="text-slate-700 leading-relaxed">{analysisResult.summary}</p>
            </div>

            {/* Difference Image */}
            {diffImageUrl && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Image className="w-6 h-6 text-emerald-600" />
                  Difference Visualization
                </h3>
                <p className="text-slate-600 mb-4">Red highlights indicate detected changes</p>
                <div className="rounded-lg overflow-hidden shadow-xl border border-slate-200">
                  <img
                    src={`http://localhost:5000${diffImageUrl}`}
                    alt="Difference"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            )}

            {/* Save Button */}
            <button 
              onClick={saveAnalysis}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
            >
              <Save className="w-6 h-6" />
              Save to Analysis History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareImages;