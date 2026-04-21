# telegram downloader bot

supports: youtube, instagram, terabox, pinterest, telegram

## setup

1. copy `.env.example` to `.env` and fill values
2. `npm install`
3. `npm start`

## env variables

| key | description |
|---|---|
| BOT_TOKEN | telegram bot token from @botfather |
| MONGO_URI | mongodb connection string |
| PORT | express server port (default 3000) |
| API_BASE | downloader api base url |
| MINI_APP_URL | telegram mini app url |
| WELCOME_IMAGE_URL | welcome image url (optional, shown as spoiler) |

## deploy on render

- set `npm start` as start command
- add all env variables in render dashboard
- the express server keeps the service alive on render free tier

## file structure

```
bot.js           main entry
db.js            mongodb connection
render.js        express server for render.com
modules/
  handlers.js    message + callback handlers
  keyboards.js   inline keyboard definitions
  messages.js    all bot message strings
  downloader.js  api fetcher + url detector
  userModel.js   user mongoose schema
  downloadModel.js download log schema
```

## commands

- `/start` - welcome message + main menu
- `/help`  - usage guide
- `/stats` - your download stats
