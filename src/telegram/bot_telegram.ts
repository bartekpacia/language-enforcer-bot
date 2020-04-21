/**
 * Telegram Bot. It takes advantage of the functions defined in core.ts.
 */

import * as TelegramBot from "node-telegram-bot-api"
import { Core } from "../core/core"
import { TelegramConfig } from "./types_telegram"

export class EnforcingTelegramBot extends TelegramBot {
  readonly core: Core

  readonly telegramConfig: TelegramConfig

  constructor(core: Core, config: TelegramConfig) {
    super(config.TELEGRAM_TOKEN, { polling: true })
    this.core = core
    this.telegramConfig = config
  }

  /**
   * Start listening to Telegram webhook.
   */
  start(): void {
    // The essence of this bot, scan all messages
    this.on("message", async (msg) => {
      if (msg.text === undefined) {
        console.log("Message doesn't contain text, returned. (msg.text === undefined)")
        return
      }

      if (msg.chat.type === "private") {
        console.log("Message was sent in a private chat, returned. (msg.chat.type === private)")
        this.sendMessage(msg.chat.id, "Sorry, I work only in groups.")
        return
      }

      const exceptMatch = msg.text.match(/\/except (.+)/)?.toString()
      const removeMatch = msg.text.match(/\/remove (.+)/)?.toString()

      if (exceptMatch) {
        this.handleExcept(msg, exceptMatch)
      } else if (removeMatch) {
        this.handleRemove(msg, removeMatch)
      }

      const translationContext = await this.core.translateAndCheck(msg.text)

      if (!translationContext.translation) {
        console.log("translationContext.translation is null. That's probably an error. Returned.")
        return
      }

      if (!translationContext.isCorrectLang) {
        const permitted = await this.core.shouldBePermitted(msg.text)

        if (!permitted && translationContext.translation) {
          this.performAction(
            msg,
            translationContext.translation.detectedLangName,
            translationContext.requiredLangName,
            translationContext.translation.translatedText
          )
        }
      }
    })

    // Perform some initial setup when added to a group
    this.on("new_chat_members", async (msg) => {
      msg.new_chat_members?.forEach(async (user) => {
        // TODO Find a better way, don't hardcode username
        if (user.username === "LangPolizeiBartekBot") {
          const chatId = `msg.chat.id: ${msg.chat.id}, msg.chat.title: ${msg.chat.title}`

          await this.sendMessage(
            msg.chat.id,
            `Hello! Since now, you are only allowed to speak ${this.core.config.REQUIRED_LANG}. ${chatId}`,
            {
              parse_mode: "HTML",
            }
          )
          await this.core.initNewGroup(`TG_${msg.chat.id}`)
        }
      })
    })

    console.log("Started Telegram bot.")
  }

  async handleExcept(msg: TelegramBot.Message, match: string): Promise<void> {
    const chatId = msg.chat.id
    const userId = msg.from?.id

    if (!userId) {
      console.log("userId is undefined. Returned.")
      return
    }

    const chatMember = await this.getChatMember(chatId, userId.toString())

    if (!EnforcingTelegramBot.isAdminUser(chatMember)) {
      console.log("User is not an admin. Returned.")
      this.sendMessage(chatId, `Sorry, this is a admin-only feature.`)
      return
    }

    // "match" is the result of executing the regexp above on the message's text
    const inputText = match.toLowerCase()
    if (!inputText) {
      console.log("inputText is undefined. Returned.")
    }

    const successful = await this.core.addException(inputText, `TG_${msg.chat.id}`)

    if (successful) {
      this.sendMessage(chatId, `Okay, "${inputText}" has been added to the exception list. `)
    } else {
      this.sendMessage(chatId, `An error occurred while adding the word ${inputText}`)
    }
  }

  async handleRemove(msg: TelegramBot.Message, match: string): Promise<void> {
    const chatId = msg.chat.id
    const userId = msg.from?.id

    if (!userId) {
      console.log("userId is undefined. Returned.")
      return
    }

    const chatMember = await this.getChatMember(chatId, userId.toString())

    if (!EnforcingTelegramBot.isAdminUser(chatMember)) {
      console.log("User is not an admin. Returned.")
      this.sendMessage(chatId, `Sorry, this is a admin-only feature.`)
      return
    }

    const inputText = match.toLowerCase()
    if (!inputText) {
      console.log("inputText is undefined. Returned.")
    }

    const successful = await this.core.removeException(inputText)

    // send back the matched "whatever" to the chat
    if (successful) {
      this.sendMessage(chatId, `Okay, "${inputText}" has been removed from the exception list.`)
    } else {
      this.sendMessage(chatId, `An error occurred while removing the word ${inputText}`)
    }
  }

  /**
   * @returns true if the user is an admin or a creator, false otherwise.
   */
  static isAdminUser(chatMember: TelegramBot.ChatMember): boolean {
    return chatMember.status === "administrator" || chatMember.status === "creator"
  }

  /**
   * Performs an action on the user. An action is e.g rebuking the user or muting him
   * for some time.
   */
  async performAction(
    msg: TelegramBot.Message,
    detectedLangName: string,
    requiredLangName: string,
    translatedText: string
  ): Promise<void> {
    if (!msg.from) {
      console.log("msg.from is undefined. Returned.")
      return
    }

    console.log(`Performing rebuke/mute/translate action on user ${msg.from.first_name}.`)
    let message = `Hey, don't speak ${detectedLangName}! We only use ${requiredLangName} here.\n`

    const sender = await this.getChatMember(msg.chat.id, msg.from.id.toString())

    if (this.core.config.MUTE_PEOPLE && !EnforcingTelegramBot.isAdminUser(sender)) {
      this.mute(msg, sender)
      message += `You've been muted for ${this.core.config.MUTE_TIMEOUT / 1000} seconds.\n`
    }

    if (this.core.config.BE_HELPFUL) {
      if (translatedText !== msg.text) {
        message += `BTW, we know you mean "${translatedText}"`
      } else {
        message += "BTW, we've no idea what you tried to say."
      }
    }

    this.sendMessage(msg.chat.id, message, {
      reply_to_message_id: msg.message_id,
      parse_mode: "HTML",
    })
  }

  /**
   * Temporarily mutes the user for sending the inappropriate messages.
   * Mutes only if the user is not an admin.
   * @param {TelegramBot.Message} msg Telegram Message object
   */
  async mute(msg: TelegramBot.Message, sender: TelegramBot.ChatMember): Promise<void> {
    const isAdmin = EnforcingTelegramBot.isAdminUser(sender)

    console.log(`mute() function invoked for user ${sender.user.first_name}, isAdmin: ${isAdmin}`)

    if (!isAdmin) {
      this.restrictChatMember(msg.chat.id, sender.user.id.toString(), {
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
      })

      console.log(`Muting user ${sender.user.first_name} for ${this.core.config.MUTE_TIMEOUT / 1000} seconds.`)

      setTimeout(async () => {
        this.restrictChatMember(msg.chat.id, sender.user.id.toString(), {
          can_send_messages: true,
          can_send_media_messages: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true,
        })

        console.log(`Unmuted user ${sender.user.first_name}.`)
      }, this.core.config.MUTE_TIMEOUT)
    }
  }
}
