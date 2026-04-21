const mongoose = require("mongoose");

const downloadSchema = new mongoose.Schema(
  {
    telegramId: { type: Number, required: true },
    platform: { type: String, required: true },
    url: { type: String, required: true },
    status: { type: String, enum: ["success", "failed"], default: "success" },
    downloadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Download", downloadSchema);
