require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN);

bot.sendMessage(
  process.env.CHAT_ID,
  "🚀 Test message from CLAT Alert System"
)
.then(() => {
  console.log("Message sent successfully!");
})
.catch((err) => {
  console.error("Telegram Error:", err.response?.body || err);
});