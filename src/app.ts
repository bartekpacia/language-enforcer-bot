import * as telegram from "./telegram/bot_telegram"
import * as discord from "./discord/bot_discord"
import { TelegramConfig } from "./telegram/types_telegram"
import { DiscordConfig } from "./discord/types_discord"

console.log("Starting bot fleet...")

const telegramBot = new telegram.EnforcingTelegramBot(new TelegramConfig())
const discordBot = new discord.EnforcingDiscordBot(new DiscordConfig())
