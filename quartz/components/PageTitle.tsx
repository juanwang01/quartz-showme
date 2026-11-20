import { joinSegments, pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const baseDir = pathToRoot(fileData.slug!)
  // Visible logo doubles as the link-preview image for crawlers (e.g. WeChat),
  // which pick the first visible <img> on the page and ignore og:image.
  const logo = joinSegments(baseDir, "static/dragon-mark.png")
  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <a href={baseDir}>
        <img class="page-logo" src={logo} alt="" width="34" height="34" />
        <span>{title}</span>
      </a>
    </h2>
  )
}

PageTitle.css = `
.page-title {
  font-size: 1.75rem;
  margin: 0;
  font-family: var(--titleFont);
}
.page-title a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.page-title .page-logo {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  flex: none;
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
