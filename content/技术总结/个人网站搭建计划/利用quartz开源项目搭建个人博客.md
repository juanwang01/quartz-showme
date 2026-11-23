---
title: 利用quartz开源项目搭建个人博客
description: 个人站点 longbatian.site 的当前架构与维护总览——Quartz 渲染、坚果云同步、服务器钩子构建、GitHub Pages 发布、Cloudflare R2 图床。
date: 2026-06-13
updated: 2026-11-23
tags:
  - 技术总结
  - 个人网站
  - Quartz
  - 坚果云
  - 自动化
status: active
aliases:
  - 个人网站总览
  - 网站搭建概览
---

# 利用 Quartz 开源项目搭建个人博客

核心还是那句话：用 [Quartz](https://quartz.jzhao.xyz/) 把 Markdown 渲染成静态网页，托管在 GitHub Pages 上。

但**同步和发布的方式已经换代了**：以前是「各端 git 推拉 + 服务器定时拉取仓库」，现在是「坚果云全平台同步 → 服务器检测到变化后自动构建 → 推送静态产物 → GitHub Pages 发布」。写东西的人只需要写，剩下的全自动。

- 线上站点：<https://longbatian.site>
- 图床域名：`img.longbatian.site`（Cloudflare R2）

## 现在的架构

```text
手机 / 电脑 Obsidian  ←── 坚果云全平台同步（唯一内容源）
                                │ 服务器每 5 分钟 rclone bisync 检测
                                ▼
                         /srv/nutstore 仓库镜像
                                │ rsync 单向镜像
                                ▼
                         Quartz content/  ── git 提交、推送 main
                                │ node quartz/bootstrap-cli.mjs build
                                ▼
                         public/ 静态站点 ── rsync 到 gh-pages worktree
                                │ push gh-pages
                                ▼
                         GitHub Pages ──▶ https://longbatian.site

图片旁路：电脑端上传 Cloudflare R2（img.longbatian.site），笔记里写绝对直链
```

## 三端各管什么

| 位置 | 你要做的事 | 不需要做的事 |
|---|---|---|
| 手机 | 写笔记、改笔记、用插件内置 AI 整理文本 | 装 Termux、跑 git、配 SSH、构建、发布 |
| 电脑 | 精修长文、**上传图片到 R2 图床**、批量整理结构与链接 | 手动 git push 内容、手动构建 |
| 服务器（只跑到 2027-09-12） | 全自动：同步检测、构建、发布、失败告警 | 手工编辑（`content/` 会被同步覆盖） |

## 技术栈

| 环节 | 用的东西 |
|---|---|
| 写作 | Obsidian（手机 / 电脑 / 平板） |
| 内容同步 | 坚果云（WebDAV），全平台自动同步 |
| 站点渲染 | Quartz v4，自定义域名 + `zh-CN` locale |
| 自动构建 | 服务器 Ubuntu 24.04 + rclone bisync + systemd timer（5 分钟） |
| 发布 | 构建产物推 `gh-pages` 分支，GitHub Pages 自动上线 |
| 图片 | Cloudflare R2 + CDN（`img.longbatian.site`） |
| 故障告警 | 服务器 SMTP 邮件通知 |

## 从写作到上线要多久

| 阶段 | 耗时 |
|---|---|
| 手机保存 → 坚果云上传 | 秒级 |
| 服务器检测到变化（定时器） | 最多 5 分钟 |
| 镜像 + 提交 + Quartz 构建 | 约 30–60 秒 |
| 推 gh-pages + Pages 生效 | 约 10–60 秒 |

所以：**保存后一般 1–3 分钟能在线上看到，最坏 5 分钟多一点**。

## 文档导航

- [[手机端更新维护说明]] —— 手机上只写；顺带怎么用插件里的 AI
- [[电脑端更新维护说明]] —— 电脑端精修 + 图片上传流程
- [[R2图床与图片上传说明]] —— 图床路径约定、引用写法、上传与排错
- [[网站架构与发布管线]] —— 服务器端完整链路、故障处理、常用命令、退役计划
- [[Quartz网站优化路线图]] —— 还没有做完的优化清单

## 已经废弃的旧做法

下面这些是老架构的产物，**不要再照着做**，会制造冲突：

- ❌ 手机端 Termux + `git pull` / `git push` 维护笔记
- ❌ 电脑端把 `ShowMe/quartz/content` 当作写作目录，用 CMD 脚本 `git checkout origin/main -- content/`
- ❌ 手动在服务器上改 `content/`（下一次同步会被 `rsync --delete` 覆盖）
- ❌ 把本地图片直接塞进仓库（现在统一走 R2 图床）
- ❌ 依赖仓库里的 GitHub Actions 来构建发布（构建已经挪到服务器，产物由服务器推 `gh-pages`）

## 为什么改成现在这样

1. **手机端能真正只写作**：Termux 那套要开终端、要网络、要处理 SSH，写一篇笔记的摩擦比写作本身还大。
2. **单一内容源**：坚果云是唯一的真相来源，服务器上的 `content/` 只是构建镜像，不存在「哪一端落后了」的问题。
3. **发布不依赖人的记性**：不需要记得 push，不需要记得构建，忘记一切也能上线。
4. **图片不拖累仓库**：415 张易学插图搬去 R2 后，仓库和构建都轻了，页面加载也快。
5. **失败会喊人**：同步失败、构建失败、发布失败都会发邮件，而不是静悄悄地上线一个坏版本。

## 演进简史

| 时间 | 状态 |
|---|---|
| 2026-06 | 最早方案：Quartz 4 渲染 + 各端 git 推拉 + 服务器定时拉取仓库 |
| 2026-11-16 | 换成「坚果云同步 + 服务器钩子构建 + 推 gh-pages」，手机端退出运维 |
| 2026-11-22 | 415 张插图 + 总架构图迁到 Cloudflare R2，本地图片删除 |
| 2026-11-23 | 本文件夹文档整体重写为现状说明 |

老方案现在只剩「Quartz 渲染静态站」这一点还在用，同步层和发布层已经整体替换。细节见 [[网站架构与发布管线]] 的变更记录。

## 知识系统数据连路（旧图）

![](https://raw.gitcode.com/qq_57305183/PicGo/raw/main/d376e315b1f36cb178d6d7fa0cf00bbe.png)

![](https://raw.gitcode.com/qq_57305183/PicGo/raw/main/a284882aa04a19fb44be49e25a46c102.png)

（这两张是早期画的连路图，仍指向旧的 GitCode 图床；有空再重画或迁到 `img.longbatian.site`。）
