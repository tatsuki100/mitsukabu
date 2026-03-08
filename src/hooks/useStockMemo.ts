// ========================================
// src/hooks/useStockMemo.ts
// 銘柄ごとのメモ管理カスタムHook（DB移行版）
// 楽観的更新 + 500msデバウンスでAPI保存
// ========================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchUserData, invalidateUserDataCache } from '@/lib/userDataCache';

// メモデータの型定義
type StockMemos = {
  [stockCode: string]: string; // 銘柄コード → メモ内容
};

// Hook戻り値の型定義
type UseStockMemoReturn = {
  getMemo: (stockCode: string) => string;
  saveMemo: (stockCode: string, memo: string) => void;
  deleteMemo: (stockCode: string) => void;
  getAllMemos: () => StockMemos;
  loading: boolean;
};

// 旧localStorageキー（クリーンアップ用）
const OLD_STORAGE_KEY = 'jpx400_stock_memos_v1';

// デバウンス間隔（ms）
const DEBOUNCE_MS = 500;

export const useStockMemo = (): UseStockMemoReturn => {
  const [memos, setMemos] = useState<StockMemos>({});
  const [loading, setLoading] = useState<boolean>(true);

  // デバウンスタイマー管理（銘柄コードごと）
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // 初回読み込み
  useEffect(() => {
    loadMemos();
    cleanupOldLocalStorage();

    // クリーンアップ: 未送信のデバウンスタイマーをすべてキャンセル
    return () => {
      for (const timer of Object.values(debounceTimers.current)) {
        clearTimeout(timer);
      }
    };
  }, []);

  // 旧localStorageデータのクリーンアップ
  const cleanupOldLocalStorage = () => {
    if (typeof window === 'undefined') return;

    try {
      if (localStorage.getItem(OLD_STORAGE_KEY)) {
        localStorage.removeItem(OLD_STORAGE_KEY);
        console.log(`旧localStorage削除: ${OLD_STORAGE_KEY}（DB移行完了）`);
      }
    } catch {
      // クリーンアップ失敗は無視
    }
  };

  // APIからメモを読み込み
  const loadMemos = async () => {
    try {
      setLoading(true);
      const userData = await fetchUserData();

      if (userData && userData.memos) {
        setMemos(userData.memos);
        console.log(`メモ読み込み完了: ${Object.keys(userData.memos).length}件`);
      } else {
        console.log('メモデータなし');
        setMemos({});
      }
    } catch (error) {
      console.error('メモ読み込みエラー:', error);
      setMemos({});
    } finally {
      setLoading(false);
    }
  };

  // 特定銘柄のメモを取得
  const getMemo = useCallback((stockCode: string): string => {
    return memos[stockCode] || '';
  }, [memos]);

  // メモを保存（楽観的更新 + デバウンスAPI呼び出し）
  const saveMemo = useCallback((stockCode: string, memo: string) => {
    // 楽観的更新: ローカルstateを即座に更新
    if (memo.trim() === '') {
      // 空文字の場合はローカルstateから削除
      setMemos(prev => {
        const newMemos = { ...prev };
        delete newMemos[stockCode];
        return newMemos;
      });
    } else {
      setMemos(prev => ({
        ...prev,
        [stockCode]: memo,
      }));
    }

    // 既存のデバウンスタイマーをクリア
    if (debounceTimers.current[stockCode]) {
      clearTimeout(debounceTimers.current[stockCode]);
    }

    // デバウンスでAPI呼び出し
    debounceTimers.current[stockCode] = setTimeout(() => {
      delete debounceTimers.current[stockCode];

      if (memo.trim() === '') {
        // 空文字の場合はDBから削除
        fetch(`/api/memos/${stockCode}`, {
          method: 'DELETE',
        })
          .then(res => {
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            invalidateUserDataCache();
          })
          .catch(err => {
            console.error('メモ削除APIエラー:', err);
          });
      } else {
        // メモをDBに保存（UPSERT）
        fetch(`/api/memos/${stockCode}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memo }),
        })
          .then(res => {
            if (!res.ok) throw new Error(`API Error: ${res.status}`);
            invalidateUserDataCache();
          })
          .catch(err => {
            console.error('メモ保存APIエラー:', err);
          });
      }
    }, DEBOUNCE_MS);
  }, []);

  // メモを削除
  const deleteMemo = useCallback((stockCode: string) => {
    // 楽観的更新: ローカルstateから即座に削除
    setMemos(prev => {
      const newMemos = { ...prev };
      delete newMemos[stockCode];
      return newMemos;
    });

    // 既存のデバウンスタイマーをクリア
    if (debounceTimers.current[stockCode]) {
      clearTimeout(debounceTimers.current[stockCode]);
      delete debounceTimers.current[stockCode];
    }

    // 即座にAPI呼び出し（デバウンスなし）
    fetch(`/api/memos/${stockCode}`, {
      method: 'DELETE',
    })
      .then(res => {
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        invalidateUserDataCache();
        console.log(`メモ削除: ${stockCode}`);
      })
      .catch(err => {
        console.error('メモ削除APIエラー:', err);
      });
  }, []);

  // 全メモを取得
  const getAllMemos = useCallback((): StockMemos => {
    return { ...memos };
  }, [memos]);

  return {
    getMemo,
    saveMemo,
    deleteMemo,
    getAllMemos,
    loading
  };
};
