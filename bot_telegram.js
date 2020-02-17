// Load .env file that has TOKEN
require("dotenv").config()
const admin = require("firebase-admin")
const request = require("request-promise-native")
const similarity = require("string-similarity")
const TelegramBot = require("node-telegram-bot-api")
const core = require("./core")

const serviceAccount = require("./serviceAccountKey.json")

const TOKEN = process.env.TOKEN
const GCP_KEY = process.env.GCP_API_KEY
const LANG = process.env.REQUIRED_LANG

const bot = new TelegramBot(TOKEN, { polling: true })

const rebukeMessage = `Incorrect language detected. Please use only: ${LANG}`
const warningMessage = `You've been muted for 45 seconds for using a language other than: ${LANG}`

console.log("Bot is running...")

/**
 * Returns true if the user is an admin or a creator, false otherwise.
 */
function isAdmin(chatMember) {
  return chatMember.status === "administrator" || chatMember.status === "creator"
}

bot.onText(/\/except (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const userId = msg.from.id

  const chatMember = await bot.getChatMember(chatId, userId)

  if (isAdmin(chatMember)) {
    // okay
  } else {
    console.log("User is not an admin. Returned.")
    await bot.sendMessage(chatId, `Sorry, this is a admin-only feature.`)
    return
  }

  // "match" is the result of executing the regexp above on the message's text
  const inputText = match[1].toLowerCase()

  const successful = await core.addException(inputText)

  if (successful) {
    await bot.sendMessage(chatId, `Okay, "${inputText}" has been added to the exception list. `)
  } else {
    await bot.sendMessage(chatId, `An error occurred while adding the word ${successful}`)
  }
})

// Handles removing messages from the database
bot.onText(/\/remove (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const userId = msg.from.id

  const chatMember = await bot.getChatMember(chatId, userId)

  if (isAdmin(chatMember)) {
    // okay
  } else {
    console.log("User is not an admin. Returned.")
    await bot.sendMessage(chatId, `Sorry, this is a admin-only feature.`)
    return
  }

  // "match" is the result of executing the regexp above on the message's text
  const inputText = match[1].toLowerCase()

  const successful = await core.removeException(inputText)

  // send back the matched "whatever" to the chat
  if (successful) {
    await bot.sendMessage(chatId, `Okay, "${inputText}" has been removed from the exception list.`)
  } else {
    await bot.sendMessage(chatId, `An error occurred while removing the word ${successful}`)
  }
})

// Handles all messages and checks whether they're in the specified language
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

  const isCorrectLanguage = await core.isCorrectLanguage(msg.text, msg.from.username)

  if (isCorrectLanguage) {
    return
  } else {
    const isException = await core.shouldBePermitted(msg.text)

    if (isException) {
      console.log(`Punishing user ${msg.from.username}. Required lang: "${LANG}"`)
      await rebuke(msg)
      // await mute(msg)
    }
  }
})

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
