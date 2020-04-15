import * as core from "./core/core"

import * as telegram from "./telegram/bot_telegram"

import * as discord from "./discord/bot_discord"
import { TelegramConfig } from "./telegram/types_telegram"

console.log("Starting bot fleet...")

const telegramBot = new telegram.EnforcingTelegramBot(new TelegramConfig())

// This doesn't work like that, i'm nub
