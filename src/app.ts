import * as dotenv from "dotenv"
dotenv.config()

import * as admin from "firebase-admin"
import { CoreConfig } from "./core/types_core"
import * as telegram from "./telegram/bot_telegram"
import * as discord from "./discord/bot_discord"
import { TelegramConfig } from "./telegram/types_telegram"
import { DiscordConfig } from "./discord/types_discord"
import { Core } from "./core/core"
import { Translator } from "./core/translator"

export const config = new CoreConfig()

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: config.PROJECT_ID,
    clientEmail: config.CLIENT_EMAIL,
    privateKey: config.PRIVATE_KEY
  })
})

async function main(): Promise<void> {
  const core = new Core(config, new Translator())

  const telegramRunning = process.argv.includes("--telegram")
  const discordRunning = process.argv.includes("--discord")
  const isDevMode = process.argv.includes("--dev")

  console.log(`isDevMode: ${isDevMode}`)

  const TELEGRAM_TOKEN = isDevMode ? process.env.TELEGRAM_TOKEN_DEV : process.env.TELEGRAM_TOKEN
  const DISCORD_TOKEN = process.env.DISCORD_TOKEN

  if (telegramRunning) {
    if (TELEGRAM_TOKEN != null) {
      const telegramBot = new telegram.EnforcingTelegramBot(core, new TelegramConfig(TELEGRAM_TOKEN))
      telegramBot.start()
    } else {
      console.error("TELEGRAM_TOKEN is null/undefined!")
    }
  }

  if (discordRunning) {
    if (DISCORD_TOKEN != null) {
      const discordBot = new discord.EnforcingDiscordBot(core, new DiscordConfig(DISCORD_TOKEN))
      discordBot.start()
    } else {
      console.error("DISCORD_TOKEN is null/undefined")
    }
  }

  if (!telegramRunning && !discordRunning) {
    console.error("You must run bot for at least one platform!")
  }
}

main().catch(console.error)
