const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    telegramId: { type: Number, required: true, unique: true },
    username: { type: String, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    downloads: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.methods.incrementDownloads = async function () {
  this.downloads += 1;
  this.lastActive = new Date();
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
