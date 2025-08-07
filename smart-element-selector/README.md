# Smart Element Selector

一个智能的网页元素选择器，支持可视化选择、截图捕获和元素信息提取。

## 特性

- 🎯 **可视化元素选择** - 鼠标悬停高亮显示页面元素
- 📸 **智能截图捕获** - 使用 html2canvas 精确捕获选中元素
- 📊 **详细元素信息** - 提取标签名、类名、ID、文本内容等
- ⚛️ **React Hook 支持** - 提供易用的 React Hook
- 🎨 **高度可定制** - 支持自定义样式和行为
- ⌨️ **键盘快捷键** - ESC 键取消选择
- 🔍 **智能过滤** - 可配置包含/排除选择器

## 安装

```bash
npm install smart-element-selector
```

## 基础用法

### 使用类实例

```javascript
import { SmartElementSelector } from 'smart-element-selector';

const selector = new SmartElementSelector(
  {
    overlayColor: '#3b82f6',
    overlayOpacity: 0.3,
    showTooltip: true
  },
  {
    onElementSelected: (result) => {
      console.log('选中的元素:', result.elementInfo);
      console.log('截图数据:', result.image);
    },
    onError: (error) => {
      console.error('选择出错:', error);
    }
  }
);

// 开始选择
selector.start();

// 停止选择
selector.stop();
```

### 使用 React Hook

```jsx
import React from 'react';
import { useSmartSelector } from 'smart-element-selector';

function MyComponent() {
  const { isActive, result, error, start, stop, clear } = useSmartSelector(
    {
      overlayColor: '#3b82f6',
      showTooltip: true
    },
    {
      onElementSelected: (result) => {
        console.log('选中元素:', result);
      }
    }
  );

  return (
    <div>
      <button onClick={start} disabled={isActive}>
        {isActive ? '选择中...' : '开始选择'}
      </button>
      <button onClick={stop} disabled={!isActive}>
        停止选择
      </button>
      <button onClick={clear}>
        清除结果
      </button>
      
      {error && <div>错误: {error.message}</div>}
      
      {result && (
        <div>
          <h3>选中的元素:</h3>
          <p>标签: {result.elementInfo.tagName}</p>
          <p>ID: {result.elementInfo.id}</p>
          <p>类名: {result.elementInfo.className}</p>
          <img src={result.image} alt="元素截图" />
        </div>
      )}
    </div>
  );
}
```

## 配置选项

### SmartSelectorOptions

```typescript
interface SmartSelectorOptions {
  overlayColor?: string;        // 覆盖层颜色，默认 '#3b82f6'
  overlayOpacity?: number;      // 覆盖层透明度，默认 0.3
  borderColor?: string;         // 边框颜色，默认 '#2563eb'
  borderWidth?: number;         // 边框宽度，默认 2
  showTooltip?: boolean;        // 是否显示提示框，默认 true
  tooltipContent?: (element: Element) => string; // 自定义提示框内容
  excludeSelectors?: string[];  // 排除的选择器
  includeSelectors?: string[];  // 包含的选择器
  captureDelay?: number;        // 截图延迟，默认 100ms
  enableKeyboardShortcuts?: boolean; // 是否启用键盘快捷键，默认 true
}
```

### SmartSelectorCallbacks

```typescript
interface SmartSelectorCallbacks {
  onSelectionStart?: () => void;
  onSelectionEnd?: () => void;
  onSelectionCancelled?: () => void;
  onElementSelected?: (result: CaptureResult) => void;
  onError?: (error: Error) => void;
}
```

## 返回数据结构

### CaptureResult

```typescript
interface CaptureResult {
  image: string;              // Base64 编码的图片数据
  elementInfo: ElementInfo;   // 元素信息
}
```

### ElementInfo

```typescript
interface ElementInfo {
  tagName: string;           // 标签名
  className: string;         // 类名
  id: string;               // ID
  textContent: string;      // 文本内容
  rect: {                   // 位置和尺寸
    x: number;
    y: number;
    width: number;
    height: number;
  };
  xpath: string;            // XPath
  selector: string;         // CSS 选择器
}
```

## 高级用法

### 自定义过滤规则

```javascript
const selector = new SmartElementSelector({
  // 排除脚本和样式标签
  excludeSelectors: ['script', 'style', 'meta'],
  
  // 只允许选择特定元素
  includeSelectors: ['div', 'span', 'p', 'img'],
  
  // 自定义提示框内容
  tooltipContent: (element) => {
    return `${element.tagName} - ${element.textContent?.slice(0, 50)}`;
  }
});
```

### 自定义样式

```javascript
const selector = new SmartElementSelector({
  overlayColor: '#ff6b6b',
  overlayOpacity: 0.2,
  borderColor: '#ff5252',
  borderWidth: 3
});
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 依赖

- `html2canvas`: 用于元素截图
- `react` (可选): 如果使用 React Hook
- `react-dom` (可选): 如果使用 React Hook

## 许可证

MIT

## 更新日志

### 1.0.0
- 初始版本发布
- 支持可视化元素选择
- 支持元素截图捕获
- 提供 React Hook
- 支持自定义配置