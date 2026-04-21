require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const connectDB = require("./db");
const { startServer } = require("./render");
const { handleStart, handleUrlMessage, handleCallback } = require("./modules/handlers");

const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN) {
  console.error("[bot] BOT_TOKEN is not set in .env");
  process.exit(1);
}

// connect to mongodb
connectDB();

// start render/express server
startServer();

// init bot with polling
const bot = new TelegramBot(TOKEN, { polling: true });

console.log("[bot] telegram bot started");

// /start command
bot.onText(/\/start/, async (msg) => {
  try {
    await handleStart(bot, msg);
  } catch (err) {
    console.error("[bot] /start error:", err.message);
  }
});

// /help command - show help inline
bot.onText(/\/help/, async (msg) => {
  const messages = require("./modules/messages");
  const { backKeyboard } = require("./modules/keyboards");
  try {
    await bot.sendMessage(msg.chat.id, messages.helpInline, {
      parse_mode: "HTML",
      reply_markup: backKeyboard,
    });
  } catch (err) {
    console.error("[bot] /help error:", err.message);
  }
});

// handle all text messages (urls)
bot.on("message", async (msg) => {
  if (!msg.text) return;
  if (msg.text.startsWith("/")) return;

  try {
    await handleUrlMessage(bot, msg);
  } catch (err) {
    console.error("[bot] message error:", err.message);
    await bot.sendMessage(
      msg.chat.id,
      "<blockquote>an error occurred. please try again.</blockquote>",
      { parse_mode: "HTML" }
    );
  }
});

// handle inline keyboard callbacks
bot.on("callback_query", async (query) => {
  try {
    await handleCallback(bot, query);
  } catch (err) {
    console.error("[bot] callback error:", err.message);
  }
});

// polling error handler
bot.on("polling_error", (err) => {
  console.error("[bot] polling error:", err.message);
});

// graceful shutdown
process.on("SIGINT", () => {
  console.log("[bot] shutting down...");
  bot.stopPolling();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("[bot] sigterm received, shutting down...");
  bot.stopPolling();
  process.exit(0);
});
