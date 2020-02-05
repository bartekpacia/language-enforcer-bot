// Load .env file that has TOKEN
require("dotenv").config()

const request = require("request-promise-native")
const TelegramBot = require("node-telegram-bot-api")

const TOKEN = process.env.TELEGRAM_TOKEN
const bot = new TelegramBot(TOKEN, { polling: true })

console.log("Bot is running...")

bot.onText(/[\s\S]*/, (msg) => {
  let options = {
    uri: 'https://translation.googleapis.com/language/translate/v2/detect',
    method: 'POST',
    json: true,
    body: {
      q: msg.text
    },
    headers: {
      'Authorization': `Bearer ${process.env.GCLOUD_API_TOKEN}`
    }
  };
  request(options, (err, res, body) => {
    if (!error && response.statusCode === 200) {
      if(!JSON.parse(body).data.detections[0][0].language === process.env.LANGUAGE) {
        bot.restrictChatMember(msg.chat.id, msg.from.id, {
          can_send_messages: false
        })
        bot.sendMessage(msg.chat.id, 'Incorrect language detected. You have been muted for 15 seconds.', {
          reply_to_message_id: msg.message_id
        })
        setTimeout(() => {
          bot.restrictChatMember(msg.chat.id, msg.from.id, true)
        }, 15000)
      }
    }
  })
})
