// backend/services/sentinelService.js
import axios from "axios";
import https from "https";

const SENTINEL_CLIENT_ID = process.env.SENTINEL_CLIENT_ID;
const SENTINEL_CLIENT_SECRET = process.env.SENTINEL_CLIENT_SECRET;
const SENTINEL_TOKEN_URL = "https://services.sentinel-hub.com/oauth/token";
const SENTINEL_PROCESS_URL = "https://services.sentinel-hub.com/api/v1/process";

let accessToken = null;
let tokenExpiry = null;

// Create HTTPS agent that ignores certificate errors (for development only)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

/**
 * Get OAuth access token from Sentinel Hub
 */
const getAccessToken = async () => {
  try {
    // Check if token is still valid
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return accessToken;
    }

    console.log("🔑 Getting Sentinel Hub access token...");

    const response = await axios.post(
      SENTINEL_TOKEN_URL,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: SENTINEL_CLIENT_ID,
        client_secret: SENTINEL_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken = response.data.access_token;
    // Set expiry 5 minutes before actual expiry
    tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

    console.log("✅ Access token obtained");
    return accessToken;
  } catch (error) {
    console.error("❌ Error getting access token:", error.response?.data || error.message);
    throw new Error("Failed to authenticate with Sentinel Hub");
  }
};

/**
 * Fetch satellite image from Sentinel Hub
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {array} bbox - Bounding box [minLon, minLat, maxLon, maxLat]
 * @param {number} width - Image width (default: 512)
 * @param {number} height - Image height (default: 512)
 * @returns {Buffer} Image buffer
 */
export const fetchSatelliteImage = async (date, bbox, width = 512, height = 512) => {
  try {
    console.log(`🛰️ Fetching Sentinel-2 image for date: ${date}`);
    console.log(`📍 BBox: ${JSON.stringify(bbox)}`);

    // Validate bbox
    if (!Array.isArray(bbox) || bbox.length !== 4) {
      throw new Error("BBox must be an array of 4 numbers: [minLon, minLat, maxLon, maxLat]");
    }

    const [minLon, minLat, maxLon, maxLat] = bbox;

    // Get access token
    const token = await getAccessToken();

    // Create date range (Sentinel-2 has 5-day revisit, so we search ±3 days)
    const dateObj = new Date(date);
    const fromDate = new Date(dateObj.getTime() - 3 * 24 * 60 * 60 * 1000);
    const toDate = new Date(dateObj.getTime() + 3 * 24 * 60 * 60 * 1000);

    const fromDateStr = fromDate.toISOString().split("T")[0];
    const toDateStr = toDate.toISOString().split("T")[0];

    console.log(`📅 Searching images from ${fromDateStr} to ${toDateStr}`);

    // Sentinel Hub Process API request
    const requestBody = {
      input: {
        bounds: {
          bbox: [minLon, minLat, maxLon, maxLat],
          properties: {
            crs: "http://www.opengis.net/def/crs/EPSG/0/4326",
          },
        },
        data: [
          {
            type: "sentinel-2-l2a", // Level 2A (atmospherically corrected)
            dataFilter: {
              timeRange: {
                from: `${fromDateStr}T00:00:00Z`,
                to: `${toDateStr}T23:59:59Z`,
              },
              maxCloudCoverage: 30, // Max 30% cloud coverage
            },
          },
        ],
      },
      output: {
        width: width,
        height: height,
        responses: [
          {
            identifier: "default",
            format: {
              type: "image/jpeg",
            },
          },
        ],
      },
      evalscript: `
        //VERSION=3
        function setup() {
          return {
            input: ["B04", "B03", "B02", "dataMask"],
            output: { bands: 3 }
          };
        }
        
        function evaluatePixel(sample) {
          // True color RGB
          return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02];
        }
      `,
    };

    console.log("🌐 Requesting image from Sentinel Hub...");

    const response = await axios.post(SENTINEL_PROCESS_URL, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "image/jpeg",
      },
      responseType: "arraybuffer",
      timeout: 30000,
    });

    console.log(`✅ Sentinel Hub response received`);
    console.log(`📊 Image size: ${response.data.length} bytes`);

    if (!response.data || response.data.length === 0) {
      throw new Error("Empty response from Sentinel Hub");
    }

    // Check if response is too small (likely no data)
    if (response.data.length < 1000) {
      throw new Error("No satellite data available for this date/location. Try a different date.");
    }

    return Buffer.from(response.data, "binary");
  } catch (error) {
    console.error("❌ Sentinel Hub fetch error:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data?.toString());
    }
    
    if (error.message.includes("No satellite data")) {
      throw error;
    }
    
    throw new Error(`Failed to fetch satellite image: ${error.message}`);
  }
};