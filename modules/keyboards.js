const MINI_APP_URL = process.env.MINI_APP_URL || "https://social-media-saver-mini.vercel.app/";

// main menu - 3 buttons only: mini app, help, how to use
const mainMenuKeyboard = {
  inline_keyboard: [
    [
      {
        text: "open mini app",
        web_app: { url: MINI_APP_URL },
      },
    ],
    [
      { text: "help", callback_data: "help" },
      { text: "how to use", callback_data: "howto" },
    ],
  ],
};

// after download success
const downloadResultKeyboard = () => ({
  inline_keyboard: [
    [
      {
        text: "open mini app",
        web_app: { url: MINI_APP_URL },
      },
    ],
    [
      { text: "download another", callback_data: "download_again" },
    ],
  ],
});

// error keyboard
const errorKeyboard = {
  inline_keyboard: [
    [
      { text: "try again", callback_data: "try_again" },
    ],
    [
      {
        text: "open mini app",
        web_app: { url: MINI_APP_URL },
      },
    ],
  ],
};

// back keyboard used after help/howto
const backKeyboard = {
  inline_keyboard: [
    [
      { text: "back", callback_data: "main_menu" },
      {
        text: "open mini app",
        web_app: { url: MINI_APP_URL },
      },
    ],
  ],
};

module.exports = {
  mainMenuKeyboard,
  downloadResultKeyboard,
  errorKeyboard,
  backKeyboard,
};
