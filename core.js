/**
 * Core logic of the bot, platform-independent.
 * @module core-bot
 */
require("dotenv").config()
const request = require("request-promise-native")
const admin = require("firebase-admin")
const similarity = require("string-similarity")

const TOKEN = process.env.TOKEN
const GCP_KEY = process.env.GCP_API_KEY
const LANG = process.env.REQUIRED_LANG

/**
 *
 * @param {string} messageText text of the message
 * @param {string} senderUsername username of the person who sent this message
 * @returns {Promise<boolean>} true if the message is in the correct language, false otherwise
 * @alias module:core-bot
 */
async function isCorrectLanguage(messageText, senderUsername) {
  const options = {
    uri: `https://translation.googleapis.com/language/translate/v2/detect?key=${GCP_KEY}`,
    method: "POST",
    json: true,
    body: {
      q: messageText
    }
  }

  let response
  try {
    response = await request(options)
  } catch (err) {
    console.error(err.message)
    console.error("This error is not handled because it should never happen.")
  }

  const detectedLang = response.data.detections[0][0].language
  const confidence = response.data.detections[0][0].confidence
  const isReliable = response.data.detections[0][0].isReliable

  console.log(
    `Lang: ${detectedLang}, isReliable: ${isReliable}, confidence: ${confidence.toPrecision(
      3
    )}, message: ${messageText}`
  )

  // console.log(JSON.stringify(response)) Uncomment to log API whole response

  return detectedLang === LANG
}

/**
 * Adds the specified text to the database.
 * @param {string} messageText message's text
 * @returns {Promise<bool>} true if the operation is successful, false otherwise
 */
async function addException(messageText) {
  // "match" is the result of executing the regexp above on the message's text
  const inputText = messageText.toLowerCase()

  try {
    await admin
      .firestore()
      .collection("exceptions")
      .add({
        text: inputText
      })
  } catch (err) {
    console.error(err)
    return false
  }

  return true
}

/**
 * Removes the specified text to the database.
 * @param {string} messageText message's text
 * @returns {Promise<bool>} true if the operation is successful, false otherwise
 */
async function removeException(messageText) {
  // "match" is the result of executing the regexp above on the message's text
  const inputText = messageText.toLowerCase()

  try {
    const exceptionsSnapshot = await admin
      .firestore()
      .collection("exceptions")
      .where("text", "==", inputText)
      .get()

    for (const doc of exceptionsSnapshot.docs) {
      doc.ref.delete() // bear in mind we are not waiting here for a Promise to be resolved
    }
  } catch (err) {
    console.error(err)
    return false
  }

  return true
}

/**
 * Determines whether the message contains some special variations that should be always allowed.
 * @param {string} messageText message's text
 * @returns {Promise<boolean>} true if user should be punished, false otherwise
 */
async function shouldBePermitted(messageText) {
  const inputText = messageText.text.toLowerCase()

  // Don't punish for short messages
  if (messageText.text.length <= 4) {
    return false
  }

  // Don't punish if user's name occurs in the message
  // if (msg.text.includes(msg.chat.first_name) || msg.text.includes(msg.chat.last_name)) {
  //   return false
  // }

  // Disable for commands and mentions
  if (messageText.startsWith("/") || messageText.startsWith("@")) {
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

exports.isCorrectLanguage = isCorrectLanguage
exports.shouldBePermitted = shouldBePermitted
exports.addException = addException
exports.removeException = removeException
