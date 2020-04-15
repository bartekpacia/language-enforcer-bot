import * as telegram from "./telegram/bot_telegram"
import * as discord from "./discord/bot_discord"
import { TelegramConfig } from "./telegram/types_telegram"
import { DiscordConfig } from "./discord/types_discord"

let telegramRunning = false
let discordRunning = false

if (process.argv.includes("--telegram")) {
  const telegramBot = new telegram.EnforcingTelegramBot(new TelegramConfig())
  telegramRunning = true
  console.log("Started Telegram bot.")
}

if (process.argv.includes("--discord")) {
  const discordBot = new discord.EnforcingDiscordBot(new DiscordConfig())
  discordRunning = true
  console.log("Started Discord bot.")
}

if (!telegramRunning && !discordRunning) {
  console.error("You must run bot for at least one platform!")
}
