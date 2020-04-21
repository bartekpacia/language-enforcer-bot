/**
 * Core logic of the bot, platform-independent.
 * This file should be considered as a handy toolkit which makes it much easier
 * to write implementations for particular bots.
 */

import * as admin from "firebase-admin"
import * as similarity from "string-similarity"
import { CoreConfig, TranslationContext } from "./types_core"
import { Translator } from "./translator"

/**
 * Provides essential functionality shared among clients.
 */
export class Core {
  readonly config: CoreConfig

  private readonly translator: Translator

  constructor(config: CoreConfig, translator: Translator) {
    this.config = config
    this.translator = translator
  }

  /**
   * Creates document for this group in Cloud Firestore.
   */
  async initNewGroup(groupId): Promise<void> {
    await admin.firestore().collection("groups").doc(groupId).create({
      requiredLang: "en",
      mutePeople: false,
      beHelpful: true,
    })
  }

  /**
   * Adds the specified text to the database.
   * @returns {Promise<boolean>} true if the operation is successful, false otherwise
   */
  async addException(messageText: string, groupId: string): Promise<boolean> {
    // "match" is the result of executing the regexp above on the message's text
    const inputText = messageText.toLowerCase()

    try {
      await admin.firestore().collection("groups").doc(groupId).collection("exceptions").add({
        text: inputText,
      })
    } catch (err) {
      console.error(err)
      return false
    }

    return true
  }

  /**
   * Translates the @param messageText and checks whether it is in the required language.
   * @return TranslationData object or null
   */
  async translateAndCheck(messageText: string): Promise<TranslationContext> {
    return this.translator.translateAndCheck(messageText, this.config)
  }

  /**
   * Removes the specified text to the database.
   * @param {string} messageText message's text
   * @returns {Promise<bool>} true if the operation is successful, false otherwise
   */
  async removeException(messageText: string, groupId: string): Promise<boolean> {
    // "match" is the result of executing the regexp above on the message's text
    const inputText = messageText.toLowerCase()

    try {
      const exceptionsSnapshot = await admin
        .firestore()
        .collection("groups")
        .doc(groupId)
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
  async shouldBePermitted(messageText: string, groupId: string): Promise<boolean> {
    const inputText = messageText.toLowerCase()

    // Don't punish for short messages
    if (messageText.length <= 4) {
      return true
    }

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

    const exceptionsSnapshot = await admin.firestore().collection("groups").doc(groupId).collection("exceptions").get()

    for (const doc of exceptionsSnapshot.docs) {
      const text = doc.get("text")
      const similarityLevel = similarity.compareTwoStrings(text, inputText)
      if (similarityLevel >= 0.75) {
        console.log(`Similarity ${similarityLevel} between strings: "${text}" and "${inputText}". Returned false.`)
        return true
      }
    }

    return false
  }
}
