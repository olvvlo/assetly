export interface ElementInfo {
  tagName: string;
  className: string;
  id: string;
  textContent: string;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  xpath: string;
  selector: string;
}

export interface CaptureResult {
  image: string; // base64 encoded image
  elementInfo: ElementInfo;
}

export interface SmartSelectorOptions {
  overlayColor?: string;
  overlayOpacity?: number;
  borderColor?: string;
  borderWidth?: number;
  showTooltip?: boolean;
  tooltipContent?: (element: Element) => string;
  excludeSelectors?: string[];
  includeSelectors?: string[];
  captureDelay?: number;
  enableKeyboardShortcuts?: boolean;
}

export interface SmartSelectorCallbacks {
  onElementSelected?: (result: CaptureResult) => void;
  onSelectionCancelled?: () => void;
  onError?: (error: Error) => void;
  onSelectionStart?: () => void;
  onSelectionEnd?: () => void;
}

export interface SmartSelectorInstance {
  start: () => void;
  stop: () => void;
  isActive: () => boolean;
  destroy: () => void;
}