/**
 * Telegram Bot. It takes advantage of the functions defined in core.ts.
 */

import * as dotenv from "dotenv"
dotenv.config()

import * as TelegramBot from "node-telegram-bot-api"
import * as core from "./core"

if (!process.env.TOKEN) throw new Error("TOKEN is missing!")

const { TOKEN } = process.env
const REQUIRED_LANG = process.env.REQUIRED_LANG || "en"
const BE_HELPFUL = process.env.BE_HELPFUL === "true"
const MUTE_PEOPLE = process.env.MUTE_PEOPLE === "true"
const BAN_TIMEOUT = Number(process.env.BAN_TIMEOUT) || 30000

console.log()
console.log(
  `Bot is running. Some settings are:\nREQUIRED_LANG: ${REQUIRED_LANG}, BE_HEPLFUL: ${BE_HELPFUL}, MUTE_PEOPLE: ${MUTE_PEOPLE}, BAN_TIMEOUT: ${BAN_TIMEOUT}`
)

const bot = new TelegramBot(TOKEN, { polling: true })

/**
 * Returns true if the user is an admin or a creator, false otherwise.
 */
function isAdmin(chatMember: TelegramBot.ChatMember): boolean {
  return chatMember.status === "administrator" || chatMember.status === "creator"
}

// Handles adding messages from the database
bot.onText(/\/except (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const userId = msg.from?.id.toString()

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

  const chatMember = await bot.getChatMember(chatId, userId.toString())

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
    console.log("Message doesn't contain text, returned. (msg.text === undefined)")
    return
  }

  if (msg.chat.type === "private") {
    console.log("Message was sent in a private chat, returned. (msg.chat.type === private)")
    await bot.sendMessage(msg.chat.id, "Sorry, I work only in groups.")
    return
  }

  const isCorrectLanguage = await core.isCorrectLanguage(msg.text)

  if (!isCorrectLanguage) {
    const permitted = await core.shouldBePermitted(msg.text)

    if (!permitted) {
      await performAction(msg)
    }
  }
})

/**
 * Performs an action on the user (whether to just remind him to use the
 * specified language, or ban him).
 */
async function performAction(msg: TelegramBot.Message): Promise<void> {
  console.log(`Perfoming action on user ${msg.from.first_name}...`)
  let message = `Incorrect language detected. Please use only: ${REQUIRED_LANG}.\n`

  if (MUTE_PEOPLE) {
    await mute(msg)
    message += `You've been muted for ${BAN_TIMEOUT / 1000} seconds.\n`
  }

  if (BE_HELPFUL) {
    const translatedText = await core.translateString(msg.text)
    message += `He tried to say: "${translatedText}"`
  }

  await bot.sendMessage(msg.chat.id, message, {
    reply_to_message_id: msg.message_id
  })
}

/**
 * Temporarily mutes the user for sending the inappropriate messages.
 * Mutes only if the user is not an admin.
 * @param {TelegramBot.Message} msg Telegram Message object
 */
async function mute(msg: TelegramBot.Message): Promise<void> {
  const chatMember = await bot.getChatMember(msg.chat.id, msg.from.id.toString())
  const admin = isAdmin(chatMember)

  console.log(`mute() function invoked for user ${chatMember.user.first_name}, admin: ${admin}`)

  if (!admin) {
    await bot.restrictChatMember(msg.chat.id, msg.from.id.toString(), {
      can_send_messages: false,
      can_send_media_messages: false,
      can_send_other_messages: false,
      can_add_web_page_previews: false
    })

    setTimeout(async () => {
      await bot.restrictChatMember(msg.chat.id, msg.from.id.toString(), {
        can_send_messages: true,
        can_send_media_messages: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true
      })
    }, BAN_TIMEOUT)
  }
}
