/**
 * Configuration that is shared among all messaging frontends.
 */
export class CoreConfig {
  GCP_API_KEY: string

  REQUIRED_LANG: string

  PROJECT_ID: string

  CLIENT_EMAIL: string

  PRIVATE_KEY: string

  BE_HELPFUL: boolean

  MUTE_PEOPLE: boolean

  MUTE_TIMEOUT: number

  constructor() {
    if (!process.env.GCP_API_KEY) throw new Error("GCP_API_KEY is missing!")
    if (!process.env.PROJECT_ID) throw new Error("PROJECT_ID is missing!")
    if (!process.env.CLIENT_EMAIL) throw new Error("CLIENT_EMAIL is missing!")
    if (!process.env.PRIVATE_KEY) throw new Error("PRIVATE_KEY is missing!")

    const GCP_API_KEY = process.env.GCP_API_KEY
    const REQUIRED_LANG = process.env.REQUIRED_LANG || "en"
    const PROJECT_ID = process.env.PROJECT_ID
    const CLIENT_EMAIL = process.env.CLIENT_EMAIL
    const PRIVATE_KEY = process.env.PRIVATE_KEY.replace(/\\n/g, "\n") // prevents dotenv escaping
    const BE_HELPFUL = process.env.BE_HELPFUL === "true"
    const MUTE_PEOPLE = process.env.MUTE_PEOPLE === "true"
    const MUTE_TIMEOUT = Number(process.env.MUTE_TIMEOUT) || 30000

    this.GCP_API_KEY = GCP_API_KEY
    this.REQUIRED_LANG = REQUIRED_LANG
    this.PROJECT_ID = PROJECT_ID
    this.CLIENT_EMAIL = CLIENT_EMAIL
    this.PRIVATE_KEY = PRIVATE_KEY
    this.BE_HELPFUL = BE_HELPFUL
    this.MUTE_PEOPLE = MUTE_PEOPLE
    this.MUTE_TIMEOUT = MUTE_TIMEOUT

    /* console.log(
      `Created CoreConfig object. REQUIRED_LANG: ${REQUIRED_LANG}, PROJECT_ID: ${PROJECT_ID}, CLIENT_EMAIL: ${CLIENT_EMAIL}, PRIVATE_KEY: (${PRIVATE_KEY !=
        null}), BE_HELPFUL: ${BE_HELPFUL}, MUTE_PEOPLE: ${MUTE_PEOPLE}, MUTE_TIMEOUT: ${MUTE_TIMEOUT}`
    ) */
  }
}

export class Translation {
  inputText: string

  detectedLangCode: string

  detectedLangName: string

  translatedText: string

  confidence: number

  constructor(
    inputText: string,
    detectedLangCode: string,
    detectedLangName: string,
    translatedText: string,
    confidence: number
  ) {
    this.inputText = inputText
    this.detectedLangCode = detectedLangCode
    this.detectedLangName = detectedLangName
    this.translatedText = translatedText
    this.confidence = confidence
  }
}

export class TranslationContext {
  isCorrectLang: boolean

  requiredLangCode: string

  requiredLangName: string

  translation: Translation | null

  constructor(
    isCorrectLang: boolean,
    requiredLangCode: string,
    requiredLangName: string,
    translation: Translation | null
  ) {
    this.isCorrectLang = isCorrectLang
    this.requiredLangCode = requiredLangCode
    this.requiredLangName = requiredLangName
    this.translation = translation
  }
}
