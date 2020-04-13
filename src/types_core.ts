export class CoreConfig {
  TOKEN: string
  REQUIRED_LANG: string
  PROJECT_ID: string
  CLIENT_EMAIL: string
  PRIVATE_KEY: string
  BE_HELPFUL: boolean
  MUTE_PEOPLE: boolean
  BAN_TIMEOUT: number

  constructor() {
    if (!process.env.TOKEN) throw new Error("TOKEN is missing!")
    if (!process.env.PROJECT_ID) throw new Error("PROJECT_ID is missing!")
    if (!process.env.CLIENT_EMAIL) throw new Error("CLIENT_EMAIL is missing!")
    if (!process.env.PRIVATE_KEY) throw new Error("PRIVATE_KEY is missing!")

    const TOKEN = process.env.TOKEN
    const REQUIRED_LANG = process.env.REQUIRED_LANG || "en"
    const PROJECT_ID = process.env.PROJECT_ID
    const CLIENT_EMAIL = process.env.CLIENT_EMAIL
    const PRIVATE_KEY = process.env.PRIVATE_KEY
    const BE_HELPFUL = process.env.BE_HELPFUL === "true"
    const MUTE_PEOPLE = process.env.MUTE_PEOPLE === "true"
    const BAN_TIMEOUT = Number(process.env.BAN_TIMEOUT) || 30000

    this.TOKEN = TOKEN
    this.REQUIRED_LANG = REQUIRED_LANG
    this.PROJECT_ID = PROJECT_ID
    this.CLIENT_EMAIL = CLIENT_EMAIL
    this.PRIVATE_KEY = PRIVATE_KEY
    this.BE_HELPFUL = BE_HELPFUL
    this.MUTE_PEOPLE = MUTE_PEOPLE
    this.BAN_TIMEOUT = BAN_TIMEOUT
  }
}
