/**
 * フロントエンド用ロガー
 * 開発環境でのデバッグ支援
 */

const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.debug(`[FX-Frontend] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(`[FX-Frontend] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(`[FX-Frontend] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`[FX-Frontend] ${message}`, ...args);
  }
};