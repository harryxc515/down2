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

// check if a string looks like a downloadable media url
// covers: direct file extensions, CDN urls (instagram, pinterest, youtube), signed urls
const isMediaUrl = (str) => {
  if (typeof str !== "string" || !str.startsWith("http")) return false;
  // direct file extension match
  if (/\.(mp4|webm|mov|m4v|avi|mkv|flv|3gp|jpg|jpeg|png|gif|webp)(\?|$)/i.test(str)) return true;
  // instagram CDN (cdninstagram.com, fbcdn.net)
  if (/cdninstagram\.com|fbcdn\.net/i.test(str)) return true;
  // pinterest CDN
  if (/pinimg\.com|pinterest\.com.*\/videos?\//i.test(str)) return true;
  // youtube direct / googlevideo CDN
  if (/googlevideo\.com|youtube\.com\/videoplayback/i.test(str)) return true;
  // generic: long signed url with common video params
  if (/bytestart|videoplayback|mime=video|content-type=video|\.mp4/i.test(str)) return true;
  return false;
};

// collect ALL media urls from the response, return the longest/best one
const collectMediaUrls = (obj, found = [], depth = 0) => {
  if (depth > 8 || !obj) return found;

  if (typeof obj === "string") {
    if (isMediaUrl(obj)) found.push(obj);
    return found;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) collectMediaUrls(item, found, depth + 1);
    return found;
  }

  if (typeof obj === "object") {
    // priority keys scanned first
    const priorityKeys = [
      "url", "download_url", "downloadUrl", "videoUrl", "video_url",
      "media_url", "mediaUrl", "src", "source", "link", "href",
      "high", "hd", "sd", "low", "play_url", "stream_url",
      "video", "image", "thumbnail", "cover", "poster",
    ];
    for (const key of priorityKeys) {
      if (obj[key] != null) collectMediaUrls(obj[key], found, depth + 1);
    }
    // then scan remaining keys not already covered
    for (const [key, val] of Object.entries(obj)) {
      if (!priorityKeys.includes(key)) collectMediaUrls(val, found, depth + 1);
    }
  }

  return found;
};

const deepFindMediaUrl = (obj) => {
  const all = collectMediaUrls(obj);
  if (!all.length) return null;
  // prefer mp4/video urls over images, prefer longer urls (more specific)
  const videos = all.filter(u => /mp4|webm|mov|video|cdninstagram|fbcdn|googlevideo/i.test(u));
  const pool = videos.length ? videos : all;
  // return longest url (usually highest quality / most specific)
  return pool.reduce((a, b) => (a.length >= b.length ? a : b));
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

    // always log raw for debugging - helps identify new response shapes
    console.log("[downloader] raw api response:", JSON.stringify(raw).slice(0, 800));

    const mediaUrl = deepFindMediaUrl(raw);
    const title = deepFindTitle(raw);

    if (!mediaUrl) {
      console.warn("[downloader] no media url found in response. full raw:", JSON.stringify(raw));
    }

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
    console.error("[downloader] fetch error:", errMsg);
    return { success: false, error: errMsg };
  }
};

module.exports = { detectPlatform, extractUrls, fetchDownload, SUPPORTED_PLATFORMS };
