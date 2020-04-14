import { expect } from "chai"
import * as translator from "../src/translator"
import * as core from "../src/core"

core.config.REQUIRED_LANG = "en"

describe("translating functionality", () => {
  it("should translate Polish -> English using RICH method", async () => {
    const testText = "przykładowy tekst po polsku"

    const translation = await translator.translateRich(testText, core.config)
    expect(translation.inputText).to.equal(testText)
    expect(translation.detectedLangCode).to.equal("pl")
    expect(translation.detectedLangName).to.equal("Polish")
    expect(translation.translatedText).to.equal("sample text in Polish")
  })

  it("should fail gracefully", async () => {
    const testText = "1234567890"

    const translation = await translator.translateRich(testText, core.config)
    expect(translation.inputText).to.equal(testText)
    expect(translation.detectedLangCode).to.equal("und")
    expect(translation.detectedLangName).to.equal("unknown")
    expect(translation.translatedText).to.equal(testText)
  })
})
