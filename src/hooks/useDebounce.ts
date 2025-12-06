import { useCallback, useEffect, useRef } from "react";

function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number): T & { cancel: () => void } {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );

  // Attach a cancel method to clear pending timeout
  const cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return Object.assign(debouncedFunction, { cancel }) as T & { cancel: () => void };
}

export default useDebounce;
