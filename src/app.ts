import * as dotenv from "dotenv"
dotenv.config()

import * as admin from "firebase-admin"
import { SecretManagerServiceClient } from "@google-cloud/secret-manager"
import { CoreConfig } from "./core/types_core"
import * as telegram from "./telegram/bot_telegram"
import * as discord from "./discord/bot_discord"
import { TelegramConfig } from "./telegram/types_telegram"
import { DiscordConfig } from "./discord/types_discord"
import { Core } from "./core/core"
import { Translator } from "./core/translator"

export const config = new CoreConfig()

admin.initializeApp()

const TELEGRAM_TOKEN_NAME = "projects/telegram-lang-enforcer/secrets/TELEGRAM_TOKEN/versions/latest"
const TELEGRAM_TOKEN_NAME_DEV = "projects/telegram-lang-enforcer/secrets/TELEGRAM_TOKEN_DEV/versions/latest"
const DISCORD_TOKEN_NAME = "projects/telegram-lang-enforcer/secrets/DISCORD_TOKEN/versions/latest"

const secretClient = new SecretManagerServiceClient()

async function main(): Promise<void> {
  const core = new Core(config, new Translator())

  async function getSecret(secretName: string): Promise<string | null | undefined> {
    const [version] = await secretClient.accessSecretVersion({ name: secretName })

    return version.payload?.data?.toString()
  }

  const telegramRunning = process.argv.includes("--telegram")
  const discordRunning = process.argv.includes("--discord")
  const isDevMode = process.argv.includes("--dev")

  const TELEGRAM_TOKEN = await getSecret(isDevMode ? TELEGRAM_TOKEN_NAME_DEV : TELEGRAM_TOKEN_NAME)
  const DISCORD_TOKEN = await getSecret(DISCORD_TOKEN_NAME)

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
      console.log("Started Discord bot.")
    } else {
      console.error("DISCORD_TOKEN is null/undefined")
    }
  }

  if (!telegramRunning && !discordRunning) {
    console.error("You must run bot for at least one platform!")
  }
}

main().catch(console.error)
