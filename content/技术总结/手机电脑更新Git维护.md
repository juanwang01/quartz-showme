---
title: 手机电脑更新Git维护
---

# 手机

``
```
# 1. 进入仓库目录（必选，每次打开Termux都要执行）
cd ~/storage/documents/quartz-showme

# 2. 编辑完笔记后，提交+推送
git add .
git commit -m "手机端测试更新"
git push origin main


```
## 1. 进入仓库目录（必选，每次打开Termux都要执行）
cd ~/storage/documents/quartz-showme

## 2. 编辑前拉取最新内容（避免冲突）
git pull origin main

## 3. 编辑完笔记后，提交+推送
git add .
git commit -m "Android端更新笔记 $(date +%Y-%m-%d_%H:%M)"
git push origin main
