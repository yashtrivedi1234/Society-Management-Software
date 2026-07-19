import { useCallback, useRef, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((type, message, duration = 2500) => {
    setToast({ type, message });
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setToast(null), duration);
  }, []);

  const clearToast = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, showToast, clearToast };
}
