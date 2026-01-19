---
title: 利用quartz开源项目搭建个人博客
---
Quartz笔记项目技术说明&配置指南
 
一、项目基础信息
 
- 项目类型：静态笔记网站（基于Quartz框架，由Markdown文件生成静态HTML）
- 技术栈：
- 核心框架：Quartz（基于Hugo/Node.js的静态站点生成器，开源项目链接：https://github.com/jackyzha0/quartz）
- 版本管理：Git + GitHub
- 部署方式：GitHub Pages（自动部署）
 
二、项目架构说明
 
plaintext
  

quartz-showme/
├─ .github/               # GitHub Actions自动部署配置
│  └─ workflows/
│     └─ deploy.yml       # 部署脚本（自动构建+推送到gh-pages分支）
├─ content/               # 笔记核心目录（所有Markdown笔记存放此处）
├─ quartz/                # Quartz框架核心代码（源自上述开源项目，无需手动修改）
├─ config.toml            # 站点核心配置文件
├─ package.json           # 依赖管理&脚本配置
└─ README.md              # 项目说明
 
 
三、核心配置说明（ config.toml ）
 
修改该文件可自定义站点信息、样式、功能，关键配置项：
 
toml
  

# 站点基础信息
baseURL = "https://juanwang01.github.io/quartz-showme/"  # 网站访问地址
languageCode = "zh-cn"                                   # 语言（中文）
title = "Quartz笔记"                                      # 站点标题

# 导航栏配置
[menu]
  [[menu.main]]
    name = "首页"
    url = "/"
    weight = 1
  [[menu.main]]
    name = "关于"
    url = "/about/"
    weight = 2

# 功能开关
[params]
  enableToc = true          # 开启笔记目录（右侧）
  enableDarkMode = true     # 开启深色模式
  showReadingTime = true    # 显示笔记阅读时长
 
 
四、自动部署配置（ .github/workflows/deploy.yml ）
 
该脚本实现“推送代码后自动构建+部署到GitHub Pages”，核心逻辑（基于Quartz开源项目的默认部署方案）：
 
yaml
  

name: Deploy Quartz Site
on:
  push:
    branches: [ main ]  # 监听main分支推送
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - run: npm ci          # 安装依赖（含Quartz框架依赖）
      - run: npm run build   # 构建静态站点（Quartz框架提供的命令）
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public  # 构建产物目录（推送到gh-pages分支）
 
 
五、本地开发配置
 
1. 依赖安装：
cmd
  

npm install  # 仅首次执行，自动安装Quartz框架及其他依赖
 
2. 本地预览（实时调试）：
cmd
  

npm run preview  # 浏览器打开http://localhost:8080预览（Quartz提供的调试命令）
 
3. 本地构建：
cmd
  

npm run build  # 生成静态文件到public目录（与部署流程一致）
 
 
需要我帮你补充“基于Quartz开源项目扩展功能（如搜索、评论）的配置说明”吗？