/**
 * Core logic of the bot, platform-independent.
 * This file should be considered as a handy toolkit which makes it much easier
 * to write implementations for particular bots.
 */

import * as dotenv from "dotenv"
dotenv.config()

import * as admin from "firebase-admin"
import * as similarity from "string-similarity"
import * as translate from "translation-google"
import { CoreConfig, TranslationData } from "./types_core"
import * as languagesFile from "./languages.json"

export const config = new CoreConfig()

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: config.PROJECT_ID,
    clientEmail: config.CLIENT_EMAIL,
    privateKey: config.PRIVATE_KEY
  })
})

/**
 * @return Tuple of boolean, string, string and string.
 * boolean – true if the language is the specified language, false otherwise
 * 1st string – full name of the detected language
 * 2nd string – full name of the specified language
 * 3rd string - translated text
 */
async function checkAndTranslate(messageText: string): Promise<TranslationData | null> {
  let detectedLang
  let confidence
  let translatedText
  try {
    const data = await translate(messageText, { raw: true, to: config.REQUIRED_LANG })

    detectedLang = data.from.language.iso
    confidence = JSON.parse(data.raw)[6]
    translatedText = data.text
  } catch (err) {
    console.error(err)
    console.error("An error occurred while translating the message")
    return null
  }

  console.log(
    `Lang: ${detectedLang}, confidence: ${confidence.toPrecision(3)}, message: ${messageText}`
  )

  const detectedLangFullName = languagesFile.data?.languages.find(
    ({ language }) => language === detectedLang
  )?.name

  const requiredLangFullName = languagesFile.data?.languages?.find(
    ({ language }) => language === config.REQUIRED_LANG
  )?.name

  if (!detectedLangFullName) {
    console.log("detectedLanfFullName is undefined.")
    return null
  }

  if (!requiredLangFullName) {
    console.log("requiredLangFullName is undefined.")
    return null
  }

  let isCorrectLang = detectedLang === config.REQUIRED_LANG

  if (detectedLang === "und") {
    console.log(
      `Couldn't detect language (detectedLang === "und"). Assuming that isCorrectLang = true.`
    )
    isCorrectLang = true
  }

  if (confidence < 0.7) {
    console.log(`Confidence is too small (${confidence}). Assuming that isCorrectLang = true.`)
    isCorrectLang = true
  }

  return new TranslationData(
    isCorrectLang,
    detectedLangFullName,
    requiredLangFullName,
    translatedText
  )
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
 * @returns {Promise<boolean>} true if the message should be permitted, false otherwise
 */
async function shouldBePermitted(messageText: string): Promise<boolean> {
  const inputText = messageText.toLowerCase()

  // Don't punish for short messages
  if (messageText.length <= 4) {
    return true
  }

  // Don't punish if user's name occurs in the message
  // if (msg.text.includes(msg.chat.first_name) || msg.text.includes(msg.chat.last_name)) {
  //   return false
  // }

  // Disable for commands and mentions
  if (messageText.startsWith("/") || messageText.startsWith("@")) {
    return true
  }

  // Add an exception for messages that contain XD letters only
  let xdTest = inputText
  xdTest = xdTest.replace(/x/g, "")
  xdTest = xdTest.replace(/d/g, "")
  if (xdTest === "") {
    return true
  }

  // Allow uncontrolled laughter
  let hahaTest = inputText
  hahaTest = hahaTest.replace(/h/g, "")
  hahaTest = hahaTest.replace(/a/g, "")
  if (hahaTest === "") {
    return true
  }

  // Allow messages with links
  if (inputText.includes("https://")) {
    return true
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
      return true
    }
  }

  return false
}

export { checkAndTranslate, shouldBePermitted, addException, removeException }
