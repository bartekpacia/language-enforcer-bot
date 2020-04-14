import { CoreConfig } from "./types_core"

/**
 * Discord-specific configuration.
 */
export class DiscordConfig {
  TOKEN: string

  constructor() {
    if (!process.env.DISCORD_TOKEN) throw new Error("DISCORD_TOKEN is missing!")

    const TOKEN = process.env.DISCORD_TOKEN

    this.TOKEN = TOKEN

    console.log(`Created DiscordConfig object. TOKEN: ${TOKEN}`)
  }
}
