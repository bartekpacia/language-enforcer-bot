/**
 * Discord-specific configuration.
 */
export class DiscordConfig {
  DISCORD_TOKEN: string

  constructor() {
    if (!process.env.DISCORD_TOKEN) throw new Error("DISCORD_TOKEN is missing!")

    const TOKEN = process.env.DISCORD_TOKEN

    this.DISCORD_TOKEN = TOKEN

    // console.log(`Created DiscordConfig object. TOKEN: ${TOKEN}`)
  }
}
