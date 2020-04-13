import { CoreConfig } from "./types_core"

/**
 * Discord-specific configuration.
 */
export class DiscordConfig {
  TOKEN: string

  constructor() {
    if (!process.env.TOKEN) throw new Error("TOKEN is missing!")

    const TOKEN = process.env.TOKEN

    this.TOKEN = TOKEN

    console.log(`Created DiscordConfig object. TOKEN: ${TOKEN}`)
  }
}
