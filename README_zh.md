# The Pensieve - 冥想盆 🌌

[English](./README.md) | [中文](./README_zh.md)

*捕捉你的思绪，看它化作一段记忆。*

**The Pensieve**（冥想盆）是一个沉浸式、充满魔法属性的 Web 应用程序，灵感来源于哈利波特宇宙。它允许用户储存、润色和重温他们的思绪与经历。本应用专注于电影级别的动效设计、流体物理模拟以及由 AI 驱动的文本润色功能。

---

## ✨ 核心功能

*   **交互式液体盆 (HTML5 Canvas)：** 高度定制、高性能的流体模拟。在冥想盆上方悬停会产生有机的波纹、微妙的水下焦散效果（光斑），以及在水面下扩散下沉的灰白色记忆墨迹。
*   **AI 记忆润色功能：** 在“添加记忆”面板中说出或输入你原始的思绪。应用程序通过安全的后端利用 **Google Gemini Pro** 模型自动清理口语废话（例如 "嗯"、"那个"、"就是"），梳理句子逻辑结构，并提炼出一个简练且极具诗意的短语作为该记忆的标题。
*   **沉浸式“潜入”动画：** 选择一段记忆会触发电影般的 GSAP 动画时间线。冥想盆中的液体扩散，记忆的标题开始发光，屏幕无缝过渡，让用户“潜入”这段记忆之中。
*   **魔法自定义光标：** 全局替换为 SVG 魔杖光标。当光标悬停在可点击元素上时，魔杖顶端会优雅地发出微光，仿佛成了你专属的魔杖。
*   **记忆存档与本地存储：** 在每个记忆的“温暖”（金色光环）和“清冷”（银蓝色光环）两种情感共鸣之间切换。用户可以上传自定义图片、删除预设的传奇记忆，并将所有数据妥善储存在本地。

## 🛠️ 技术栈与安全架构

本项目采用了全栈的 **Express + Vite (React)** 架构，以确保像 Gemini API Key 这样关键的安全密钥能被安全地隐藏，不暴露给浏览器。

*   **后端服务器：** Express.js (`server.ts`) 安全地代理和处理所有 AI 生成请求。
*   **前端框架：** React 19 + Vite + TypeScript (在开发环境下与 Express 无缝运行，在生产环境下可完美打包打包)。
*   **生成式 AI：** `@google/genai` (仅在服务端执行)
*   **动画库：** GSAP
*   **样式库：** Tailwind CSS

## 🚀 快速开始与配置

按照以下说明在本地克隆本仓库、配置你的私有 AI 模型密钥，并启动这段魔法之旅。

### 1. 环境依赖
*   **Node.js** (推荐 v18 或更高版本)
*   **Git**

### 2. 获取 AI 模型的 API Key (Gemini, Kimi, DeepSeek 等)
为了驱动“记忆润色”（文本清理和提炼标题）功能，你需要一个 AI 模型的 API Key。

默认情况下，本应用被配置为使用 **Google Gemini**，但同时也内置了对所有主流 OpenAI 接口格式的大模型支持。

**选项 A: Google Gemini（默认支持，有免费额度）**
1. 前往 [Google AI Studio](https://aistudio.google.com/app/apikey)。
2. 登录并点击 **"Create API Key"** 按钮。
3. 复制生成的密钥。

**选项 B: 备用 AI 模型支持（兼容 Kimi, DeepSeek, 智谱, MiniMax, ChatGPT）**
如果你不想使用默认的 Gemini 模型，冥想盆也内置了针对各大主流 OpenAI 兼容平台的配置代码块：

1.  打开 `/server.ts` 文件。
2.  找到 **"AI Provider Configuration"**（AI 模型配置）区域。
3.  注释掉默认的 `GoogleGenAI` 初始化代码。
4.  取消注释你想使用的模型平台对应的配置模块 (例如：Kimi, DeepSeek, 智谱, MiniMax, 或 ChatGPT)。
5.  在你的 `.env` 文件中，添加对应平台的 `API_KEY`，例如：`DEEPSEEK_API_KEY=你的密钥`。
6.  *提示:* 你还需要在 `/api/polish` 路由内部更新生成文本的方法调用逻辑，将其改为使用 `openaiClient.chat.completions.create(...)` 语法风格以对接 OpenAI 格式接口。

### 3. 克隆并安装
将此仓库克隆到你的本地电脑：
```bash
git clone https://github.com/your-username/the-pensieve.git
cd the-pensieve
npm install
```

### 4. 设置环境变量
在项目根目录下，创建一个名为 `.env` 的新文件（或者复制项目提供的 `.env.example` 文件并重命名为 `.env`）。

> ⚠️ **重要提示：** 请确保它的名字严格叫做 `.env`。绝对不要把这个文件提交到你的 GitHub 仓库中！项目中默认的 `.gitignore` 配置会自动阻止这一行为。

打开 `.env` 文件并将你申请到的 API 密钥粘贴进去，如下所示：
```env
GEMINI_API_KEY=你的实际_api_key_放在这里
```

### 5. 启动应用
得益于集成好的 Express + Vite 项目配置，执行下方这一条命令就可以同时启动前后端：
```bash
npm run dev
```
打开浏览器并访问 `http://localhost:3000` 即可将自己沉入冥想盆中！

### 6. 生产环境部署
如果想将该应用公开发布，由于需要安全的 Node.js 后端，纯静态托管服务（如 Vercel static 或 GitHub Pages）将无法正常工作。

*   请将其部署到一个支持运行全栈 Node.js 容器的云平台上，如 **Render, Railway, Heroku**，或是 **Google Cloud Run**。
*   在平台的设置面板中找到 **"Environment Variables"** 或 **"Config Vars"** 选项。
*   添加环境变量 `GEMINI_API_KEY`，并将你的 API 密钥值粘贴进去。
*   将 Build（打包）命令设为 `npm run build`，Start（启动）命令设为 `npm start`。

---

## 🛡️ 安全架构更新日志

在最初的版本中，`GEMINI_API_KEY` 原本在 React 客户端被直接调用，这会导致密钥被开发者工具监听到从而造成极大的泄露风险。

**现在该架构已经得到了全面重组。** React 前端页面现在只会向自身发出内部请求至 `/api/polish` 接口，而新建的 `server.ts` Express 后端接管了所有的密钥和 `@google/genai` 逻辑。你可以安心地将该仓库部署到各类 Node.js 服务器中，在浏览器端不会留有任何私有 API Key 的痕迹。
