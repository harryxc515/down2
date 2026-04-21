const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/downloader_bot";
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("[db] mongodb connected");
  } catch (err) {
    console.error("[db] connection error:", err.message);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("[db] mongodb disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.info("[db] mongodb reconnected");
});

module.exports = connectDB;
