import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Body: QuartzComponent = ({ children, cfg }: QuartzComponentProps) => {
  // 微信/QQ 的链接卡片会抓页面里第一张 <img>，忽略 og:image。
  // 放一张屏幕外、不可见的龙标方图，页面外观不受影响。
  const shareThumb =
    cfg.baseUrl && !cfg.baseUrl.startsWith("/")
      ? `https://${cfg.baseUrl}/static/dragon-mark.png`
      : `/static/dragon-mark.png`

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

export default (() => Body) satisfies QuartzComponentConstructor
