# 简资 Assetly

> 极简本地化的个人资产管理工具

![简资 Assetly](./assets/icon.png)

## 📌 产品概述

简资（Assetly）是一款极简本地化的个人资产管理工具，旨在帮助用户随时记录和查看当前的资产状况（如存款、房产、车辆、股票等）。所有数据本地存储，隐私优先，可作为浏览器插件使用。

## ✨ 主要特性

- 🔒 **隐私优先**：所有数据仅存储在本地浏览器中，无服务器通信
- 📊 **直观展示**：支持饼图展示资产分布，分类汇总统计
- 🏷️ **分类管理**：支持现金、存款、房产、车辆、基金、股票等多种资产类别
- 🤖 **AI 智能估值**：集成 DeepSeek API，智能估算资产残值
- 📸 **智能识别**：支持拍照识别资产信息，自动填充表单
- 📱 **响应式设计**：适配桌面端和移动端
- 💾 **数据备份**：支持JSON格式的数据导入导出
- 📤 **分享功能**：支持生成精美的资产报告图片
- ⚡ **快速操作**：简洁的添加、编辑、删除资产流程

## 🛠️ 技术栈

- **前端框架**：React 19 + TypeScript
- **构建工具**：WXT (Web Extension Toolkit)
- **包管理器**：pnpm
- **UI 库**：Tailwind CSS 4.0 + shadcn/ui
- **状态管理**：Zustand
- **图表库**：Recharts
- **AI 集成**：DeepSeek API
- **OCR 识别**：Tesseract.js
- **本地存储**：Chrome Extension Storage API

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动开发服务器
pnpm dev

# 针对特定浏览器开发
pnpm dev:chrome
pnpm dev:firefox
pnpm dev:edge
```

### 构建生产版本

```bash
# 构建所有浏览器版本
pnpm build

# 构建特定浏览器版本
pnpm build:chrome
pnpm build:firefox
pnpm build:edge
```

### 打包扩展

```bash
# 打包所有浏览器版本
pnpm zip

# 打包特定浏览器版本
pnpm zip:chrome
pnpm zip:firefox
pnpm zip:edge
```

## 📱 安装使用

### Chrome 浏览器安装

1. 下载最新版本的 `.zip` 文件
2. 解压到本地文件夹
3. 打开 Chrome 扩展管理页面：`chrome://extensions/`
4. 开启"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择解压后的文件夹
7. 点击扩展图标或使用侧边栏打开简资

### 主要功能

#### 1. 资产管理
- **添加资产**：点击"添加资产"按钮，填写资产信息
- **智能识别**：使用拍照功能自动识别资产信息
- **AI 估值**：点击"AI 估值"按钮智能估算资产残值
- **编辑资产**：点击资产项的编辑按钮
- **删除资产**：点击删除按钮，确认后删除

#### 2. 数据展示
- **总览页面**：按类别展示所有资产，支持折叠/展开
- **图表页面**：饼图展示资产分布，分类汇总统计
- **排序功能**：支持按金额或时间排序

#### 3. 数据管理
- **导出数据**：将资产数据导出为JSON文件
- **导入数据**：从JSON文件导入资产数据
- **分享报告**：生成精美的资产报告图片
- **清空数据**：清空所有资产记录（需二次确认）

#### 4. 设置配置
- **DeepSeek API**：配置 AI 估值服务的 API 密钥
- **主题设置**：支持浅色/深色主题切换

## 📊 数据结构

```typescript
interface AssetItem {
  id: string;
  name: string;
  category: '现金' | '存款' | '房产' | '车辆' | '基金' | '股票' | '其他';
  amount: number;
  currentValue?: number; // 当前估值/残值
  purchaseDate?: string; // 购买日期
  remark?: string;
  createdAt: string; // ISO 格式时间戳
}
```

## 🔧 开发指南

### 项目结构

```
assetly/
├── components/           # UI组件
│   ├── ui/              # 基础UI组件
│   ├── AssetModal.tsx   # 资产添加/编辑模态框
│   ├── AssetList.tsx    # 资产列表组件
│   ├── AssetChart.tsx   # 资产图表组件
│   ├── AssetShare.tsx   # 资产分享组件
│   ├── SmartCapture.tsx # 智能识别组件
│   └── SettingsPanel.tsx # 设置面板组件
├── entrypoints/         # 入口文件
│   ├── background.ts    # 后台脚本
│   ├── content.ts       # 内容脚本
│   └── sidepanel/       # 侧边栏页面
├── stores/              # 状态管理
│   └── asset-store.ts   # 资产数据store
├── types/               # 类型定义
│   └── asset.ts         # 资产相关类型
├── utils/               # 工具函数
│   ├── ai-value-estimation.ts # AI 估值
│   ├── ai-analysis.ts   # AI 分析
│   └── ocr.ts          # OCR 识别
└── hooks/               # React Hooks
    ├── use-settings.ts  # 设置管理
    └── use-theme.ts     # 主题管理
```

### 添加新功能

1. 在 `types/` 中定义相关类型
2. 在 `stores/` 中添加状态管理逻辑
3. 在 `components/` 中创建UI组件
4. 在主应用中集成新功能

## 🔒 隐私与安全

- ✅ 所有数据仅存储在用户本地浏览器中
- ✅ AI 估值功能需要用户主动配置 API 密钥
- ✅ 无服务器通信，无数据上传（除 AI 估值请求）
- ✅ 支持数据导出备份
- ✅ 开源透明，可审计代码

## 🎯 核心优势

1. **极简设计**：专注核心功能，界面简洁易用
2. **本地优先**：数据安全，隐私保护
3. **智能化**：AI 辅助估值，OCR 智能识别
4. **跨平台**：支持主流浏览器，响应式设计
5. **开源免费**：完全开源，持续更新

## 📋 版本规划

### v0.1.0 (当前版本)
- ✅ 基础资产管理功能
- ✅ 数据可视化展示
- ✅ AI 智能估值
- ✅ 智能识别功能
- ✅ 分享报告功能

### v0.2.0 (计划中)
- [ ] 负债记录（房贷、信用卡等）
- [ ] 净资产计算
- [ ] 历史资产变动趋势图
- [ ] 深色模式优化
- [ ] 多语言支持

### v0.3.0 (未来版本)
- [ ] PWA 支持
- [ ] 数据同步功能
- [ ] 更多 AI 功能
- [ ] 移动端原生应用

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📞 联系方式

- **GitHub Issues**：[提交问题](https://github.com/your-username/assetly/issues)
- **Email**：your-email@example.com

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢以下开源项目的支持：
- [WXT](https://wxt.dev/) - 现代化的浏览器扩展开发框架
- [React](https://react.dev/) - 用户界面构建库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [shadcn/ui](https://ui.shadcn.com/) - 精美的 React 组件库
- [DeepSeek](https://www.deepseek.com/) - AI 智能服务提供商

---

**简资 Assetly** - 让资产管理变得简单而智能 🚀

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动开发服务器
pnpm dev

# 针对特定浏览器开发
pnpm dev:chrome
pnpm dev:firefox
pnpm dev:edge
```

### 构建生产版本

```bash
# 构建所有浏览器版本
pnpm build

# 构建特定浏览器版本
pnpm build:chrome
pnpm build:firefox
pnpm build:edge
```

### 打包扩展

```bash
# 打包所有浏览器版本
pnpm zip

# 打包特定浏览器版本
pnpm zip:chrome
pnpm zip:firefox
pnpm zip:edge
```

## 📱 使用方法

### 作为浏览器扩展使用

1. 构建扩展：`pnpm build:chrome`
2. 打开 Chrome 扩展管理页面：`chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `.output/chrome-mv3` 文件夹
6. 点击扩展图标或使用侧边栏打开简资

### 主要功能

#### 1. 资产管理
- **添加资产**：点击"添加资产"按钮，填写资产信息
- **编辑资产**：点击资产项的编辑按钮
- **删除资产**：点击删除按钮，确认后删除

#### 2. 数据展示
- **总览页面**：按类别展示所有资产，支持折叠/展开
- **图表页面**：饼图展示资产分布，分类汇总统计
- **排序功能**：支持按金额或时间排序

#### 3. 数据管理
- **导出数据**：将资产数据导出为JSON文件
- **导入数据**：从JSON文件导入资产数据
- **清空数据**：清空所有资产记录（需二次确认）

## 📊 数据结构

```typescript
interface AssetItem {
  id: string;
  name: string;
  category: '现金' | '存款' | '房产' | '车辆' | '基金' | '股票' | '其他';
  amount: number;
  remark?: string;
  createdAt: string; // ISO 格式时间戳
}
```

## 🔧 开发指南

### 项目结构

```
assetly/
├── components/           # UI组件
│   ├── ui/              # 基础UI组件
│   ├── AssetModal.tsx   # 资产添加/编辑模态框
│   ├── AssetList.tsx    # 资产列表组件
│   ├── AssetChart.tsx   # 资产图表组件
│   └── SettingsPanel.tsx # 设置面板组件
├── entrypoints/         # 入口文件
│   ├── background.ts    # 后台脚本
│   ├── content.ts       # 内容脚本
│   └── sidepanel/       # 侧边栏页面
├── stores/              # 状态管理
│   └── asset-store.ts   # 资产数据store
├── types/               # 类型定义
│   └── asset.ts         # 资产相关类型
└── utils/               # 工具函数
```

### 添加新功能

1. 在 `types/` 中定义相关类型
2. 在 `stores/` 中添加状态管理逻辑
3. 在 `components/` 中创建UI组件
4. 在主应用中集成新功能

## 🔒 隐私与安全

- ✅ 所有数据仅存储在用户本地浏览器中
- ✅ 无服务器通信，无数据上传
- ✅ 支持数据导出备份
- ✅ 开源透明，可审计代码

## 📋 待实现功能

- [ ] 负债记录（房贷、信用卡等）
- [ ] 净资产计算
- [ ] 历史资产变动趋势图
- [ ] PWA 支持
- [ ] 深色模式
- [ ] 多语言支持

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👨‍💻 作者

- **olvvlo** - 初始开发

---

**简资 Assetly** - 让资产管理变得简单而安全 🚀
