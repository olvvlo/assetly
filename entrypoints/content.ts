export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('简资 Assetly content script loaded');
    
    // 监听来自sidepanel的消息
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'START_SMART_CAPTURE') {
        // 开始智能选区
        startSmartCapture();
        sendResponse({ success: true });
      }
      
      if (message.type === 'GET_PAGE_INFO') {
        // 获取当前页面信息
        const pageInfo = {
          title: document.title,
          url: window.location.href,
          domain: window.location.hostname
        };
        sendResponse(pageInfo);
      }
    });
  },
});

// 智能选区相关变量
let isSelecting = false;
let startPoint: { x: number; y: number } | null = null;
let overlay: HTMLDivElement | null = null;
let hoveredElement: HTMLElement | null = null;
let tipElement: HTMLDivElement | null = null;

// 开始智能选区
function startSmartCapture() {
  if (isSelecting) return;
  
  isSelecting = true;
  
  // 创建遮罩层
  createOverlay();
  
  // 添加事件监听器
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('click', handleElementClick, true);
  document.addEventListener('keydown', handleKeyDown, true);
}

// 创建遮罩层
function createOverlay() {
  // 创建半透明遮罩
  overlay = document.createElement('div');
  overlay.setAttribute('data-assetly-overlay', 'true');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.4);
    z-index: 999999;
    pointer-events: none;
    cursor: crosshair;
  `;
  
  // 创建顶部提示文字
  tipElement = document.createElement('div');
  tipElement.setAttribute('data-assetly-overlay', 'true');
  tipElement.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 16px 28px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 1000000;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
  `;
  tipElement.textContent = '移动鼠标选择元素，点击确认选择，按ESC取消';
  
  // 添加所有元素到页面
  document.body.appendChild(overlay);
  document.body.appendChild(tipElement);
  
  // 10秒后自动隐藏提示
  setTimeout(() => {
    if (tipElement && tipElement.parentNode) {
      tipElement.parentNode.removeChild(tipElement);
      tipElement = null;
    }
  }, 10000);
}

// 更新遮罩层，在选中区域去除蒙版
function updateOverlayMask(rect: DOMRect) {
  if (!overlay) return;
  
  // 使用clip-path创建镂空效果
  const clipPath = `polygon(
    0% 0%, 
    0% 100%, 
    ${rect.left}px 100%, 
    ${rect.left}px ${rect.top}px, 
    ${rect.right}px ${rect.top}px, 
    ${rect.right}px ${rect.bottom}px, 
    ${rect.left}px ${rect.bottom}px, 
    ${rect.left}px 100%, 
    100% 100%, 
    100% 0%
  )`;
  
  overlay.style.clipPath = clipPath;
}

// 处理鼠标悬停
function handleMouseOver(e: MouseEvent) {
  if (!isSelecting) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const target = e.target as HTMLElement;
  if (target === overlay || target.closest('[data-assetly-overlay]')) return;
  
  // 移除之前的高亮
  if (hoveredElement) {
    hoveredElement.style.outline = '';
    hoveredElement.style.outlineOffset = '';
    hoveredElement.style.borderRadius = '';
    hoveredElement.style.backgroundColor = '';
    hoveredElement.style.boxShadow = '';
  }
  
  // 高亮当前元素
  hoveredElement = target;
  hoveredElement.style.outline = '5px solid #f59e0b';
  hoveredElement.style.outlineOffset = '2px';
  hoveredElement.style.borderRadius = '8px';
  hoveredElement.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
  hoveredElement.style.boxShadow = '0 0 0 2px rgba(245, 158, 11, 0.3)';
  
  // 更新遮罩层，在选中区域去除蒙版
  const rect = target.getBoundingClientRect();
  updateOverlayMask(rect);
}

// 处理鼠标离开
function handleMouseOut(e: MouseEvent) {
  if (!isSelecting) return;
  
  const target = e.target as HTMLElement;
  if (target === hoveredElement) {
    target.style.outline = '';
    target.style.outlineOffset = '';
    target.style.borderRadius = '';
    target.style.backgroundColor = '';
    target.style.boxShadow = '';
    
    // 恢复完整遮罩
    if (overlay) {
      overlay.style.clipPath = '';
    }
  }
}

// 处理元素点击
function handleElementClick(e: MouseEvent) {
  if (!isSelecting) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const target = e.target as HTMLElement;
  if (target === overlay || target.closest('[data-assetly-overlay]')) return;
  
  // 确认选择该元素
  confirmElementSelection(target);
}

// 处理键盘事件
function handleKeyDown(e: KeyboardEvent) {
  if (!isSelecting) return;
  
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    cancelSelection();
  }
}

// 确认元素选择
async function confirmElementSelection(element: HTMLElement) {
  try {
    // 清理选区状态
    cleanupSelection();
    
    // 获取元素的位置和尺寸
    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    // 使用html2canvas截取选中的元素
    const { default: html2canvas } = await import('html2canvas');
    
    const canvas = await html2canvas(element, {
      allowTaint: true,
      useCORS: true,
      scale: 2, // 提高截图质量
      backgroundColor: null,
      logging: false,
    });
    
    const imageDataUrl = canvas.toDataURL('image/png');
    
    // 发送截图结果到sidepanel
    browser.runtime.sendMessage({
      type: 'SMART_CAPTURE_RESULT',
      data: {
        image: imageDataUrl,
        elementInfo: {
          tagName: element.tagName,
          className: element.className,
          id: element.id,
          textContent: element.textContent?.slice(0, 500), // 限制文本长度
          rect: {
            x: rect.left + scrollX,
            y: rect.top + scrollY,
            width: rect.width,
            height: rect.height
          }
        }
      }
    });
    
  } catch (error) {
    console.error('元素截图失败:', error);
    
    // 发送错误信息
    browser.runtime.sendMessage({
      type: 'SMART_CAPTURE_ERROR',
      error: String(error)
    });
  }
}

// 取消选择
function cancelSelection() {
  cleanupSelection();
  
  // 通知sidepanel取消了选择
  browser.runtime.sendMessage({
    type: 'SMART_CAPTURE_CANCELLED'
  });
}

// 清理选区状态
function cleanupSelection() {
  isSelecting = false;
  
  // 移除事件监听器
  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('mouseout', handleMouseOut, true);
  document.removeEventListener('click', handleElementClick, true);
  document.removeEventListener('keydown', handleKeyDown, true);
  
  // 移除高亮效果
  if (hoveredElement) {
    hoveredElement.style.outline = '';
    hoveredElement.style.outlineOffset = '';
    hoveredElement.style.borderRadius = '';
    hoveredElement.style.backgroundColor = '';
    hoveredElement.style.boxShadow = '';
    hoveredElement = null;
  }
  
  // 移除遮罩层
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
    overlay = null;
  }
  
  // 移除所有提示元素
  const tips = document.querySelectorAll('[data-assetly-overlay]');
  tips.forEach(tip => {
    if (tip.parentNode) {
      tip.parentNode.removeChild(tip);
    }
  });
}
