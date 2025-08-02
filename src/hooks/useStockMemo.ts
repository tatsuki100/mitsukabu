// ========================================
// src/hooks/useStockMemo.ts
// 銘柄ごとのメモ管理カスタムHook
// ========================================

import { useState, useEffect, useCallback } from 'react';

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

const STORAGE_KEY = 'jpx400_stock_memos_v1';

export const useStockMemo = (): UseStockMemoReturn => {
  const [memos, setMemos] = useState<StockMemos>({});
  const [loading, setLoading] = useState<boolean>(true);

  // 初回読み込み
  useEffect(() => {
    loadMemos();
  }, []);

  // localStorageからメモを読み込み
  const loadMemos = () => {
    try {
      setLoading(true);
      const rawData = localStorage.getItem(STORAGE_KEY);

      if (rawData) {
        const parsedMemos: StockMemos = JSON.parse(rawData);
        setMemos(parsedMemos);
        console.log(`メモ読み込み完了: ${Object.keys(parsedMemos).length}件`);
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

  // localStorageにメモを保存
  const saveToStorage = useCallback((newMemos: StockMemos) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMemos));
      console.log('メモ保存完了');
    } catch (error) {
      console.error('メモ保存エラー:', error);
    }
  }, []);

  // 特定銘柄のメモを取得
  const getMemo = useCallback((stockCode: string): string => {
    return memos[stockCode] || '';
  }, [memos]);

  // メモを保存
  const saveMemo = useCallback((stockCode: string, memo: string) => {
    // localStorage から最新のメモデータを直接読み込む
    let currentMemos: StockMemos = {};

    try {
      const rawData = localStorage.getItem(STORAGE_KEY);
      if (rawData) {
        currentMemos = JSON.parse(rawData);
      }
    } catch (error) {
      console.error('❌ メモ読み込みエラー:', error);
      currentMemos = {};
    }

    // 最新のデータに新しいメモを追加
    const newMemos = {
      ...currentMemos,
      [stockCode]: memo
    };

    // 空文字の場合は削除
    if (memo.trim() === '') {
      delete newMemos[stockCode];
    }

    // localStorage に保存
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMemos));
      console.log(`✅ メモ保存完了: ${stockCode}`);
    } catch (error) {
      console.error('❌ メモ保存エラー:', error);
    }

    // state も更新
    setMemos(newMemos);
  }, []);

  // メモを削除
  const deleteMemo = useCallback((stockCode: string) => {
    const newMemos = { ...memos };
    delete newMemos[stockCode];

    setMemos(newMemos);
    saveToStorage(newMemos);
    console.log(`メモ削除: ${stockCode}`);
  }, [memos, saveToStorage]);

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