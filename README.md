# Chat Studio

<div align="center">
<img width="1200" height="475" alt="Chat Studio Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## 项目简介

Chat Studio 是一款基于 React 19 和 Vite 构建的现代化 AI 对话客户端。它提供了简洁、流畅的用户体验，并整合了多种先进的 AI 模型提供商（如 Google Gemini 和 OpenAI）。本项目旨在为用户提供一个高度可定制、本地化友好且功能丰富的 AI 对话工作台。

## 主要特性

- 🚀 **多模型支持**：原生支持 Google Gemini 系列模型，并兼容 OpenAI 标准的 API。
- 🤖 **智能标题生成**：支持自定义模型用于生成对话标题。生成逻辑已深度优化，能够根据对话内容自动识别语言并生成对应语言的标题。
- 🌏 **深度本地化**：全界面中文化，包括所有的通知消息、工具提示和状态反馈，提供一致的母语使用体验。
- 📎 **多媒体交互**：支持在对话中上传或粘贴图片、音频、视频及文本文件作为上下文。
- 📄 **本地文档支持**：允许上传本地文档，并将其内容作为对话的大背景。
- 🏷️ **预设管理**：内置灵活的 Prompt 预设系统，方便用户快速切换不同的 AI 角色或任务场景。
- 🌓 **个性化设计**：支持暗色和亮色模式切换，交互元素均经过精心打磨，符合现代审美。
- 🛡️ **安全与隐私**：API Key 等敏感信息仅保存在本地浏览器中，确保数据安全。

## 技术栈

- **框架**: [React 19](https://react.dev/)
- **构建工具**: [Vite 6](https://vitejs.dev/)
- **状态管理**: [Jotai](https://jotai.org/) (原子化状态管理)
- **样式**: Vanilla CSS + [Tailwind CSS](https://tailwindcss.com/)
- **组件库**: [Material Web](https://material-web.dev/)
- **API 交互**: [@google/genai](https://www.npmjs.com/package/@google/genai)

## 本地开发

### 前提条件

- [Node.js](https://nodejs.org/) (建议使用 LTS 版本)

### 运行步骤

1.  **克隆项目**:
    ```bash
    git clone [repository-url]
    cd chat-studio
    ```

2.  **安装依赖**:
    ```bash
    npm install
    ```

3.  **配置 API Key**:
    打开应用后，点击侧边栏的“管理模型”图标，添加您的模型提供商（如 Google Gemini）并填写对应的 API Key。

4.  **启动开发服务器**:
    ```bash
    npm run dev
    ```
    应用默认运行在 `http://localhost:3000/`。

## 最近更新

- ✅ **全面中文化**: 翻译了所有的通知提示（如复制成功、导入导出反馈等）及 UI 标签。
- ✅ **标题生成优化**: 修复了标题生成模型的路由问题，并支持了语言自适应生成。
- ✅ **UI 视觉统一**: 优化了设置界面的下拉列表样式，使其具备与其他组件一致的圆角设计。

---

*由 Antigravity 强力驱动开发*
