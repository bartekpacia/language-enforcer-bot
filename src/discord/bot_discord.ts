/**
 * Discord Bot. It takes advantage of the functions defined in core.ts.
 */

import * as DiscordBot from "discord.js"
import * as core from "../core/core"

import { DiscordConfig } from "./types_discord"

const { config } = core
const discordConfig = new DiscordConfig()

export const bot = new DiscordBot.Client()
bot.login(discordConfig.TOKEN)

/**
 * Returns true if the user is an admin or a creator, false otherwise.
 */
function isAdminUser(guildMember: DiscordBot.GuildMember): boolean {
  return guildMember.hasPermission("MANAGE_MESSAGES") // users who manage messages can't be muted
}

/**
 * Handles adding words to the exception list
 */
async function handleExcept(msg: DiscordBot.Message, match): Promise<void> {
  if (!msg.member || !isAdminUser(msg.member)) {
    console.log("User is not an admin or has left the server. Returned.")
    msg.reply("Sorry, this is a admin-only feature.")
    return
  }

  const inputText = match[1]

  const successful = await core.addException(inputText)

  if (successful) {
    msg.reply(`Okay, "${inputText}" has been added to the exception list. `)
  } else {
    msg.reply(`An error occurred while adding the word ${inputText}`)
  }
}

/**
 * Handles removing words from the exception list
 */
async function handleRemove(msg: DiscordBot.Message, match): Promise<void> {
  if (!msg.member || !isAdminUser(msg.member)) {
    console.log("User is not an admin or has left the server. Returned.")
    msg.reply("Sorry, this is a admin-only feature.")
    return
  }

  const inputText = match[1]

  const successful = await core.removeException(inputText)

  if (successful) {
    msg.reply(`Okay, "${inputText}" has been removed from the exception list. `)
  } else {
    msg.reply(`An error occurred while removing the word ${inputText}`)
  }
}

// Handles all messages and checks whether they're in the specified language
bot.on("message", async msg => {
  if (msg.author === bot.user) {
    // prevents reacting to own messages
    return
  }

  if (msg.content === undefined) {
    console.log("Message doesn't contain text, returned. (msg.content === undefined)")
    return
  }

  if (msg.channel instanceof DiscordBot.DMChannel) {
    console.log(
      "Message was sent in a private chat, returned. (msg.channel instanceof DiscordBot.DMChannel)"
    )
    msg.reply("Sorry, I work only in servers.")
    return
  }

  const exceptMatch = msg.content.match(/\/except (.+)/)
  const removeMatch = msg.content.match(/\/remove (.+)/)

  if (exceptMatch) {
    handleExcept(msg, exceptMatch)
  } else if (removeMatch) {
    handleRemove(msg, removeMatch)
  }

  const translationContext = await core.translateAndCheck(msg.content)

  if (!translationContext) {
    console.log("translationContext is null. That's probably an error. Returned.")
    return
  }

  if (!translationContext.isCorrectLang) {
    const permitted = await core.shouldBePermitted(msg.content)

    if (!permitted && translationContext.translation) {
      performAction(
        msg,
        translationContext.translation.detectedLangName,
        translationContext.requiredLangName,
        translationContext.translation.translatedText
      )
    }
  }
})

/**
 * Performs an action on the user (whether to just remind him to use the
 * specified language, or ban him).
 */
async function performAction(
  msg: DiscordBot.Message,
  detectedLangName: string,
  requiredLangName: string,
  translatedText: string
): Promise<void> {
  if (!msg.member) {
    console.log("msg.member is undefined. Returned.")
    return
  }

  console.log(`Performing rebuke/mute/translate action on user ${msg.author.username}...`)
  let message = `Hey, man, don't speak this ${detectedLangName} anymore! We only do ${requiredLangName} down here.\n`

  if (config.MUTE_PEOPLE && !isAdminUser(msg.member)) {
    mute(msg)
    message += `You've been muted for ${config.MUTE_TIMEOUT / 1000} seconds.\n`
  }

  if (config.BE_HELPFUL) {
    if (translatedText !== msg.content) {
      message += `BTW, they tried to say "${translatedText}"`
    } else {
      message += "BTW, I've no idea what they tried to say."
    }
  }

  msg.reply(message)
}

/**
 * Temporarily mutes the user for sending the inappropriate messages.
 * Mutes only if the user is not an admin.
 * @param {DiscordBot.Message} msg Discord Message object
 */
async function mute(msg: DiscordBot.Message): Promise<void> {
  console.log(`mute() function invoked for user ${msg.author.username}`)

  if (!msg.guild) {
    console.error(
      "Something very weird has happened. Somehow, there doesn't appear to be a Discord server"
    )
    return
  }

  msg.guild.channels.cache.forEach(async channel => {
    if (!msg.member) {
      console.log("Message author is no longer a server member. Returned")
      return
    }

    await channel.overwritePermissions(
      [
        {
          id: msg.member,
          deny: "SEND_MESSAGES"
        }
      ],
      "Spoke wrong language"
    )
  })

  console.log(`Muting user ${msg.author.username} for ${config.MUTE_TIMEOUT / 1000} seconds.`)

  setTimeout(async () => {
    if (!msg.guild) {
      console.error(
        "Something very weird has happened. Somehow, there doesn't appear to be a Discord server"
      )
      return
    }

    msg.guild.channels.cache.forEach(async channel => {
      if (!msg.member) {
        console.log("Message author is no longer a server member. Returned")
        return
      }

      await channel.overwritePermissions(
        [
          {
            id: msg.member,
            allow: "SEND_MESSAGES"
          }
        ],
        "Spoke wrong language - Timeout over"
      )
    })
    console.log(`Unmuted user ${msg.author.username}.`)
  }, config.MUTE_TIMEOUT)
}
