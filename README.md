# 生日宇宙

[在线体验](https://xuyu666.github.io/birthday-universe/) · [自动发布记录](https://github.com/xuyu666/birthday-universe/actions/workflows/pages.yml)

手机优先的静态生日礼物：点亮星光 → 三层粒子蛋糕 → 许愿 → 熄烛祝福 → 回忆星球 → 分享。

当前是明确标注的示例礼物。没有用户账号、后端、上传、麦克风或分析埋点。愿望只在本次页面的 React 内存中，重载后清空。

## 本地运行

需要 Node.js 22.12+（本机验证为 24.11.1）。在本目录运行：

```text
npm ci
npm run dev
```

打开终端显示的本地地址。手机访问需要同一局域网，并运行 `npm run dev -- --host 0.0.0.0`，用电脑的局域网 IP 访问。局域网 HTTP 不代表正式 HTTPS 分享已验收。

```text
npm run typecheck
npm run test
npm run lint
npm run build
npm run test:e2e
```

浏览器测试使用已安装 Chrome；Windows 默认检测 `C:/Program Files/Google/Chrome/Application/chrome.exe`。其他位置可通过环境变量 `CHROME_PATH` 指定，不会修改系统浏览器配置。测试会启动并自动关闭 4174/4175 端口的两个独立预览，后者使用明确的示例 canonical 地址检验分享分支。测试地址不是已部署网站。

## 替换为你的生日礼物

- `src/content.ts`：收件人、开场话、祝福、4 条回忆、日期、文字和图片路径。替换完所有示例内容后将 `gift.isDemo` 改为 `false`。
- `public/`：替换回忆照片和音乐，确保有使用许可。无图回忆会显示留白占位，图片失败保留故事文字。
- `public/starlight.wav`：本项目生成的原创短钟琴示例音频，可以替换为授权音乐；`gift.music` 对应文件路径。
- `.env.local`：从 `.env.example` 复制，部署时填写最终 `VITE_CANONICAL_URL=https://你的域名/路径/`，之后重新构建。空值禁用正式分享。程序移除查询参数与锚点，避免携带个人输入或浏览状态。
- `public/share-cover.jpg` 与 `index.html`：静态分享封面、标题与描述。有效 canonical 配置会在构建时补齐绝对封面地址、og:url 与 canonical。

正式部署只需将 `dist/` 发布到支持 HTTPS 的静态托管服务。GitHub Pages 发布由 `.github/workflows/pages.yml` 管理：推送 main 后自动检查、构建并部署。微信朋友圈卡片和真实手机浏览器仍需在最终公网地址单独验收。

## 实现与降级

React + Vite + TypeScript、Tailwind v4、Motion、Three.js / React Three Fiber / Drei。3D 动态导入，一个 Canvas 在仪式场景间复用。首屏不等待 3D、音乐或照片；3D 失败与 context lost 自动显示 SVG 蛋糕，已有愿望不丢失。

粒子默认 800，DPR 最高 1.5；连续两个 5 秒窗口低于 25fps 时降为 300 粒子与 DPR 1；再次连续慢窗口则静态降级，本次会话不回升。减少动态或页面隐藏/弹窗打开时按需渲染。回忆星球使用有语义的 DOM 按钮和连续旋转拖动，位移超过 8px 不点击，可从文字列表打开。原生 dialog 管理焦点与 Escape 返回。

分享按系统分享 → 复制链接 → 手动选中链接降级。取消系统分享保留当前场景。本地预览未填写公网地址时显示待部署提示。

## 素材与验证

星球纹理由 `scripts/prepare-planets.mjs` 程序化生成，网站不再使用玫瑰素材。`scripts/prepare-assets.mjs` 可重建音频、星球纹理、回忆插画和分享封面，字体下载需要联网；已保存的字体可直接离线构建。新增中文标题时需重新扩展字体子集文字，缺失字形仍使用系统宋体。

完整证据、截图、性能环境与兼容性限制见 `../网站示意图/.omo/evidence/verification-report.md`。参考图未被嵌入网站，不包含原图水印、系统状态栏或照片查看器。

## 星球动效调整（2026-10-24）

星球采用独立椭圆轨道、远近缩放、连续自转与统一光照。水平拖动跟手，支持连续转动，松开带短暂惯性；左右按钮每次转向 60°，可重置视角；纵向触摸保留页面滚动。鼠标靠近或键盘聚焦时暂停，打开详情、页面隐藏时暂停并保留相位；减少动态关闭自主运动，但仍可主动拖动和点击转向。旋转和连续位置使用 MotionValue，不逐帧更新 React state。详细验证在 `../网站示意图/.omo/evidence/orbit-refinement/`。

## 蓄气吹蜡烛（2026-10-24）

按住按钮蓄气，松开吹出；不足 0.6 秒吹灭一支，0.6–1.2 秒吹灭两支，蓄满 1.2 秒吹灭全部剩余蜡烛。蓄气条、烛火倾斜和轻风响应操作；移出按钮后松开、Escape、失焦或切后台均取消本次蓄气。键盘可按住空格/回车操作，保留直接吹灭入口。无需麦克风。减少动态仍可完成仪式。验证见 `../网站示意图/.omo/evidence/controls-and-breath/`。

## GitHub Pages 发布

仓库 Settings → Pages 的 Source 使用 GitHub Actions。工作流从 Pages 配置自动取得公开网址，将其用于静态分享元数据和应用分享按钮，支持仓库子路径。每次推送 main 自动发布，也可以从 Actions 手动运行。仅发布构建后的 dist，源码不包含 node_modules、开发原图、测试产物或本地环境变量。
