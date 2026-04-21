const User = require("./userModel");
const Download = require("./downloadModel");
const { detectPlatform, extractUrls, fetchDownload } = require("./downloader");
const {
  mainMenuKeyboard,
  downloadResultKeyboard,
  errorKeyboard,
  backKeyboard,
} = require("./keyboards");
const messages = require("./messages");

const WELCOME_IMAGE_URL = process.env.WELCOME_IMAGE_URL || null;

// upsert user in db
const upsertUser = async (from) => {
  try {
    let user = await User.findOne({ telegramId: from.id });
    if (!user) {
      user = await User.create({
        telegramId: from.id,
        username: from.username || null,
        firstName: from.first_name || null,
        lastName: from.last_name || null,
      });
    } else {
      user.lastActive = new Date();
      user.username = from.username || user.username;
      user.firstName = from.first_name || user.firstName;
      await user.save();
    }
    return user;
  } catch {
    return null;
  }
};

// handle /start command
const handleStart = async (bot, msg) => {
  const chatId = msg.chat.id;
  const from = msg.from;
  await upsertUser(from);

  const text = messages.welcome(from.first_name);

  if (WELCOME_IMAGE_URL) {
    await bot.sendPhoto(chatId, WELCOME_IMAGE_URL, {
      caption: text,
      parse_mode: "HTML",
      has_spoiler: true,
      reply_markup: mainMenuKeyboard,
    });
  } else {
    await bot.sendMessage(chatId, text, {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard,
    });
  }
};

// handle incoming url messages
const handleUrlMessage = async (bot, msg) => {
  const chatId = msg.chat.id;
  const from = msg.from;
  const text = msg.text || "";

  const user = await upsertUser(from);
  const urls = extractUrls(text);

  if (!urls.length) {
    return bot.sendMessage(chatId, messages.noUrl, {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard,
    });
  }

  const url = urls[0];
  const platform = detectPlatform(url);

  if (!platform) {
    return bot.sendMessage(chatId, messages.unsupportedPlatform(url), {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard,
    });
  }

  const processingMsg = await bot.sendMessage(chatId, messages.processing(platform), {
    parse_mode: "HTML",
  });

  const result = await fetchDownload(url);

  await bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});

  if (!result.success) {
    await Download.create({
      telegramId: from.id,
      platform,
      url,
      status: "failed",
    }).catch(() => {});

    return bot.sendMessage(chatId, messages.downloadFailed(result.error), {
      parse_mode: "HTML",
      reply_markup: errorKeyboard,
    });
  }

  // use the pre-extracted mediaUrl from downloader
  const mediaUrl = result.mediaUrl;
  const title = result.title;

  if (!mediaUrl) {
    // log raw response for debugging
    console.error("[download] no media url found in response:", JSON.stringify(result.data).slice(0, 500));

    await Download.create({ telegramId: from.id, platform, url, status: "failed" }).catch(() => {});

    return bot.sendMessage(
      chatId,
      `<blockquote>could not extract media from this link.\n\nplatform: ${platform}\n\ntry opening the mini app for this download.</blockquote>`,
      {
        parse_mode: "HTML",
        reply_markup: errorKeyboard,
      }
    );
  }

  // try sending as video, fallback to direct link message
  try {
    await bot.sendVideo(chatId, mediaUrl, {
      caption: messages.downloadSuccess(platform, title),
      parse_mode: "HTML",
      reply_markup: downloadResultKeyboard(),
      supports_streaming: true,
    });
  } catch {
    // if video send fails, send as document
    try {
      await bot.sendDocument(chatId, mediaUrl, {
        caption: messages.downloadSuccess(platform, title),
        parse_mode: "HTML",
        reply_markup: downloadResultKeyboard(),
      });
    } catch {
      // last fallback: send the direct link
      await bot.sendMessage(
        chatId,
        `<blockquote>media ready\n\nplatform: ${platform}\n${title ? `title: ${title}\n` : ""}tap to open:\n${mediaUrl}</blockquote>`,
        {
          parse_mode: "HTML",
          reply_markup: downloadResultKeyboard(),
        }
      );
    }
  }

  if (user) await user.incrementDownloads();
  await Download.create({ telegramId: from.id, platform, url, status: "success" }).catch(() => {});
};

// handle callback queries
const handleCallback = async (bot, query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const from = query.from;

  await bot.answerCallbackQuery(query.id).catch(() => {});

  if (data === "main_menu") {
    return bot.sendMessage(chatId, messages.welcome(from.first_name), {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard,
    });
  }

  if (data === "help") {
    // help is shown inline in the welcome message - just resend welcome
    return bot.sendMessage(chatId, messages.helpInline, {
      parse_mode: "HTML",
      reply_markup: backKeyboard,
    });
  }

  if (data === "howto") {
    return bot.sendMessage(chatId, messages.howto, {
      parse_mode: "HTML",
      reply_markup: backKeyboard,
    });
  }

  if (data === "try_again" || data === "download_again") {
    return bot.sendMessage(chatId, "<blockquote>send your link to download again.</blockquote>", {
      parse_mode: "HTML",
    });
  }
};

module.exports = { handleStart, handleUrlMessage, handleCallback };

