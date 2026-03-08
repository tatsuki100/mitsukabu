// ========================================
// src/hooks/useStockDataStorage.ts
// DB移行版 - 株価データをNeon DB（/api/stocks）から取得
// ユーザー設定（観察・検討・保有銘柄）もDB（/api/user-data, /api/stock-status）で管理
// ========================================

import { useState, useEffect } from 'react';
import { DailyData, StoredStock } from '@/types/stockData';
import { fetchUserData, invalidateUserDataCache } from '@/lib/userDataCache';

// Stock型（Yahoo API用に調整）
export type { StoredStock } from '@/types/stockData';

// 株価データの型（APIレスポンスと互換）
type StoredStockData = {
  stocks: StoredStock[];
  dailyDataMap: Record<string, DailyData[]>; // 銘柄コード → DailyData配列
  lastUpdate: string;
  version: string;
  totalStocks: number;
};

// Hookの戻り値型
type UseStockDataStorageReturn = {
  // データ読み込み
  storedData: StoredStockData | null;
  loading: boolean;
  error: string | null;

  // データ操作
  saveStockData: (
    stocks: StoredStock[],
    dailyDataMap: Record<string, DailyData[]>,
    nullDataSummary?: {
      totalStocksWithNullData: number;
      totalNullDays: number;
      affectedStocks: Array<{
        code: string;
        name: string;
        nullDates: string[];
      }>;
    }
  ) => void;
  clearStoredData: () => void;
  getStoredStock: (stockCode: string) => { stock: StoredStock; dailyData: DailyData[] } | null;

  // ステータス
  isDataAvailable: boolean;
  dataAge: string | null; // データの経過時間
  storageUsage: string;   // ストレージ使用量

  // お気に入り機能
  favorites: string[];
  addFavorite: (stockCode: string) => void;
  removeFavorite: (stockCode: string) => void;
  isFavorite: (stockCode: string) => boolean;
  toggleFavorite: (stockCode: string) => void;
  getFavoriteStocks: () => StoredStock[];
  favoritesCount: number;

  // 保有銘柄機能
  holdings: string[];
  addHolding: (stockCode: string) => void;
  removeHolding: (stockCode: string) => void;
  isHolding: (stockCode: string) => boolean;
  toggleHolding: (stockCode: string) => void;
  getHoldingStocks: () => StoredStock[];
  holdingsCount: number;

  // 検討銘柄機能
  considering: string[];
  addConsidering: (stockCode: string) => void;
  removeConsidering: (stockCode: string) => void;
  isConsidering: (stockCode: string) => boolean;
  toggleConsidering: (stockCode: string) => void;
  getConsideringStocks: () => StoredStock[];
  consideringCount: number;

  // 銘柄ステータス統合機能（排他制御付き）
  getStockStatus: (stockCode: string) => 'none' | 'watching' | 'considering' | 'holding';
  setStockStatus: (stockCode: string, status: 'none' | 'watching' | 'considering' | 'holding') => void;
};

// 旧localStorageキー（クリーンアップ用）
const OLD_STORAGE_KEYS = {
  STOCK_DATA: 'jpx400_stock_data_v1',
  FAVORITES: 'jpx400_favorites_v1',
  HOLDINGS: 'jpx400_holdings_v1',
  CONSIDERING: 'jpx400_considering_v1',
} as const;

// データバージョン
const DATA_VERSION = '1.2.0';

// API応答のモジュールレベルキャッシュ（複数コンポーネントからの重複リクエストを防止）
let apiDataPromise: Promise<StoredStockData | null> | null = null;

const fetchStockDataFromApi = (): Promise<StoredStockData | null> => {
  if (!apiDataPromise) {
    apiDataPromise = (async () => {
      try {
        const response = await fetch('/api/stocks');
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        const data = await response.json();

        return {
          stocks: data.stocks || [],
          dailyDataMap: data.dailyDataMap || {},
          lastUpdate: data.lastUpdate || '',
          version: DATA_VERSION,
          totalStocks: data.totalStocks || 0,
        } as StoredStockData;
      } catch (error) {
        console.error('株価データAPI取得エラー:', error);
        apiDataPromise = null; // エラー時はリトライ可能にする
        return null;
      }
    })();
  }

  return apiDataPromise;
};

export const useStockDataStorage = (): UseStockDataStorageReturn => {
  const [storedData, setStoredData] = useState<StoredStockData | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [holdings, setHoldings] = useState<string[]>([]);
  const [considering, setConsidering] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初回読み込み
  useEffect(() => {
    loadStoredData();
    loadUserData();
    cleanupOldLocalStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 旧localStorageデータのクリーンアップ
  const cleanupOldLocalStorage = () => {
    if (typeof window === 'undefined') return;

    try {
      for (const key of Object.values(OLD_STORAGE_KEYS)) {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`旧localStorage削除: ${key}（DB移行完了）`);
        }
      }
    } catch {
      // クリーンアップ失敗は無視
    }
  };

  // APIから株価データを読み込み（Neon DB経由）
  const loadStoredData = async () => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await fetchStockDataFromApi();

      if (!data || data.stocks.length === 0) {
        console.log('API: 株価データがありません');
        setStoredData(null);
        return;
      }

      console.log(`API: ${data.totalStocks}銘柄のデータを取得`);
      console.log(`最終更新: ${data.lastUpdate}`);
      setStoredData(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('株価データ読み込みエラー:', errorMessage);
      setError(`データ読み込みエラー: ${errorMessage}`);
      setStoredData(null);
    } finally {
      setLoading(false);
    }
  };

  // APIからユーザーデータ（観察・検討・保有銘柄）を読み込み
  const loadUserData = async () => {
    if (typeof window === 'undefined') return;

    try {
      const userData = await fetchUserData();
      if (userData) {
        setFavorites(userData.favorites);
        setHoldings(userData.holdings);
        setConsidering(userData.considering);
        console.log(`ユーザーデータ読み込み完了: 観察${userData.favorites.length}件, 保有${userData.holdings.length}件, 検討${userData.considering.length}件`);
      }
    } catch (err) {
      console.error('ユーザーデータ読み込みエラー:', err);
    }
  };

  // 株価データ保存（DB移行後はLambda関数が自動で行うため、この関数は互換性のために残す）
  const saveStockData = (
    _stocks: StoredStock[],
    _dailyDataMap: Record<string, DailyData[]>,
    _nullDataSummary?: {
      totalStocksWithNullData: number;
      totalNullDays: number;
      affectedStocks: Array<{
        code: string;
        name: string;
        nullDates: string[];
      }>;
    }
  ) => {
    console.log('saveStockData: 株価データのDB更新はLambda関数が自動で行います');
  };

  // 株価データクリア（DB移行後は株価データはDBで管理）
  const clearStoredData = () => {
    console.log('clearStoredData: 株価データはDBで管理されています');
  };

  // 特定銘柄のデータを取得
  const getStoredStock = (stockCode: string): { stock: StoredStock; dailyData: DailyData[] } | null => {
    if (!storedData) return null;

    const stock = storedData.stocks.find(s => s.code === stockCode);
    const dailyData = storedData.dailyDataMap[stockCode];

    if (!stock || !dailyData) return null;

    return { stock, dailyData };
  };

  // 銘柄ステータス設定（排他制御付き統合機能）— APIで一括更新
  const setStockStatus = (stockCode: string, status: 'none' | 'watching' | 'considering' | 'holding') => {
    // 楽観的更新: ローカルstateを即座に更新
    setFavorites(prev => prev.filter(code => code !== stockCode));
    setHoldings(prev => prev.filter(code => code !== stockCode));
    setConsidering(prev => prev.filter(code => code !== stockCode));

    switch (status) {
      case 'watching':
        setFavorites(prev => [...prev, stockCode]);
        break;
      case 'considering':
        setConsidering(prev => [...prev, stockCode]);
        break;
      case 'holding':
        setHoldings(prev => [...prev, stockCode]);
        break;
      case 'none':
        // 全てから削除済み
        break;
    }

    // バックグラウンドでAPI呼び出し（awaitしない）
    fetch('/api/stock-status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockCode, status }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
        }
        // キャッシュを無効化（次回読み込み時にDBから最新データを取得）
        invalidateUserDataCache();
      })
      .catch(err => {
        console.error('ステータス更新APIエラー:', err);
        // API失敗時はDBから最新データを再取得してstateを修正
        invalidateUserDataCache();
        loadUserData();
      });
  };

  // お気に入り追加
  const addFavorite = (stockCode: string) => {
    if (favorites.includes(stockCode)) return;
    setStockStatus(stockCode, 'watching');
  };

  // お気に入り削除
  const removeFavorite = (stockCode: string) => {
    if (!favorites.includes(stockCode)) return;
    setStockStatus(stockCode, 'none');
  };

  // お気に入り状態チェック
  const isFavorite = (stockCode: string): boolean => {
    return favorites.includes(stockCode);
  };

  // お気に入りのトグル（追加/削除の切り替え）
  const toggleFavorite = (stockCode: string) => {
    if (isFavorite(stockCode)) {
      removeFavorite(stockCode);
    } else {
      addFavorite(stockCode);
    }
  };

  // お気に入り銘柄のデータを取得（銘柄コード昇順）
  const getFavoriteStocks = (): StoredStock[] => {
    if (!storedData) return [];

    const favoriteStocks = storedData.stocks.filter(stock => favorites.includes(stock.code));

    // 銘柄コード（数値）で昇順ソート
    return favoriteStocks.sort((a, b) => {
      const codeA = parseInt(a.code, 10);
      const codeB = parseInt(b.code, 10);
      return codeA - codeB;
    });
  };

  // 保有銘柄追加
  const addHolding = (stockCode: string) => {
    if (holdings.includes(stockCode)) return;
    setStockStatus(stockCode, 'holding');
  };

  // 保有銘柄削除
  const removeHolding = (stockCode: string) => {
    if (!holdings.includes(stockCode)) return;
    setStockStatus(stockCode, 'none');
  };

  // 保有銘柄状態チェック
  const isHolding = (stockCode: string): boolean => {
    return holdings.includes(stockCode);
  };

  // 保有銘柄のトグル（追加/削除の切り替え）
  const toggleHolding = (stockCode: string) => {
    if (isHolding(stockCode)) {
      removeHolding(stockCode);
    } else {
      addHolding(stockCode);
    }
  };

  // 保有銘柄のデータを取得
  const getHoldingStocks = (): StoredStock[] => {
    if (!storedData) return [];

    return storedData.stocks.filter(stock => holdings.includes(stock.code));
  };

  // 検討銘柄追加
  const addConsidering = (stockCode: string) => {
    if (considering.includes(stockCode)) return;
    setStockStatus(stockCode, 'considering');
  };

  // 検討銘柄削除
  const removeConsidering = (stockCode: string) => {
    if (!considering.includes(stockCode)) return;
    setStockStatus(stockCode, 'none');
  };

  // 検討銘柄状態チェック
  const isConsidering = (stockCode: string): boolean => {
    return considering.includes(stockCode);
  };

  // 検討銘柄のトグル（追加/削除の切り替え）
  const toggleConsidering = (stockCode: string) => {
    if (isConsidering(stockCode)) {
      removeConsidering(stockCode);
    } else {
      addConsidering(stockCode);
    }
  };

  // 検討銘柄のデータを取得（銘柄コード昇順）
  const getConsideringStocks = (): StoredStock[] => {
    if (!storedData) return [];

    const consideringStocks = storedData.stocks.filter(stock => considering.includes(stock.code));

    // 銘柄コード（数値）で昇順ソート
    return consideringStocks.sort((a, b) => {
      const codeA = parseInt(a.code, 10);
      const codeB = parseInt(b.code, 10);
      return codeA - codeB;
    });
  };

  // 銘柄ステータス取得（排他制御付き統合機能）
  const getStockStatus = (stockCode: string): 'none' | 'watching' | 'considering' | 'holding' => {
    if (favorites.includes(stockCode)) return 'watching';
    if (considering.includes(stockCode)) return 'considering';
    if (holdings.includes(stockCode)) return 'holding';
    return 'none';
  };

  // データの存在確認
  const isDataAvailable = storedData !== null && storedData.stocks.length > 0;

  // データの日時を計算（yyyy-mm-dd hh:mm形式、JST）
  const dataAge = storedData ? (() => {
    const lastUpdate = new Date(storedData.lastUpdate);

    // JST（日本標準時）で yyyy-mm-dd hh:mm 形式にフォーマット
    return lastUpdate.toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(/\//g, '-');
  })() : null;

  // ストレージ使用量（DB管理のため固定表示）
  const storageUsage = 'DB管理';

  return {
    storedData,
    loading,
    error,
    saveStockData,
    clearStoredData,
    getStoredStock,
    isDataAvailable,
    dataAge,
    storageUsage,

    // お気に入り機能
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    getFavoriteStocks,
    favoritesCount: favorites.length,

    // 保有銘柄機能
    holdings,
    addHolding,
    removeHolding,
    isHolding,
    toggleHolding,
    getHoldingStocks,
    holdingsCount: holdings.length,

    // 検討銘柄機能
    considering,
    addConsidering,
    removeConsidering,
    isConsidering,
    toggleConsidering,
    getConsideringStocks,
    consideringCount: considering.length,

    // 銘柄ステータス統合機能（排他制御付き）
    getStockStatus,
    setStockStatus
  };
};
