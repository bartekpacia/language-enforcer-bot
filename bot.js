// Load .env file that has TOKEN
require("dotenv").config()

const request = require("request-promise-native")
const TelegramBot = require("node-telegram-bot-api")

const TOKEN = process.env.TOKEN
const GCP_KEY = process.env.GCP_API_KEY
const bot = new TelegramBot(TOKEN, { polling: true })

const warningMessage = "You've been muted for 45 seconds for using a language other than English."

console.log("Bot is running...")

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

  const lang = response.data.detections[0][0].language
  console.log(lang)

  // console.log(JSON.stringify(response)) Uncomment to log API whole response

  if (msg.chat.type === "private") {
    await bot.sendMessage(msg.chat.id, "Sorry, I work only in groups.")
    return
  }

  if (lang === "en") {
    return
  } else {
    if (shouldPunish(msg)) {
      await punish(msg)
    }
  }
})

/**
 * Determines whether the user should be punished for the message.
 * @param {TelegramBot.Message} msg Telegram Message object
 * @returns {boolean} true if user should be punished, false otherwise
 */
function shouldPunish(msg) {
  // Don't punish for short messages
  if (msg.text.length <= 4) {
    return false
  }

  // Don't punish if user's name occurs in the message
  if (msg.text.includes(msg.chat.first_name) || msg.text.includes(msg.chat.last_name)) {
    return false
  }

  if (msg.text.includes("XD")) {
    return false
  }

  // Disable for commands
  if (msg.text.startsWith("/")) {
    return false
  }
  return true
}

/**
 * Punishes the user for sending the inappropriate messages.
 * @param {TelegramBot.Message} msg Telegram Message object
 */
async function punish(msg) {
  await bot.sendMessage(msg.chat.id, warningMessage, {
    reply_to_message_id: msg.message_id
  })

  await bot.restrictChatMember(msg.chat.id, msg.from.id, {
    can_send_messages: false
  })

  setTimeout(async () => {
    await bot.restrictChatMember(msg.chat.id, msg.from.id, true)
  }, 45000)
}
