import { useCallback } from 'react';

export function useLazyLoad() {
  const start = useCallback(() => {
    window.dispatchEvent(new CustomEvent('lazy-load-start'));
  }, []);

  const done = useCallback(() => {
    window.dispatchEvent(new CustomEvent('lazy-load-done'));
  }, []);

  const error = useCallback(() => {
    window.dispatchEvent(new CustomEvent('lazy-load-error'));
  }, []);

  return { start, done, error };
}
