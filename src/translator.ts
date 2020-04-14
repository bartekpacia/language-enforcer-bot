import * as request from "request-promise-native"
import * as freeTranslationGoogle from "translation-google"
import { Translation, TranslationContext, CoreConfig } from "./types_core"
import * as languagesFile from "./languages.json"

/**
 * Detects the language of the @param text, translates it to REQUIRED_LANG and
 * returns whether the detected language is correct.
 * @param text Text to be translated and checked against
 * @param config CoreConfig configuration object
 */
export async function translateAndCheck(
  text: string,
  config: CoreConfig
): Promise<TranslationContext> {
  const translation = await translate(text, config)

  const requiredLangCode = config.REQUIRED_LANG
  const requiredLangName = findLangName(requiredLangCode)

  if (!translation) {
    return new TranslationContext(true, requiredLangCode, requiredLangName, null)
  }

  let isCorrectLang = translation.detectedLangCode === requiredLangCode

  // Handle edge cases (when no language is detected)
  if (translation.detectedLangCode === "und" || translation.detectedLangCode === "unknown") {
    console.log(
      `Couldn't detect language (detectedLang === "und" || "unknown"). Assuming that isCorrectLang = true.`
    )
    isCorrectLang = true
  }

  // Relax when the confidence isn't big enough
  if (translation.confidence < 0.7) {
    isCorrectLang = true
  }

  return new TranslationContext(isCorrectLang, requiredLangCode, requiredLangName, translation)
}

export async function translate(text: string, config: CoreConfig): Promise<Translation | null> {
  let translation = await translatePoor(text, config)

  if (!translation && config.GCP_API_KEY) {
    translation = await translateRich(text, config)
    return translation
  }

  return translation
}

/**
 * Works always but the poor owner has to pay for it.
 */
export async function translateRich(text: string, config: CoreConfig): Promise<Translation> {
  // Part 1 – detect languae
  const detectRequestOptions = {
    uri: `https://translation.googleapis.com/language/translate/v2/detect?key=${config.GCP_API_KEY}`,
    method: "POST",
    json: true,
    body: {
      q: text
    }
  }

  let detectData
  try {
    const response = await request(detectRequestOptions)
    detectData = response.data
  } catch (err) {
    console.error("An error occurred while using Google Translate API to detect a language.")
    console.error(err.message)
    process.exit(69)
  }

  const detectedLangCode = detectData.detections[0][0].language
  const confidence = detectData.detections[0][0].confidence

  const detectedLangName = findLangName(detectedLangCode)

  // Part 2 – translate to target language
  const translateRequestOptions = {
    uri: `https://translation.googleapis.com/language/translate/v2?key=${config.GCP_API_KEY}`,
    method: "POST",
    json: true,
    body: {
      q: text,
      target: config.REQUIRED_LANG
    }
  }

  let translateData
  try {
    const response = await request(translateRequestOptions)
    translateData = response.data
  } catch (err) {
    console.error("An error occurred while using Google Translate API to translate a message.")
    console.error(err.message)
    process.exit(69)
  }

  const translatedText = translateData.translations[0].translatedText

  return new Translation(text, detectedLangCode, detectedLangName, translatedText, confidence)
}

/**
 * It works as long as a certain quota is not exceeded.
 */
async function translatePoor(text: string, config: CoreConfig): Promise<Translation | null> {
  try {
    const data = await freeTranslationGoogle(text, { raw: true, to: config.REQUIRED_LANG })

    const detectedLangCode = data.from.language.iso
    const translatedText = data.text
    const confidence = JSON.parse(data.raw)[6]

    const detectedLangName = findLangName(detectedLangCode)

    return new Translation(text, detectedLangCode, detectedLangName, translatedText, confidence)
  } catch (err) {
    console.log(
      "Couldn't translate the message using POOR method. The bot should now fallback to the RICH method"
    )
    return null
  }
}

function findLangName(langIsoCode: string): string | "unknown" {
  const langFullName = languagesFile[langIsoCode]

  if (!langFullName) {
    return "unknown"
  }

  return langFullName
}
