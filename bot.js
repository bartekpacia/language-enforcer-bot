// Load .env file that has TOKEN
require("dotenv").config()

const request = require("request-promise-native")
const TelegramBot = require("node-telegram-bot-api")

const TOKEN = process.env.TOKEN
const GCP_KEY = process.env.GCP_API_KEY
const bot = new TelegramBot(TOKEN, { polling: true })

console.log(`GCP_KEY: ${GCP_KEY}`)

const warningMessage = "You've been muted for 45 seconds for using a language other than English."

console.log("Bot is running...")

bot.once()

bot.on("message", async msg => {
  let options = {
    uri: `https://translation.googleapis.com/language/translate/v2/detect?key=${GCP_KEY}`,
    method: "POST",
    json: true,
    body: {
      q: msg.text
    }
  }

  let response
  try {
    response = await request(options)
  } catch (err) {
    console.log(err.message)
    await bot.sendMessage(msg.chat.id, "Ouch, I just crashed! Sb please fix me :/")
    return
  }

  if (msg.chat.type === "private") {
    await bot.sendMessage(msg.chat.id, "Sorry, I work only in groups.")
    return
  }

  const lang = response.data.detections[0][0].language
  console.log(lang)

  if (lang === "en") {
    return
  } else {
      options.uri = `https://translation.googleapis.com/language/translate/v2/translate?key=${GCP_KEY}`
      options.body.target = 'en'
      try {
        response = await request(options)
      } catch (err) {
          console.log(err.message)
          await bot.sendMessage(msg.chat.id, "Ouch, I just crashed! Sb please fix me :/")
          return
        }

      const translated = response.data.translations[0].translatedText
      await helpTheCommunity()

    } 
})

/**
 * Translates the Messages for those who don't know English.
 * @param {TelegramBot.Message} msg Telegram Message object
 * @param {String} resp Response from Google Translate API
 */
async function helpTheCommunity(msg, resp) {
  await bot.sendMessage(msg.chat.id, `I translated the message from ${msg.from.username}! It says: ${resp}`, {
    reply_to_message_id: msg.message_id
  })

}

