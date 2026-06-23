import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { styleText } from "util"
import { FullSlug } from "../../util/path"

export function extractDomainFromBaseUrl(baseUrl: string | undefined) {
  // Handle root path case
  if (baseUrl === "/" || !baseUrl) {
    return ""
  }
  const url = new URL(`https://${baseUrl}`)
  return url.hostname
}

export const CNAME: QuartzEmitterPlugin = () => ({
  name: "CNAME",
  async emit(ctx) {
    // Try to get domain from multiple sources
    const domain =
      (ctx.cfg.configuration as any).cname || // Custom cname field
      extractDomainFromBaseUrl(ctx.cfg.configuration.baseUrl)

    if (!domain) {
      console.warn(
        styleText(
          "yellow",
          "CNAME emitter requires `baseUrl` or `cname` to be set in your configuration",
        ),
      )
      return []
    }

    const path = await write({
      ctx,
      content: domain,
      slug: "CNAME" as FullSlug,
      ext: "",
    })
    return [path]
  },
  async *partialEmit() {},
})
