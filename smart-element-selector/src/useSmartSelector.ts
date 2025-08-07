import { useState, useRef, useCallback, useEffect } from 'react';
import { SmartElementSelector } from './SmartElementSelector';
import { 
  SmartSelectorOptions, 
  SmartSelectorCallbacks, 
  CaptureResult 
} from './types';

export interface UseSmartSelectorReturn {
  isActive: boolean;
  result: CaptureResult | null;
  error: Error | null;
  start: () => void;
  stop: () => void;
  clear: () => void;
}

export function useSmartSelector(
  options: SmartSelectorOptions = {},
  callbacks: SmartSelectorCallbacks = {}
): UseSmartSelectorReturn {
  const [isActive, setIsActive] = useState(false);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const selectorRef = useRef<SmartElementSelector | null>(null);

  // 创建增强的回调函数
  const enhancedCallbacks: SmartSelectorCallbacks = {
    ...callbacks,
    onSelectionStart: () => {
      setIsActive(true);
      setError(null);
      callbacks.onSelectionStart?.();
    },
    onSelectionEnd: () => {
      setIsActive(false);
      callbacks.onSelectionEnd?.();
    },
    onSelectionCancelled: () => {
      setIsActive(false);
      callbacks.onSelectionCancelled?.();
    },
    onElementSelected: (captureResult: CaptureResult) => {
      setResult(captureResult);
      setIsActive(false);
      callbacks.onElementSelected?.(captureResult);
    },
    onError: (err: Error) => {
      setError(err);
      setIsActive(false);
      callbacks.onError?.(err);
    }
  };

  const start = useCallback(() => {
    if (!selectorRef.current) {
      selectorRef.current = new SmartElementSelector(options, enhancedCallbacks);
    }
    
    setError(null);
    selectorRef.current.start();
  }, [options, enhancedCallbacks]);

  const stop = useCallback(() => {
    if (selectorRef.current) {
      selectorRef.current.stop();
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  // 清理函数
  useEffect(() => {
    return () => {
      if (selectorRef.current) {
        selectorRef.current.destroy();
        selectorRef.current = null;
      }
    };
  }, []);

  return {
    isActive,
    result,
    error,
    start,
    stop,
    clear
  };
}