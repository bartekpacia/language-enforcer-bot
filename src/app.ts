import * as telegram from "./telegram/bot_telegram"
import * as discord from "./discord/bot_discord"
import { TelegramConfig } from "./telegram/types_telegram"
import { DiscordConfig } from "./discord/types_discord"

const telegramRunning = process.argv.includes("--telegram")
const discordRunning = process.argv.includes("--discord")

if (telegramRunning) {
  const telegramBot = new telegram.EnforcingTelegramBot(new TelegramConfig())
  console.log("Started Telegram bot.")
}

if (discordRunning) {
  const discordBot = new discord.EnforcingDiscordBot(new DiscordConfig())
  console.log("Started Discord bot.")
}

if (!telegramRunning && !discordRunning) {
  console.error("You must run bot for at least one platform!")
}
