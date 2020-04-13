/**
 * Telegram-specific configuration.
 */
export class TelegramConfig {
  TOKEN: string

  constructor() {
    if (!process.env.TOKEN) throw new Error("TOKEN is missing!")

    const TOKEN = process.env.TOKEN

    this.TOKEN = TOKEN

    console.log(`Created TelegramConfig object. TOKEN: ${TOKEN}`)
  }
}
