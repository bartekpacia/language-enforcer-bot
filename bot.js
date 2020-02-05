// Load .env file that has TOKEN
require("dotenv").config()

const request = require("request-promise-native")
const TelegramBot = require("node-telegram-bot-api")

const TOKEN = process.env.TOKEN
const bot = new TelegramBot(TOKEN, { polling: true })

console.log("Bot is running...")
