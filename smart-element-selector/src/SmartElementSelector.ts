import html2canvas from 'html2canvas';
import { 
  SmartSelectorOptions, 
  SmartSelectorCallbacks, 
  SmartSelectorInstance, 
  ElementInfo, 
  CaptureResult 
} from './types';

export class SmartElementSelector implements SmartSelectorInstance {
  private overlay: HTMLDivElement | null = null;
  private tooltip: HTMLDivElement | null = null;
  private isSelecting = false;
  private currentElement: Element | null = null;
  
  private readonly options: Required<SmartSelectorOptions>;
  private readonly callbacks: SmartSelectorCallbacks;

  constructor(
    options: SmartSelectorOptions = {},
    callbacks: SmartSelectorCallbacks = {}
  ) {
    this.options = {
      overlayColor: '#3b82f6',
      overlayOpacity: 0.3,
      borderColor: '#2563eb',
      borderWidth: 2,
      showTooltip: true,
      tooltipContent: (element) => `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}${element.className ? '.' + element.className.split(' ').join('.') : ''}`,
      excludeSelectors: ['script', 'style', 'meta', 'link', 'title'],
      includeSelectors: [],
      captureDelay: 100,
      enableKeyboardShortcuts: true,
      ...options
    };
    
    this.callbacks = callbacks;
    
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseClick = this.handleMouseClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  public start(): void {
    if (this.isSelecting) return;
    
    this.isSelecting = true;
    this.callbacks.onSelectionStart?.();
    
    this.createOverlay();
    this.addEventListeners();
    
    // 添加样式到页面
    this.injectStyles();
  }

  public stop(): void {
    if (!this.isSelecting) return;
    
    this.isSelecting = false;
    this.removeEventListeners();
    this.removeOverlay();
    this.removeTooltip();
    
    this.callbacks.onSelectionEnd?.();
  }

  public isActive(): boolean {
    return this.isSelecting;
  }

  public destroy(): void {
    this.stop();
    this.removeInjectedStyles();
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'smart-element-selector-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      background-color: ${this.options.overlayColor};
      opacity: ${this.options.overlayOpacity};
      border: ${this.options.borderWidth}px solid ${this.options.borderColor};
      pointer-events: none;
      z-index: 999999;
      transition: all 0.1s ease;
      box-sizing: border-box;
    `;
    
    document.body.appendChild(this.overlay);
  }

  private createTooltip(): void {
    if (!this.options.showTooltip) return;
    
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'smart-element-selector-tooltip';
    this.tooltip.style.cssText = `
      position: fixed;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-family: monospace;
      pointer-events: none;
      z-index: 1000000;
      white-space: nowrap;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    
    document.body.appendChild(this.tooltip);
  }

  private removeOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  private removeTooltip(): void {
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  private addEventListeners(): void {
    document.addEventListener('mousemove', this.handleMouseMove, true);
    document.addEventListener('click', this.handleMouseClick, true);
    
    if (this.options.enableKeyboardShortcuts) {
      document.addEventListener('keydown', this.handleKeyDown, true);
    }
  }

  private removeEventListeners(): void {
    document.removeEventListener('mousemove', this.handleMouseMove, true);
    document.removeEventListener('click', this.handleMouseClick, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isSelecting) return;
    
    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (!element || element === this.currentElement) return;
    
    // 检查是否应该排除此元素
    if (this.shouldExcludeElement(element)) return;
    
    this.currentElement = element;
    this.updateOverlay(element);
    this.updateTooltip(element, event.clientX, event.clientY);
  }

  private handleMouseClick(event: MouseEvent): void {
    if (!this.isSelecting || !this.currentElement) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    this.captureElement(this.currentElement);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isSelecting) return;
    
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.stop();
      this.callbacks.onSelectionCancelled?.();
    }
  }

  private shouldExcludeElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    
    // 检查排除选择器
    if (this.options.excludeSelectors.includes(tagName)) return true;
    
    // 检查是否匹配排除选择器
    for (const selector of this.options.excludeSelectors) {
      try {
        if (element.matches(selector)) return true;
      } catch (e) {
        // 忽略无效的选择器
      }
    }
    
    // 如果指定了包含选择器，检查元素是否匹配
    if (this.options.includeSelectors.length > 0) {
      let matches = false;
      for (const selector of this.options.includeSelectors) {
        try {
          if (element.matches(selector)) {
            matches = true;
            break;
          }
        } catch (e) {
          // 忽略无效的选择器
        }
      }
      if (!matches) return true;
    }
    
    // 排除我们自己创建的元素
    if (element.id === 'smart-element-selector-overlay' || 
        element.id === 'smart-element-selector-tooltip') {
      return true;
    }
    
    return false;
  }

  private updateOverlay(element: Element): void {
    if (!this.overlay) return;
    
    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    this.overlay.style.left = `${rect.left + scrollX}px`;
    this.overlay.style.top = `${rect.top + scrollY}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
  }

  private updateTooltip(element: Element, mouseX: number, mouseY: number): void {
    if (!this.tooltip || !this.options.showTooltip) return;
    
    if (!this.tooltip.parentNode) {
      this.createTooltip();
    }
    
    const content = this.options.tooltipContent(element);
    this.tooltip.textContent = content;
    
    // 定位tooltip，避免超出视窗
    const tooltipRect = this.tooltip.getBoundingClientRect();
    let left = mouseX + 10;
    let top = mouseY - 30;
    
    if (left + tooltipRect.width > window.innerWidth) {
      left = mouseX - tooltipRect.width - 10;
    }
    
    if (top < 0) {
      top = mouseY + 20;
    }
    
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  private async captureElement(element: Element): Promise<void> {
    try {
      // 暂时隐藏overlay和tooltip
      const overlayDisplay = this.overlay?.style.display;
      const tooltipDisplay = this.tooltip?.style.display;
      
      if (this.overlay) this.overlay.style.display = 'none';
      if (this.tooltip) this.tooltip.style.display = 'none';
      
      // 等待一小段时间确保元素渲染完成
      await new Promise(resolve => setTimeout(resolve, this.options.captureDelay));
      
      // 获取元素信息
      const elementInfo = this.getElementInfo(element);
      
      // 截图
      const canvas = await html2canvas(element as HTMLElement, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
        width: elementInfo.rect.width,
        height: elementInfo.rect.height
      });
      
      const imageData = canvas.toDataURL('image/png');
      
      // 恢复overlay和tooltip显示
      if (this.overlay && overlayDisplay) this.overlay.style.display = overlayDisplay;
      if (this.tooltip && tooltipDisplay) this.tooltip.style.display = tooltipDisplay;
      
      const result: CaptureResult = {
        image: imageData,
        elementInfo
      };
      
      this.stop();
      this.callbacks.onElementSelected?.(result);
      
    } catch (error) {
      this.callbacks.onError?.(error as Error);
    }
  }

  private getElementInfo(element: Element): ElementInfo {
    const rect = element.getBoundingClientRect();
    
    return {
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      textContent: element.textContent?.trim() || '',
      rect: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      },
      xpath: this.getXPath(element),
      selector: this.getSelector(element)
    };
  }

  private getXPath(element: Element): string {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    
    if (element === document.body) {
      return '/html/body';
    }
    
    let ix = 0;
    const siblings = element.parentNode?.childNodes || [];
    
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === element) {
        return this.getXPath(element.parentElement!) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
      }
      if (sibling.nodeType === 1 && (sibling as Element).tagName === element.tagName) {
        ix++;
      }
    }
    
    return '';
  }

  private getSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
      }
    }
    
    return element.tagName.toLowerCase();
  }

  private injectStyles(): void {
    const styleId = 'smart-element-selector-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #smart-element-selector-overlay {
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
      }
      
      #smart-element-selector-tooltip {
        animation: fadeIn 0.2s ease-in-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    
    document.head.appendChild(style);
  }

  private removeInjectedStyles(): void {
    const style = document.getElementById('smart-element-selector-styles');
    if (style) {
      style.remove();
    }
  }
}