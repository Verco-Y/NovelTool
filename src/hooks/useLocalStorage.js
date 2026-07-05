import { useState, useEffect } from 'react';

/**
 * LocalStorage 持久化 Hook
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('读取 LocalStorage 失败:', error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('写入 LocalStorage 失败:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}