// @ts-ignore
import clipboardScript from "./scripts/clipboard.inline"
import clipboardStyle from "./styles/clipboard.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Body: QuartzComponent = ({ children, fileData, cfg }: QuartzComponentProps) => {
  // WeChat's crawler builds link thumbnails from the first <img> on the page, ignoring
  // og:image. Emit one off-screen so the page itself looks unchanged.
  const usePageThumb =
    fileData.filePath !== undefined && fileData.frontmatter?.socialImage === undefined
  const shareThumb =
    cfg.baseUrl && !cfg.baseUrl.startsWith("/")
      ? usePageThumb
        ? `https://${cfg.baseUrl}/${fileData.slug!}-og-thumb.png`
        : `https://${cfg.baseUrl}/static/og-image.png`
      : usePageThumb
        ? `/${fileData.slug!}-og-thumb.png`
        : `/static/og-image.png`

  return (
    <div id="quartz-body">
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: "300px",
          height: "300px",
          overflow: "hidden",
        }}
      >
        <img src={shareThumb} width="300" height="300" alt="" />
      </div>
      {children}
    </div>
  )
}

Body.afterDOMLoaded = clipboardScript
Body.css = clipboardStyle

export default (() => Body) satisfies QuartzComponentConstructor
