import { expect } from "chai"
import * as core from "../src/core"

describe("core translating functionality", () => {
  it("should detect English language", async () => {
    const translationData = await core.checkAndTranslate("i am testing a bot")
    expect(translationData?.detectedLangName).to.equal("English")
  })
})
