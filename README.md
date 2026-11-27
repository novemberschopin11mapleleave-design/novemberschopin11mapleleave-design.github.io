# 张文昕 · AI Agent Portfolio 2026

四章式单页作品集：**暗色 Agent 控制台 + 浅色作品集档案**。视觉上把参考图的纸感编辑排版，和另一版参考里的终端 / 状态标签 / 霓虹紫 / 扫描线结合起来；全站手写 HTML / CSS / JS，无构建步骤。

> 定位：**AI Agent 开发实习**。当前证据是 AI 应用前端原型与公开的 Agent Skill 规范；尚未实现生产级 Agent、LLM 服务、RAG 或自动评分。

---

## 一、页面结构

| 章节 | 内容 |
| --- | --- |
| `01 / Cover` | 张文昕 / Wenxin Zhang；HKUST 应用数学二年级；暗色启动页 + 个人状态终端 |
| `02 / Focus` | Agent / Skill 工作流、模型约束与可验证输出、AI 辅助产品工程；当前能力边界 |
| `03 / Work` | DSE Writing Lab 的可交互规则批改页（iframe 实时演示，无 LLM）；DSE Writing Polish 公开 Skill（代码仓库预览） |
| `04 / Contribute` | Workflow / Constraint / Prototype 三项贡献；加入 Agent 团队的前 90 天；联系方式 |

**DSE Writing Lab 不再使用截图或演示动画**：项目区嵌入了 `demo/writing-lab/marking.html`，可以直接在框内编辑作文、切换文体 / 批改强度、查看改写与批注、复制改写版。它是独立页面，父页面没有向 iframe 发送消息，也不依赖 iframe 的状态；两边互不通信。

页面里所有涉及模型状态的地方都明确标注了「规则版」「示例数据」「NO LLM」，没有把静态前端写成已接入 LLM 的 Agent 系统。

---

## 二、文件

```text
portfolio/
├─ index.html
├─ assets/
│  ├─ styles.css
│  ├─ script.js
│  ├─ favicon.svg
│  └─ og-image.jpg             # 1200×630 社交分享图
├─ demo/
│  └─ writing-lab/
│     ├─ marking.html          # 嵌入的规则批改页
│     └─ assets/
│        ├─ styles.css
│        ├─ marking.css
│        ├─ embed.css          # 作品集内的紧凑布局
│        ├─ marking-data.js
│        └─ marking.js         # AI 调用已关闭，仅保留规则版
├─ preview/
│  ├─ desktop.png
│  ├─ mobile.png
│  └─ demo.png                 # 嵌入的规则批改页截图
├─ README.md
└─ .nojekyll
```

---

## 三、本地预览

直接双击 `index.html`。或者：

```powershell
cd portfolio
python -m http.server 8000
# http://127.0.0.1:8000
```

`iframe` 需要本地服务器或 GitHub Pages；直接双击 `file://` 时，某些浏览器会限制 iframe 内的页面加载。

---

## 四、项目口径（重要）

### DSE Writing Lab

- **真实状态：** 规则批改前端；核心交互可运行；批改页是示例文本；**没有调用 LLM，没有独立线上部署**。
- **演示方式：** `demo/writing-lab/marking.html` 是实际规则引擎页，嵌入在作品集里；编辑左侧作文会实时更新改写、批注和替换词。
- **可写的：** 产品流程拆解、多栏界面、文体 / 强度切换、替换词、词库与本地存储、AI Coding Agent 协作开发。
- **不要写：** 已接入 LLM、已部署 Agent、真实 AI 批改、DeepSeek 服务、用户量 / 准确率。

### DSE Writing Polish

- **真实状态：** 公开的 Skill / Prompt 指令与工作流定义；可被 Claude Code / Codex 等兼容 harness 加载；**不是运行时 Agent 服务，不提供评分**。
- **可写的：** Skill 工作流、行为边界、保留原意、语境化词汇建议、文体覆盖、GitHub 交付。
- **不要写：** 自主 Agent、自动评分、HKEAA 官方评分、生产环境调用量。

项目和面试口径的完整版本见：[简历-AI-Agent-项目表述.md](../简历-AI-Agent-项目表述.md)。

> 现有 `张文昕_简历_v10.html` 仍保留旧版「LLM 写作批改平台 / 接入 DeepSeek」表述，和当前事实不一致。投递前请用上面的新版本替换，不要直接投 v10。

---

## 五、上线前改三处

### 1. OG 图的绝对地址

```html
<meta property="og:image" content="assets/og-image.jpg">
```

部署后改成绝对地址：

```html
<meta property="og:image" content="https://你的域名/assets/og-image.jpg">
```

### 2. 项目链接

- 规则批改演示：`demo/writing-lab/marking.html`
- Skill 仓库：<https://github.com/novemberschopin11mapleleave-design/dse-writing-polish-skill>

如果之后把 DSE Writing Lab 的独立部署地址公开，更新项目卡片的「打开完整演示」链接。**在真实接入 LLM 之前，不要改掉 `NO LLM` / `RULE-BASED` 标签，也不要在 `marking.js` 里恢复 AI 调用。**

### 3. 简历

当前写的是「完整简历可邮件索取」，没有放 PDF。原因是旧简历含手机号。若要公开下载：

1. 删掉手机号 / 微信 / 私人邮箱；
2. 另存为 `assets/resume.pdf`；
3. 把「索取简历」按钮改成下载。

---

## 六、替换演示内容

演示页的初始作文在 `demo/writing-lab/assets/marking-data.js`：

```js
window.WL_MARKING = {
  sample: `...`
};
```

修改这段文本即可替换演示篇章。规则在 `demo/writing-lab/assets/marking.js` 的 `GRAMMAR` / `VOCAB` / `STYLE_RULES` 中；改完后刷新页面即可验证。

如果需要换成另一个独立页面，替换 `index.html` 里的 iframe `src`，并同步改文案里的「规则版 / 无 LLM」状态。**不要用 iframe 嵌一个会调用付费 API 的页面作为公开作品集演示**，否则访问者会消耗你的额度。

---

## 七、部署到 GitHub Pages

### 方案 A：个人主页（推荐）

仓库名必须是 `<你的用户名>.github.io`。

1. 新建 Public 仓库 `novemberschopin11mapleleave-design.github.io`；
2. 把 `portfolio/` **里面的内容**上传到仓库根目录（包括 `demo/`）；
3. `Settings → Pages`；
4. Source 选 `Deploy from a branch`，Branch `main`，目录 `/ (root)`；
5. 等 1–2 分钟，访问 `https://novemberschopin11mapleleave-design.github.io`。

### 方案 B：项目页

新建仓库 `portfolio`，上传 `portfolio/` 里的内容；Pages 设置同上；地址为 `https://你的用户名.github.io/portfolio/`。

### 命令行

```powershell
cd portfolio
git init -b main
git add .
git commit -m "Portfolio 2026 — AI Agent"
git remote add origin https://github.com/novemberschopin11mapleleave-design/portfolio.git
git push -u origin main
```

`.nojekyll` 已放在根目录，确保 `assets/` 和 `demo/` 原样发布。

---

## 八、技术说明

- 原生 HTML / CSS / JS；运行时无依赖（Google Fonts 除外）
- 暗色封面 + 浅色 dossier + 暗色项目工作台 / 联系区
- DSE Writing Lab 通过同源 `iframe` 嵌入独立页面；父页面不向 iframe 发消息，也不读取其状态
- 嵌入页关闭了 AI 探测与 AI 请求；`AI_AVAILABLE = false`，只跑本地规则
- 桌面端固定左侧状态轨道；≤960px 切换为顶部导航
- 原生 `<dialog>` 项目说明；支持 Esc、遮罩关闭、焦点返回
- `prefers-reduced-motion` 下关闭轨道旋转、光标闪烁、过渡与动效
- 图片有 `alt`；导航有 `aria-current`；项目按钮有 `aria-haspopup`
- 已在 1440×1000、1024×768、768×900、390×844 下检查，无横向溢出；嵌入页可直接编辑并实时更新
- 桌面 / 手机预览见 `preview/desktop.png`、`preview/mobile.png`；嵌入页预览见 `preview/demo.png`

字体：Bodoni Moda（英文衬线）、Manrope（英文无衬线）、Noto Serif SC（中文标题）、IBM Plex Mono（终端 / 状态 / 代码）。Demo 页使用 Inter / 系统字体。如果目标读者主要在中国大陆、Google Fonts 不稳定，可以换成系统字体；CSS 里已写好 fallback。
