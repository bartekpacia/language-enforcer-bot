import * as dotenv from "dotenv"
dotenv.config()

import { expect } from "chai"
import { Translator } from "../src/core/translator"
import { CoreConfig } from "../src/core/types_core"

const coreConfig = new CoreConfig()
coreConfig.REQUIRED_LANG = "en"

const translator = new Translator()

describe("translating functionality", () => {
  it("should translate Polish -> English using RICH method", async () => {
    const testText = "przykładowy tekst po polsku"

    const translation = await translator.translateRich(testText, coreConfig)
    expect(translation.inputText).to.equal(testText)
    expect(translation.detectedLangCode).to.equal("pl")
    expect(translation.detectedLangName).to.equal("Polish")
    expect(translation.translatedText).to.equal("sample text in Polish")
  })

  it("should fail gracefully 1", async () => {
    const testText = "1234567890"

    const translation = await translator.translateRich(testText, coreConfig)
    expect(translation.inputText).to.equal(testText)
    expect(translation.detectedLangCode).to.equal("und")
    expect(translation.detectedLangName).to.equal("unknown")
    expect(translation.translatedText).to.equal(testText)
  })

  it("should fail gracefully 2", async () => {
    const testText = "dang nice"

    const translation = await translator.translateRich(testText, coreConfig)
    expect(translation.inputText).to.equal(testText)
    expect(translation.detectedLangName).to.equal("unknown")
    expect(translation.translatedText).to.equal(testText)
  })
})
