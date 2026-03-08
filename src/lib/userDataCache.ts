// ========================================
// src/lib/userDataCache.ts
// ユーザーデータ共有キャッシュ（GET /api/user-data のレスポンスを共有）
// useStockDataStorage と useStockMemo が同じAPIレスポンスを使う
// ========================================

// ユーザーデータ型
export type UserData = {
  favorites: string[];
  holdings: string[];
  considering: string[];
  memos: Record<string, string>;
};

// モジュールレベルキャッシュ（重複リクエスト防止）
let userDataPromise: Promise<UserData | null> | null = null;

// ユーザーデータをAPIから取得（キャッシュ付き）
export const fetchUserData = (): Promise<UserData | null> => {
  if (!userDataPromise) {
    userDataPromise = (async () => {
      try {
        const response = await fetch('/api/user-data');
        if (response.status === 401) {
          // 未ログイン → 空データとして扱う（エラーではない）
          return null;
        }
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        return await response.json() as UserData;
      } catch (error) {
        console.error('ユーザーデータAPI取得エラー:', error);
        userDataPromise = null;
        return null;
      }
    })();
  }
  return userDataPromise;
};

// キャッシュを無効化（ログアウト時等に呼ぶ）
export const invalidateUserDataCache = (): void => {
  userDataPromise = null;
};
