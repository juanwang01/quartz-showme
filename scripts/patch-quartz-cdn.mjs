import fs from "node:fs"
import path from "node:path"

// jsDelivr 在国内经常被重置；把 graph / katex 的运行时依赖改到本站 static/vendor。
const graphPairs = [
  ["https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js", "/static/vendor/d3.min.js"],
  ["https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.js", "/static/vendor/pixi.min.js"],
]

const latexPairs = [
  [
    "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",
    "/static/vendor/katex/katex.min.css",
  ],
  [
    "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/copy-tex.min.js",
    "/static/vendor/katex/contrib/copy-tex.min.js",
  ],
]

const mappings = [
  { file: "node_modules/@quartz-community/graph/dist/index.js", pairs: graphPairs },
  { file: "node_modules/@quartz-community/graph/dist/components/index.js", pairs: graphPairs },
  { file: "node_modules/@quartz-community/latex/dist/index.js", pairs: latexPairs },
  { file: "node_modules/@quartz-community/latex/dist/components/index.js", pairs: latexPairs },
]

let changed = 0
for (const { file, pairs } of mappings) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) {
    console.warn(`[patch-cdn] skip missing ${file}`)
    continue
  }
  const before = fs.readFileSync(full, "utf8")
  let after = before
  for (const [from, to] of pairs) after = after.split(from).join(to)
  if (after !== before) {
    fs.writeFileSync(full, after)
    changed += 1
    console.log(`[patch-cdn] patched ${file}`)
  }
  if (after.includes("cdn.jsdelivr.net")) {
    console.warn(`[patch-cdn] ${file} still references jsDelivr, check plugin version`)
  }
}
console.log(`[patch-cdn] done, ${changed} file(s) updated`)
