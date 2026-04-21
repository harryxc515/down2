const axios = require("axios");

const API_BASE = process.env.API_BASE || "https://rootx-downloader-api.awsvps844.workers.dev";

const SUPPORTED_PLATFORMS = {
  youtube: [
    /youtube\.com\/watch/,
    /youtu\.be\//,
    /youtube\.com\/shorts/,
    /youtube\.com\/live/,
    /youtube\.com\/embed/,
  ],
  instagram: [
    /instagram\.com\/p\//,
    /instagram\.com\/reel\//,
    /instagram\.com\/reels\//,
    /instagram\.com\/tv\//,
    /instagram\.com\/stories\//,
    /instagram\.com\/s\//,
  ],
  pinterest: [
    /pinterest\.com\/pin\//,
    /pin\.it\//,
    /pinterest\.[a-z]{2,}\/pin\//,
    /pinterest\.com\/[^/]+\/[^/]+/,
  ],
};

const detectPlatform = (url) => {
  for (const [platform, patterns] of Object.entries(SUPPORTED_PLATFORMS)) {
    for (const pattern of patterns) {
      if (pattern.test(url)) return platform;
    }
  }
  return null;
};

const extractUrls = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

// deeply search object for any url-like string that looks like a media file
const deepFindMediaUrl = (obj, depth = 0) => {
  if (depth > 6 || !obj) return null;

  if (typeof obj === "string") {
    if (/^https?:\/\/.+\.(mp4|webm|mov|m4v|avi|mkv|jpg|jpeg|png|gif|webp)/i.test(obj)) return obj;
    if (/^https?:\/\/.+\?/.test(obj) && obj.includes("video")) return obj;
    return null;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = deepFindMediaUrl(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof obj === "object") {
    // check common key names first in priority order
    const priorityKeys = [
      "url", "download_url", "downloadUrl", "videoUrl", "video_url",
      "media_url", "mediaUrl", "src", "source", "link", "href",
      "high", "hd", "sd", "low", "play_url", "stream_url",
    ];
    for (const key of priorityKeys) {
      if (obj[key]) {
        const found = deepFindMediaUrl(obj[key], depth + 1);
        if (found) return found;
      }
    }
    // fallback: scan all keys
    for (const val of Object.values(obj)) {
      const found = deepFindMediaUrl(val, depth + 1);
      if (found) return found;
    }
  }

  return null;
};

const deepFindTitle = (obj, depth = 0) => {
  if (depth > 4 || !obj || typeof obj !== "object") return null;
  if (obj.title && typeof obj.title === "string") return obj.title;
  if (obj.caption && typeof obj.caption === "string") return obj.caption;
  for (const val of Object.values(obj)) {
    const found = deepFindTitle(val, depth + 1);
    if (found) return found;
  }
  return null;
};

const fetchDownload = async (url) => {
  try {
    const apiUrl = `${API_BASE}/?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, {
      timeout: 45000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TelegramBot/1.0)",
        "Accept": "application/json",
      },
    });

    const raw = response.data;

    // try to extract media url from any structure the api returns
    const mediaUrl = deepFindMediaUrl(raw);
    const title = deepFindTitle(raw);

    return {
      success: true,
      data: raw,
      mediaUrl: mediaUrl || null,
      title: title || null,
    };
  } catch (err) {
    const errMsg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      "failed to fetch";
    return { success: false, error: errMsg };
  }
};

module.exports = { detectPlatform, extractUrls, fetchDownload, SUPPORTED_PLATFORMS };
