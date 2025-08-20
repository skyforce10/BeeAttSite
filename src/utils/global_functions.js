// global_functions.js

import axios from "axios";
import db from "../db";

/**
 * Syncs transformed attendance data to the remote server.
 * @param {Array} transformed - Array of attendance records already mapped/formatted.
 * @param {string} API_BASE_URL - The base URL of the API.
 * @returns {Object} - { success: boolean, message: string }
 */
export const handleSync = async (transformed, id) => {
  const API_BASE_URL =
    localStorage.getItem("saved_sett_api_url") || "http://localhost:5100";
  if (!transformed || transformed.length === 0) {
    return { success: false, message: "No transformed data to sync." };
  }


  try {
    await axios.post(
      `https://${API_BASE_URL}/api/location/confirm`,
      transformed
    );
    if (id === 0) {
      await db.attendance.where('recordstatusid').equals(1).modify({ recordstatusid: 3 });
    } else {
      await db.attendance.update(id, { recordstatusid: 3 });
    }
    return { success: true, message: "Successfully synced to server!" };
  } catch (err) {
    console.error("Sync error:", err);
    return { success: false, message: "Sync failed. Check server or network." };
  }
};

export const pingServer = async (API_BASE_URL) => {
  const url = `https://${API_BASE_URL}/api/ping`; // ensure HTTPS

  try {

    const response = await axios.get(url, {
      timeout: 3000,
      headers: {
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
    });

    return response.status === 200;
  } catch (error) {
    console.warn("Ping failed:", error.message);
    return false;
  }
};

export const fetchAddressFromCoordinates = async (latitude, longitude) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 2-second timeout

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    const data = await response.json();
    return data.display_name || "Unknown location";
  } catch (error) {
    clearTimeout(timeout);
    throw new Error("Failed to fetch address.");
  }
};

export const getPublicIP = async () => {
  try {
    const response = await fetch("https://api.ipify.org?format=json", { timeout: 2000 });
    const data = await response.json();
    return data.ip || "";
  } catch (error) {
    console.warn("Failed to fetch public IP:", error.message);
    return "";
  }
};

export const getBrowserAndOS = () => {
  const ua = navigator.userAgent;

  // Detect browser
  let browser = "Unknown";
  if (ua.includes("Firefox/")) {
    browser = "Firefox";
  } else if (ua.includes("Edg/")) {
    browser = "Microsoft Edge";
  } else if (ua.includes("Chrome/") && !ua.includes("Edg/")) {
    browser = "Chrome";
  } else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
    browser = "Safari";
  } else if (ua.includes("OPR/") || ua.includes("Opera")) {
    browser = "Opera";
  }

  // Detect OS
  let os = "Unknown";
  if (ua.includes("Windows NT 10.0")) os = "Windows 10";
  else if (ua.includes("Windows NT 6.3")) os = "Windows 8.1";
  else if (ua.includes("Windows NT 6.1")) os = "Windows 7";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  // Return as plain text
  return `Browser: ${browser}, OS: ${os}`;
}
