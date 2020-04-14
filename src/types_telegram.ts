/**
 * Telegram-specific configuration.
 */
export class TelegramConfig {
  TOKEN: string

  constructor() {
    if (!process.env.TELEGRAM_TOKEN) throw new Error("TELEGRAM_TOKEN is missing!")

    const TOKEN = process.env.TELEGRAM_TOKEN

    this.TOKEN = TOKEN

    // console.log(`Created TelegramConfig object. TOKEN: ${TOKEN}`)
  }
}
