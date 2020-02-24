/**
 * Core logic of the bot, platform-independent.
 * This file should be considered as a handy toolkit which makes it much easier
 * to write implementations for particular bots.
 */

import * as dotenv from "dotenv"
dotenv.config()

import * as request from "request-promise-native"
import * as admin from "firebase-admin"
import * as similarity from "string-similarity"

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.PROJECT_ID,
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: process.env.PRIVATE_KEY
  })
})

const { GCP_API_KEY } = process.env
const REQUIRED_LANG = process.env.REQUIRED_LANG || "en"

/**
 * @return true if the message is in the correct language, false otherwise
 */
async function isCorrectLanguage(messageText: string): Promise<boolean> {
  const options = {
    uri: `https://translation.googleapis.com/language/translate/v2/detect?key=${GCP_API_KEY}`,
    method: "POST",
    json: true,
    body: {
      q: messageText
    }
  }

  let data
  try {
    const response = await request(options)
    data = response.data
  } catch (err) {
    console.error(err.message)
    console.error("This error is not handled because it should never happen.")
  }

  const detectedLang = data.detections[0][0].language
  const { confidence } = data.detections[0][0]
  const { isReliable } = data.detections[0][0]

  console.log(
    `Lang: ${detectedLang}, isReliable: ${isReliable}, confidence: ${confidence.toPrecision(
      3
    )}, message: ${messageText}`
  )

  // console.log(JSON.stringify(response)) Uncomment to log API whole response

  return detectedLang === REQUIRED_LANG
}

/**
 * Adds the specified text to the database.
 * @returns {Promise<boolean>} true if the operation is successful, false otherwise
 */
async function addException(messageText: string): Promise<boolean> {
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
async function removeException(messageText: string): Promise<boolean> {
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
async function shouldBePermitted(messageText: string): Promise<boolean> {
  const inputText = messageText.toLowerCase()

  // Don't punish for short messages
  if (messageText.length <= 4) {
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

/**
 * It Translates the users message to the required language
 * @param {string} messageText message's text
 * @returns {Promise<string>} the translated messagee
 */
async function translateString(messageText: string): Promise<string>{
  const options = {
    uri: `https://translation.googleapis.com/language/translate/v2?key=${GCP_API_KEY}`,
    method: "POST",
    json: true,
    body: {
      q: messageText,
      target: REQUIRED_LANG

    }
  }

  let data

  try {
    const response = await request(options)
    data = response.data
  } catch (err) {
    console.error(err.message)
    console.error("This error is not handled because it should never happen.")
  }
  
  const translatedMessage = data.translations[0].translatedText
  // console.log(JSON.stringify(response)) Uncomment to log API whole response

  return translatedMessage



}

export { isCorrectLanguage, shouldBePermitted, addException, removeException, translateString }
