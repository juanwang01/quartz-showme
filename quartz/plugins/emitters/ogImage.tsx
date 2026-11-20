import { QuartzEmitterPlugin } from "../types"
import { i18n } from "../../i18n"
import { unescapeHTML } from "../../util/escape"
import { FullSlug, getFileExtension, isAbsoluteURL, joinSegments, QUARTZ } from "../../util/path"
import { ImageOptions, SocialImageOptions, defaultImage, getSatoriFonts } from "../../util/og"
import sharp from "sharp"
import satori, { SatoriOptions } from "satori"
import { loadEmoji, getIconCode } from "../../util/emoji"
import { Readable } from "stream"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"
import { QuartzPluginData } from "../vfile"
import fs from "node:fs/promises"
import { styleText } from "util"

const defaultOptions: SocialImageOptions = {
  colorScheme: "lightMode",
  width: 1200,
  height: 630,
  imageStructure: defaultImage,
  excludeRoot: false,
}

/**
 * Generates social image (OG/twitter standard) and saves it as `.png` inside the public folder
 * @param opts options for generating image
 */
async function generateSocialImage(
  { cfg, description, fonts, title, fileData }: ImageOptions,
  userOpts: SocialImageOptions,
): Promise<Readable> {
  const { width, height } = userOpts
  const iconPath = joinSegments(QUARTZ, "static", "icon.png")
  let iconBase64: string | undefined = undefined
  try {
    const iconData = await fs.readFile(iconPath)
    iconBase64 = `data:image/png;base64,${iconData.toString("base64")}`
  } catch (err) {
    console.warn(styleText("yellow", `Warning: Could not find icon at ${iconPath}`))
  }

  const imageComponent = userOpts.imageStructure({
    cfg,
    userOpts,
    title,
    description,
    fonts,
    fileData,
    iconBase64,
  })

  const svg = await satori(imageComponent, {
    width,
    height,
    fonts,
    loadAdditionalAsset: async (languageCode: string, segment: string) => {
      if (languageCode === "emoji") {
        return await loadEmoji(getIconCode(segment))
      }

      return languageCode
    },
  })

  // PNG instead of WebP: WeChat/QQ don't render WebP og:image thumbnails.
  return sharp(Buffer.from(svg)).png()
}

async function squareThumb(): Promise<Buffer> {
  const canvas = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#ffffff"/></svg>`,
  )

  try {
    const mark = await fs.readFile(joinSegments(QUARTZ, "static", "dragon-mark.png"))
    const inset = await sharp(mark)
      .resize(280, 280, { fit: "contain", background: "#ffffff" })
      .png()
      .toBuffer()
    return await sharp(canvas)
      .composite([{ input: inset, top: 10, left: 10 }])
      .jpeg({ quality: 84 })
      .toBuffer()
  } catch {
    // Fallback if the artwork is missing: a plain 龙 glyph tile.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
      <rect width="300" height="300" fill="#ffffff"/>
      <rect x="90" y="90" width="120" height="120" rx="28" fill="#161618"/>
      <text x="150" y="152" font-family="Noto Serif CJK SC" font-weight="900" font-size="76"
            text-anchor="middle" dominant-baseline="central" fill="#ffffff">龙</text>
    </svg>`
    return sharp(Buffer.from(svg)).jpeg({ quality: 84 }).toBuffer()
  }
}

async function processOgImage(ctx: BuildCtx, fileData: QuartzPluginData) {
  // Only the square dragon mark is used (og:image and WeChat cards both point at it),
  // so skip the slow satori-rendered wide card entirely.
  const slug = fileData.slug!
  const thumb = await squareThumb()

  return write({
    ctx,
    content: thumb,
    slug: `${slug}-og-thumb` as FullSlug,
    ext: ".jpg",
  })
}

export const CustomOgImagesEmitterName = "CustomOgImages"
export const CustomOgImages: QuartzEmitterPlugin<Partial<SocialImageOptions>> = (userOpts) => {
  const fullOptions = { ...defaultOptions, ...userOpts }

  return {
    name: CustomOgImagesEmitterName,
    getQuartzComponents() {
      return []
    },
    async *emit(ctx, content, _resources) {
      for (const [_tree, vfile] of content) {
        if (vfile.data.frontmatter?.socialImage !== undefined) continue
        yield processOgImage(ctx, vfile.data)
      }
    },
    async *partialEmit(ctx, _content, _resources, changeEvents) {
      // find all slugs that changed or were added
      for (const changeEvent of changeEvents) {
        if (!changeEvent.file) continue
        if (changeEvent.file.data.frontmatter?.socialImage !== undefined) continue
        if (changeEvent.type === "add" || changeEvent.type === "change") {
          yield processOgImage(ctx, changeEvent.file.data)
        }
      }
    },
    externalResources: (ctx) => {
      if (!ctx.cfg.configuration.baseUrl) {
        return {}
      }

      const baseUrl = ctx.cfg.configuration.baseUrl
      return {
        additionalHead: [
          (pageData) => {
            const isRealFile = pageData.filePath !== undefined
            let userDefinedOgImagePath = pageData.frontmatter?.socialImage

            if (userDefinedOgImagePath) {
              userDefinedOgImagePath = isAbsoluteURL(userDefinedOgImagePath)
                ? userDefinedOgImagePath
                : `https://${baseUrl}/static/${userDefinedOgImagePath}`
            }

            // WeChat's link card uses og:image, so point it at the square dragon mark.
            const generatedOgImagePath = isRealFile
              ? `https://${baseUrl}/${pageData.slug!}-og-thumb.jpg`
              : undefined
            const defaultOgImagePath = `https://${baseUrl}/static/dragon-mark.png`
            const ogImagePath = userDefinedOgImagePath ?? generatedOgImagePath ?? defaultOgImagePath
            const ogImageExt = getFileExtension(ogImagePath)?.replace(/^\./, "") ?? "png"
            const ogImageMimeType = `image/${ogImageExt === "jpg" ? "jpeg" : ogImageExt}`
            return (
              <>
                <meta property="og:image" content={ogImagePath} />
                <meta property="og:image:url" content={ogImagePath} />
                <meta name="twitter:image" content={ogImagePath} />
                <meta property="og:image:type" content={ogImageMimeType} />
              </>
            )
          },
        ],
      }
    },
  }
}
