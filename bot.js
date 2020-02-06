// Load .env file that has TOKEN
require("dotenv").config()

const request = require("request-promise-native")
const TelegramBot = require("node-telegram-bot-api")

const TOKEN = process.env.TOKEN
const GCP_KEY = process.env.GCP_API_KEY
const LANG = process.env.LANGUAGE
const bot = new TelegramBot(TOKEN, { polling: true })

const rebukeMessage = `Incorrect language detected. Please use only: ${LANG}`
const warningMessage = `You've been muted for 45 seconds for using a language other than: ${LANG}`

console.log("Bot is running...")

bot.addListener("group_chat_created", async (msg, meta) => {
  await bot.sendMessage(
    msg.chat.id,
    "Hi all! Let's begin the rule of law and order! \n(triggered by event: group_chat_created)"
  )
})

bot.addListener("new_chat_members", async (msg, meta) => {
  await bot.sendMessage(msg.chat.id, "Hello! \n(triggered by event: new_chat_members)")
})

bot.on("message", async msg => {
  if (msg.text === undefined) {
    console.log("Message doesn't contain text, returned.")
    return
  }

  if (msg.chat.type === "private") {
    console.log("Message was sent in a private chat, returned.")
    await bot.sendMessage(msg.chat.id, "Sorry, I work only in groups.")
    return
  }

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

  const detectedLang = response.data.detections[0][0].language
  const confidence = response.data.detections[0][0].confidence
  const isReliable = response.data.detections[0][0].isReliable
  console.log(
    `Lang: ${detectedLang}, isReliable: ${isReliable}, confidence: ${confidence.toPrecision(
      3
    )}, message: ${msg.text}`
  )

  // console.log(JSON.stringify(response)) Uncomment to log API whole response

  if (detectedLang === LANG) {
    return
  } else {
    if (shouldPunish(msg)) {
      await rebuke(msg)
      // await mute(msg)
    }
  }
})

/**
 * Determines whether the user message doesn't match the specified language.
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

  // Allow uncontrolled laughter
  if (msg.text.startsWith("hah") || msg.text.startsWith("hha")) {
    return false
  }

  return true
}

/**
 * Politely reminds the user to use only the specified language
 * @param {TelegramBot.Message} msg Telegram Message object
 */
async function rebuke(msg) {
  await bot.sendMessage(msg.chat.id, rebukeMessage, {
    reply_to_message_id: msg.message_id
  })
}

/**
 * Temporarily mutes the user for sending the inappropriate messages.
 * TODO: Make the unmute work X D
 * @param {TelegramBot.Message} msg Telegram Message object
 */
async function mute(msg) {
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
