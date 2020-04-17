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

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: config.PROJECT_ID,
    clientEmail: config.CLIENT_EMAIL,
    privateKey: config.PRIVATE_KEY
  })
})

const secretClient = new SecretManagerServiceClient()

async function main() {
  const core = new Core(config, new Translator())

  // async function getSecret(): Promise<string | null | undefined> {
  //   const [secret] = await secretClient.getSecret({ name: "TELEGRAM_TOKEN" })

  //   return secret.name
  // }

  // const TELEGRAM_TOKEN = await getSecret()
  // console.log(TELEGRAM_TOKEN)

  const telegramRunning = process.argv.includes("--telegram")
  const discordRunning = process.argv.includes("--discord")

  if (telegramRunning) {
    const telegramBot = new telegram.EnforcingTelegramBot(core, new TelegramConfig())
    console.log("Started Telegram bot.")
  }

  if (discordRunning) {
    const discordBot = new discord.EnforcingDiscordBot(core, new DiscordConfig())
    console.log("Started Discord bot.")
  }

  if (!telegramRunning && !discordRunning) {
    console.error("You must run bot for at least one platform!")
  }
}

main().catch(console.error)
