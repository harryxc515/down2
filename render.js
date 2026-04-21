const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "running",
    service: "telegram-downloader-bot",
    version: "1.0.0",
    platforms: ["youtube", "instagram", "terabox", "pinterest", "telegram"],
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`[server] render server running on port ${PORT}`);
  });
};

module.exports = { app, startServer };
