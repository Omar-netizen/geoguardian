import React, { useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [date, setDate] = useState("2025-09-29");
  const [layer, setLayer] = useState("MODIS_Terra_CorrectedReflectance_TrueColor");
  const [bbox, setBbox] = useState("-74.2591,40.4774,-73.7004,40.9176"); // Example: NYC
  const [imageUrl, setImageUrl] = useState(null); // ✅ Changed from image to imageUrl
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  const fetchImage = async () => {
    try {
      setLoading(true);
      setError(null);
      setImageUrl(null);

      // Parse bbox string into array
      const bboxArray = bbox.split(",").map((val) => parseFloat(val.trim()));

      console.log("📤 Sending request to backend:", {
        date,
        layer,
        bbox: bboxArray,
      });

      const response = await axios.post(
        "http://localhost:5000/api/nasa/image",
        {
          date,
          layer,
          bbox: bboxArray, // ✅ Send as array instead of string
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Response from backend:", response.data);

      // ✅ Use imageUrl from response instead of image
      if (response.data.imageUrl) {
        setImageUrl(response.data.imageUrl);
        setMetadata(response.data.metadata);
        console.log("✅ Image URL set to:", response.data.imageUrl);
      } else {
        throw new Error("No imageUrl in response");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to fetch image";
      console.error("❌ Error fetching image:", errorMessage);
      setError(errorMessage);
      alert(`Failed to fetch image: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>🛰️ GeoGuardian Dashboard</h2>
      <p>Fetch satellite imagery from NASA APIs</p>

      <div style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Date (YYYY-MM-DD):</label>
          <input
            type="text"
            placeholder="Date (YYYY-MM-DD)"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Layer:</label>
          <select
            value={layer}
            onChange={(e) => setLayer(e.target.value)}
            style={styles.input}
          >
            <option value="MODIS_Terra_CorrectedReflectance_TrueColor">
              MODIS Terra True Color
            </option>
            <option value="MODIS_Aqua_CorrectedReflectance_TrueColor">
              MODIS Aqua True Color
            </option>
            <option value="VIIRS_CityLights_2012">VIIRS City Lights</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Bounding Box (e.g. -74,40,-73,41):
          </label>
          <input
            type="text"
            placeholder="Bounding Box (west,south,east,north)"
            value={bbox}
            onChange={(e) => setBbox(e.target.value)}
            style={styles.input}
          />
          <small style={{ color: "#666" }}>
            Format: west,south,east,north (e.g., -74.26,40.48,-73.70,40.92 for NYC)
          </small>
        </div>

        <button
          onClick={fetchImage}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          disabled={loading}
        >
          {loading ? "⏳ Fetching..." : "📥 Fetch Image"}
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {metadata && (
        <div style={styles.metadataBox}>
          <h3>📋 Image Information:</h3>
          <p>
            <strong>File ID:</strong> <code>{metadata.fileId}</code>
          </p>
          <p>
            <strong>Date:</strong> {metadata.date}
          </p>
          <p>
            <strong>Layer:</strong> {metadata.layer}
          </p>
          <p>
            <strong>Size:</strong> {metadata.size}
          </p>
          <p>
            <strong>Uploaded:</strong> {metadata.uploadDate}
          </p>
        </div>
      )}

      {imageUrl && (
        <div style={styles.imageBox}>
          <h3>🖼️ Satellite Image Result</h3>
          <img
            src={`http://localhost:5000${imageUrl}`}
            alt="Satellite"
            style={{
              width: "100%",
              maxWidth: "600px",
              borderRadius: "10px",
              border: "2px solid #2563eb",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
            onLoad={() => console.log("✅ Image loaded successfully")}
            onError={(e) => {
              console.error("❌ Image failed to load from:", `http://localhost:5000${imageUrl}`);
              setError("Failed to load image from server. Check browser network tab.");
            }}
          />
          <p style={{ color: "#666", fontSize: "12px", marginTop: "10px" }}>
            Full URL: <code style={{ background: "#f0f0f0", padding: "2px 4px" }}>http://localhost:5000{imageUrl}</code>
          </p>
        </div>
      )}

      {!imageUrl && !loading && !error && (
        <div style={styles.placeholderBox}>
          <p>👆 Enter the details and click "Fetch Image" to get started</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    textAlign: "center",
    maxWidth: "800px",
    margin: "0 auto",
  },
  form: {
    marginTop: "20px",
    background: "#f9f9f9",
    padding: "20px",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
  formGroup: {
    marginBottom: "15px",
    textAlign: "left",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    padding: "10px",
    width: "100%",
    maxWidth: "400px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  button: {
    padding: "12px 24px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    marginTop: "10px",
    transition: "background-color 0.3s",
  },
  imageBox: {
    marginTop: "30px",
    padding: "20px",
    background: "#f9f9f9",
    borderRadius: "8px",
    border: "1px solid #ddd",
  },
  metadataBox: {
    marginTop: "20px",
    padding: "15px",
    background: "#e3f2fd",
    borderRadius: "8px",
    border: "1px solid #2196f3",
    textAlign: "left",
  },
  errorBox: {
    marginTop: "20px",
    padding: "15px",
    background: "#ffebee",
    borderRadius: "8px",
    border: "1px solid #f44336",
    color: "#c62828",
    textAlign: "left",
  },
  placeholderBox: {
    marginTop: "40px",
    padding: "40px",
    background: "#f5f5f5",
    borderRadius: "8px",
    color: "#999",
  },
};

export default Dashboard;