import * as request from "request-promise-native"
import * as freeTranslationGoogle from "translation-google"
import { Translation, TranslationContext, CoreConfig } from "./types_core"
import * as languagesFile from "./languages.json"

export async function translateAndCheck(
  text: string,
  config: CoreConfig
): Promise<TranslationContext> {
  const translation = await translate(text, config)

  const requiredLangCode = config.REQUIRED_LANG
  const requiredLangName = findLangName(requiredLangCode)

  let isCorrectLang = translation.detectedLangCode === requiredLangCode

  if (translation.detectedLangCode === "und") {
    console.log(
      `Couldn't detect language (detectedLang === "und"). Assuming that isCorrectLang = true.`
    )
    isCorrectLang = true
  }

  if (translation.confidence < 0.7) {
    console.log(
      `Confidence is too small (${translation.confidence}). Assuming that isCorrectLang = true.`
    )
    isCorrectLang = true
  }

  return new TranslationContext(isCorrectLang, requiredLangCode, requiredLangName, translation)
}

async function translate(text: string, config: CoreConfig): Promise<Translation> {
  let translation = await translatePoor(text, config)
  // console.log("Attempted to use POOR translation method.")
  // console.log(translation)

  if (!translation) {
    translation = await translateRich(text, config)

    // console.log("POOR translation failed. Attempted to use RICH translation method.")
    // console.log(translation)

    return translation
  }

  return translation
}

/**
 * Works always but the poor owner has to pay for it.
 */
async function translateRich(text: string, config: CoreConfig): Promise<Translation> {
  const options = {
    uri: `https://translation.googleapis.com/language/translate/v2/detect?key=${config.GCP_API_KEY}`,
    method: "POST",
    json: true,
    body: {
      q: text
    }
  }

  let data
  try {
    const response = await request(options)
    data = response.data
  } catch (err) {
    console.error(err.message)
    process.exit(69)
  }

  // console.log(JSON.stringify(data)) // uncomment to print whole response

  const detectedLangCode = data.detections[0][0].language
  const confidence = data.detections[0][0].confidence
  const translatedText = data.text

  const detectedLangName = findLangName(detectedLangCode)

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
    console.error(err)
    console.error("An error occurred while translating the message")
    return null
  }
}

function findLangName(langIsoCode: string): string | "unknown" {
  const langFullName = languagesFile.data?.languages?.find(
    ({ language }) => language === langIsoCode
  )?.name

  if (!langFullName) {
    return "unknown"
  }

  return langFullName
}
