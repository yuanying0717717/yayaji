# 芽芽记 · 新生儿健康记录 App

极简新生儿健康记录 PWA：喂奶 / 排便尿布 / 睡眠 / 身体体征 / 用药护理 / 儿保疫苗，本地存储 + 云端备份（GitHub Pages），无广告无社交。

## 在线访问（iOS / 安卓均可）

- **正式地址**：https://yuanying0717717.github.io/yayaji/
- 使用说明：用手机 Safari 打开 → 点「分享」→「添加到主屏幕」即可像原生 App 一样全屏使用，支持离线。

## 功能模块

| 模块 | 说明 |
|---|---|
| 喂养记录 | 母乳（左右侧/时长/拍嗝）、瓶喂（奶量/品牌/水温/剩余）、挤奶 |
| 排便尿布 | 小便/大便、4 种性状、5 种颜色（黑便/血丝提示就医）、红屁股 |
| 睡眠记录 | 开始/醒来双动作计时、白天小睡/夜间睡眠分桶统计 |
| 身体体征 | 体温/体重/身长/头围、黄疸四级观察、湿疹留痕 |
| 用药护理 | 药品联想、维 D/AD 打卡、脐部护理、抚触洗澡 |
| 儿保疫苗 | 内置国家免疫规划疫苗库、剂次自动 +1、接种反应记录 |
| 统计图表 | 日/周/月视图、体重增长曲线、趋势折线图、一键生成就医报告 |
| 导出备份 | CSV（Excel 可开）/ JSON 备份 / 打印版就医报告 |

## 技术栈

纯前端静态站点：HTML + CSS + Vanilla JS + Service Worker（离线优先），数据存于浏览器 localStorage，无后端、无数据上传。

## 本地运行

```bash
# 任意静态服务器即可，例如：
python3 -m http.server 8123
# 或 npx serve .
```

## 更新部署（推送到 GitHub 即可自动生效）

```bash
git add -A
git commit -m "更新说明"
git push origin main
```

GitHub Pages 自动重新构建，约 1-2 分钟后生效。手机端若未更新，请关闭「芽芽记」后重新打开（iOS 的 Service Worker 更新有延迟）。

## 仓库结构

```
├── index.html            # 入口
├── manifest.webmanifest  # PWA 配置（主屏图标/全屏）
├── sw.js                 # Service Worker 离线缓存
├── css/style.css         # 设计系统（浅米白+淡蓝）
├── js/
│   ├── util.js           # 日期/格式化工具
│   ├── store.js          # 数据存储层（localStorage）
│   ├── charts.js         # 图表绘制
│   ├── export.js         # 导出 CSV/JSON/就医报告
│   ├── forms.js          # 表单定义与记录构建
│   ├── views.js          # 各页面视图
│   └── app.js            # 应用入口与路由
└── icons/                # 应用图标
```

## 隐私

所有记录仅保存在手机本地（localStorage），Service Worker 不做任何网络上传；源码开源，可在「设置」中一键删除全部数据。

## 免责声明

本工具为记录辅助，不构成医疗建议；就医请携带报告咨询专业医生。
