import { expect } from "chai"
import * as core from "../src/core"

describe("core translating functionality", () => {
  it("should detect English language", async () => {
    const translationContext = await core.checkAndTranslate("i am testing a bot")
    expect(translationContext.translation.detectedLangCode).to.equal("en")
    expect(translationContext.translation.detectedLangName).to.equal("English")
    expect(translationContext.isCorrectLang).to.equal(true)
  })

  it("should detect wrong language", async () => {
    const translationContext = await core.checkAndTranslate("oto tekst po polsku")
    expect(translationContext.translation.detectedLangCode).to.equal("pl")
    expect(translationContext.translation.detectedLangName).to.equal("Polish")
    expect(translationContext.isCorrectLang).to.equal(false)
  })
})
