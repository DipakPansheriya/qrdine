import { InjectionToken } from '@angular/core';

export interface AppStorage {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}

export class LocalStorageService implements AppStorage {
  getItem<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as unknown as T;
    }
  }

  setItem<T>(key: string, value: T): void {
    const item = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, item);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}

export const APP_STORAGE = new InjectionToken<AppStorage>('APP_STORAGE', {
  providedIn: 'root',
  factory: () => new LocalStorageService()
});
