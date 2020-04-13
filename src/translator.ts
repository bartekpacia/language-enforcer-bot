import * as request from "request-promise-native"
import * as freeTranslationGoogle from "translation-google"
import { Translation, TranslationContext } from "./types_core"
import * as core from "./core"
import * as languagesFile from "./languages.json"

const config = core.config

export async function translateAndCheck(text: string): Promise<TranslationContext> {
  const translation = await translate(text)

  const requiredLangCode = config.REQUIRED_LANG
  const requiredLangName = findLangName(requiredLangCode)

  const isCorrectLang = translation.detectedLangCode === requiredLangCode

  return new TranslationContext(isCorrectLang, requiredLangCode, requiredLangName, translation)
}

export async function translate(text: string): Promise<Translation> {
  let translation = await translatePoor(text)

  if (!translation) {
    translation = await translateRich(text)
    return translation
  }

  return translation
}

/**
 * Works always but the poor owner has to pay for it.
 */
async function translateRich(text: string): Promise<Translation> {
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

  console.log(JSON.stringify(data))

  const detectedLangCode = data.detections[0][0].language
  const confidence = data.detections[0][0].confidence
  const translatedText = data.text

  const detectedLangName = findLangName(detectedLangCode)

  return new Translation(text, detectedLangCode, detectedLangName, translatedText, confidence)
}

/**
 * It works as long as a certain quota is not exceeded.
 */
async function translatePoor(text: string): Promise<Translation | null> {
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
