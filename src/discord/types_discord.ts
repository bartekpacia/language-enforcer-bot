/**
 * Discord-specific configuration.
 */
export class DiscordConfig {
  readonly DISCORD_TOKEN: string

  constructor(token: string) {
    this.DISCORD_TOKEN = token
    // console.log(`Created DiscordConfig object. TOKEN: ${TOKEN}`)
  }
}
