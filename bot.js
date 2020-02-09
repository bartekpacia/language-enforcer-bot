// Load .env file that has TOKEN
require("dotenv").config()
const admin = require("firebase-admin")
const request = require("request-promise-native")
const similarity = require("string-similarity")
const TelegramBot = require("node-telegram-bot-api")

const serviceAccount = require("./serviceAccountKey.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const TOKEN = process.env.TOKEN
const GCP_KEY = process.env.GCP_API_KEY
const LANG = process.env.REQUIRED_LANG

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
  await bot.sendMessage(msg.chat.id, "Hello! \n(triggered by event: new_chat_members).")
})

// Handles adding messages to the
bot.onText(/\/except (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const userId = msg.from.id

  const chatMember = await bot.getChatMember(chatId, userId)

  if (chatMember.status === "administrator" || chatMember.status === "creator") {
    // okay
  } else {
    console.log("User is not an admin. Returned.")
    await bot.sendMessage(chatId, `Sorry, this is a admin-only feature.`)
    return
  }

  // "match" is the result of executing the regexp above on the message's text
  const inputText = match[1].toLowerCase()

  await admin
    .firestore()
    .collection("exceptions")
    .add({
      text: inputText
    })

  // send back the matched "whatever" to the chat
  await bot.sendMessage(chatId, `Okay, "${inputText}" has been added to the exception list. `)
})

// Handles removing messages from the database
bot.onText(/\/remove (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const userId = msg.from.id

  const chatMember = await bot.getChatMember(chatId, userId)

  if (chatMember.status === "administrator" || chatMember.status === "creator") {
    // okay
  } else {
    console.log("User is not an admin. Returned.")
    await bot.sendMessage(chatId, `Sorry, this is a admin-only feature.`)
    return
  }

  // "match" is the result of executing the regexp above on the message's text
  const inputText = match[1].toLowerCase()

  const exceptionsSnapshot = await admin
    .firestore()
    .collection("exceptions")
    .where("text", "==", inputText)
    .get()

  for (const doc of exceptionsSnapshot.docs) {
    doc.ref.delete() // bear in mind we are not waiting here for a Promise to be resolved
  }

  // send back the matched "whatever" to the chat
  await bot.sendMessage(chatId, `Okay, "${inputText}" has been removed from the exception list.`)
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

  const options = {
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
    await bot.sendMessage(msg.chat.id, "Ouch, I just crashed! Somebody please fix me :/")
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
    const punish = await shouldPunish(msg)

    if (punish) {
      console.log(
        `Punishing user ${msg.from.username}. Required lang: "${LANG}", detected lang: "${detectedLang}"`
      )

      await rebuke(msg)
      // await mute(msg)
    }
  }
})

/**
 * Determines whether the user should be punished for his message.
 * @param {TelegramBot.Message} msg Telegram Message object
 * @returns {Promise<boolean>} true if user should be punished, false otherwise
 */
async function shouldPunish(msg) {
  const inputText = msg.text.toLowerCase()
  // Don't punish for short messages
  if (msg.text.length <= 4) {
    return false
  }

  // Don't punish if user's name occurs in the message
  if (msg.text.includes(msg.chat.first_name) || msg.text.includes(msg.chat.last_name)) {
    return false
  }

  // Disable for commands and mentions
  if (msg.text.startsWith("/") || msg.text.startsWith("@")) {
    return false
  }

  // Add an exception for messages that contain XD letters only
  let xdTest = inputText
  xdTest = xdTest.replace(/x/g, "")
  xdTest = xdTest.replace(/d/g, "")
  if (xdTest === "") {
    return false
  }

  // Allow uncontrolled laughter
  let hahaTest = inputText
  hahaTest = hahaTest.replace(/h/g, "")
  hahaTest = hahaTest.replace(/a/g, "")
  if (hahaTest === "") {
    return false
  }

  // Allow messages with links
  if (inputText.includes("https://")) {
    return false
  }

  const exceptionsSnapshot = await admin
    .firestore()
    .collection("exceptions")
    .get()

  for (const doc of exceptionsSnapshot.docs) {
    const text = doc.get("text")
    const similarityLevel = similarity.compareTwoStrings(text, inputText)
    if (similarityLevel >= 0.8) {
      console.log(
        `Similarity ${similarityLevel} between strings: "${text}" and "${inputText}". Returned false.`
      )
      return false
    }
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
