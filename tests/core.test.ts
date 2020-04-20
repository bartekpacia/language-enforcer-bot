import * as dotenv from "dotenv"
dotenv.config()

import { expect } from "chai"
import { Core } from "../src/core/core"
import { CoreConfig } from "../src/core/types_core"
import { Translator } from "../src/core/translator"

const core = new Core(new CoreConfig(), new Translator())
core.config.REQUIRED_LANG = "en"

describe("core functionality", () => {
  it("should detect English language", async () => {
    const translationContext = await core.translateAndCheck("i am testing a bot")
    expect(translationContext.requiredLangCode).to.equal("en")
    expect(translationContext.translation?.detectedLangCode).to.equal("en")
    expect(translationContext.translation?.detectedLangName).to.equal("English")
    expect(translationContext.isCorrectLang).to.equal(true)
  })

  it("should detect wrong language", async () => {
    const translationContext = await core.translateAndCheck("oto tekst po polsku")
    expect(translationContext.requiredLangCode).to.equal("en")
    expect(translationContext.translation?.detectedLangCode).to.equal("pl")
    expect(translationContext.translation?.detectedLangName).to.equal("Polish")
    expect(translationContext.isCorrectLang).to.equal(false)
  })
})
