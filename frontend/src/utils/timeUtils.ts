/**
 * 時間関連のユーティリティ関数
 * 作成日: 2025-09-09
 * 用途: JST変換とセッション判定の統一
 */

export interface SessionInfo {
  name: string;
  color: string;
}

/**
 * 現在時刻をJST（日本標準時）に変換
 */
export const getCurrentJST = (): Date => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (9 * 60 * 60 * 1000));
};

/**
 * 現在のFX取引セッションを判定
 * @returns SessionInfo セッション情報
 */
export const getCurrentTradingSession = (): SessionInfo => {
  const jst = getCurrentJST();
  const hour = jst.getHours();
  
  // セッション判定ロジック（JST基準）
  if (hour >= 9 && hour < 15) {
    return { name: '東京', color: '#52c41a' };
  }
  if (hour >= 16 && hour < 24) {
    return { name: 'ロンドン', color: '#1890ff' };
  }
  if (hour >= 22 || hour < 2) {
    return { name: 'NY序盤', color: '#fa8c16' };
  }
  
  return { name: 'オフ', color: '#8c8c8c' };
};

/**
 * 指定した時刻がTORB東京時間（9:00-11:00 JST）かどうか判定
 */
export const isTORBTokyoTime = (date?: Date): boolean => {
  const jst = date ? 
    new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (9 * 60 * 60 * 1000)) :
    getCurrentJST();
  const hour = jst.getHours();
  const minute = jst.getMinutes();
  
  return hour >= 9 && (hour < 11 || (hour === 11 && minute === 0));
};

/**
 * 時刻を JST 文字列として取得（デバッグ用）
 */
export const getJSTString = (date?: Date): string => {
  const jst = date ? 
    new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + (9 * 60 * 60 * 1000)) :
    getCurrentJST();
  return jst.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
};