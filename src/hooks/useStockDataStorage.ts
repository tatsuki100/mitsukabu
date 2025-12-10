// ========================================
// src/hooks/useStockDataStorage.ts
// 4.7MB超過時自動圧縮対応版 + SSR対応 + null関連実装対応版 - localStorage容量制限対策
// バージョン3
// ========================================

import { useState, useEffect } from 'react';
import { DailyData, StoredStock } from '@/types/stockData';
import pako from 'pako';

// Stock型（Yahoo API用に調整）
export type { StoredStock } from '@/types/stockData';

// localStorage保存用のデータ型
type StoredStockData = {
  stocks: StoredStock[];
  dailyDataMap: Record<string, DailyData[]>; // 銘柄コード → DailyData配列
  lastUpdate: string;
  version: string;
  totalStocks: number;
  isCompressed?: boolean; // 圧縮フラグを追加
  nullDataWarning?: {
    hasNullData: boolean;
    totalStocksWithNullData: number;
    totalNullDays: number;
    lastOccurrence: string;
    summary: string;
  };
};

// お気に入り管理用の型
type FavoritesData = {
  favorites: string[]; // 銘柄コードの配列
  lastUpdate: string;
  version: string;
};

// 保有銘柄管理用の型
type HoldingsData = {
  holdings: string[]; // 銘柄コードの配列
  lastUpdate: string;
  version: string;
};

// 検討銘柄管理用の型
type ConsideringData = {
  considering: string[]; // 銘柄コードの配列
  lastUpdate: string;
  version: string;
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

// localStorage keys
const STORAGE_KEYS = {
  STOCK_DATA: 'jpx400_stock_data_v1',
  FAVORITES: 'jpx400_favorites_v1',
  HOLDINGS: 'jpx400_holdings_v1',
  CONSIDERING: 'jpx400_considering_v1',
} as const;

// データバージョン（null関連実装対応版）
const DATA_VERSION = '1.2.0';
const FAVORITES_VERSION = '1.0.0';
const HOLDINGS_VERSION = '1.0.0';
const CONSIDERING_VERSION = '1.0.0';

// 自動圧縮するサイズ（4.7MBを超えると自動圧縮する）
const COMPRESSION_THRESHOLD = 4.7 * 1024 * 1024;

export const useStockDataStorage = (): UseStockDataStorageReturn => {
  const [storedData, setStoredData] = useState<StoredStockData | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [holdings, setHoldings] = useState<string[]>([]);
  const [considering, setConsidering] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // nullデータサマリーから保存用の警告情報を生成
  const generateNullWarningInfo = (nullDataSummary?: {
    totalStocksWithNullData: number;
    totalNullDays: number;
    affectedStocks: Array<{
      code: string;
      name: string;
      nullDates: string[];
    }>;
  }) => {
    if (!nullDataSummary || nullDataSummary.totalStocksWithNullData === 0) {
      return undefined;
    }

    const summary = `${nullDataSummary.totalStocksWithNullData}銘柄で${nullDataSummary.totalNullDays}日分のnullデータを検出`;

    return {
      hasNullData: true,
      totalStocksWithNullData: nullDataSummary.totalStocksWithNullData,
      totalNullDays: nullDataSummary.totalNullDays,
      lastOccurrence: new Date().toISOString(),
      summary
    };
  };

  // データ圧縮関数
  const compressData = (jsonString: string): string => {
    try {
      console.log('🗜️ データ圧縮開始...');

      // UTF-8文字列をUint8Arrayに変換
      const encoder = new TextEncoder();
      const data = encoder.encode(jsonString);

      // pako.deflateで圧縮
      const compressed = pako.deflate(data);

      // Base64エンコード
      let binaryString = '';
      for (let i = 0; i < compressed.length; i++) {
        binaryString += String.fromCharCode(compressed[i]);
      }
      const base64 = btoa(binaryString);

      const originalSize = (jsonString.length / 1024 / 1024).toFixed(2);
      const compressedSize = (base64.length / 1024 / 1024).toFixed(2);
      const compressionRatio = ((1 - base64.length / jsonString.length) * 100).toFixed(1);

      console.log(`✅ 圧縮完了: ${originalSize}MB → ${compressedSize}MB (${compressionRatio}% 削減)`);

      return base64;
    } catch (error) {
      console.error('❌ データ圧縮エラー:', error);
      throw new Error('データ圧縮に失敗しました');
    }
  };

  // データ解凍関数
  const decompressData = (base64String: string): string => {
    try {
      console.log('📤 データ解凍開始...');

      // Base64デコード
      const binaryString = atob(base64String);
      const compressed = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        compressed[i] = binaryString.charCodeAt(i);
      }

      // pako.inflateで解凍
      const decompressed = pako.inflate(compressed);

      // Uint8ArrayをUTF-8文字列に変換
      const decoder = new TextDecoder();
      const result = decoder.decode(decompressed);

      console.log('✅ 解凍完了');
      return result;
    } catch (error) {
      console.error('❌ データ解凍エラー:', error);
      throw new Error('データ解凍に失敗しました');
    }
  };

  // 圧縮データかどうかを判定
  const isCompressedData = (data: string): boolean => {
    // Base64文字列の特徴で判定
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Pattern.test(data) && data.length > 100;
  };

  // 初回読み込み
  useEffect(() => {
    loadStoredData();
    loadFavorites();
    loadHoldings();
    loadConsidering();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // localStorageからデータを読み込み（圧縮対応版 + SSR対応）
  const loadStoredData = () => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const rawData = localStorage.getItem(STORAGE_KEYS.STOCK_DATA);

      if (!rawData) {
        console.log('📭 localStorage: データが見つかりません');
        setStoredData(null);
        return;
      }

      let parsedData: StoredStockData;

      // 圧縮データかどうかを判定
      if (isCompressedData(rawData)) {
        console.log('🗜️ 圧縮データを検出、解凍中...');
        const decompressedData = decompressData(rawData);
        parsedData = JSON.parse(decompressedData);
        parsedData.isCompressed = true; // 圧縮フラグを設定
      } else {
        console.log('📄 非圧縮データを検出');
        parsedData = JSON.parse(rawData);
        parsedData.isCompressed = false;
      }

      // データバージョンチェック（旧バージョンも互換性保持）
      if (parsedData.version !== DATA_VERSION && parsedData.version !== '1.0.0' && parsedData.version !== '1.1.0') {
        console.warn(`⚠️ データバージョンが古いため削除: ${parsedData.version} → ${DATA_VERSION}`);
        localStorage.removeItem(STORAGE_KEYS.STOCK_DATA);
        setStoredData(null);
        return;
      }

      // バージョンを最新に更新、null警告情報が存在しない場合は初期化
      if (parsedData.version !== DATA_VERSION) {
        parsedData.version = DATA_VERSION;
        if (!parsedData.nullDataWarning) {
          parsedData.nullDataWarning = {
            hasNullData: false,
            totalStocksWithNullData: 0,
            totalNullDays: 0,
            lastOccurrence: '',
            summary: ''
          };
        }
      }

      console.log(`✅ localStorage: ${parsedData.totalStocks}銘柄のデータを読み込み`);
      console.log(`📅 最終更新: ${parsedData.lastUpdate}`);
      console.log(`🗜️ 圧縮状態: ${parsedData.isCompressed ? '圧縮済み' : '非圧縮'}`);

      if (parsedData.nullDataWarning?.hasNullData) {
        console.log(`⚠️ 前回のnullデータ警告: ${parsedData.nullDataWarning.summary}`);
      }

      setStoredData(parsedData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ localStorage読み込みエラー:', errorMessage);
      setError(`データ読み込みエラー: ${errorMessage}`);

      // 破損データを削除
      localStorage.removeItem(STORAGE_KEYS.STOCK_DATA);
      setStoredData(null);
    } finally {
      setLoading(false);
    }
  };

  // お気に入りデータを読み込み（SSR対応）
  const loadFavorites = () => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    try {
      const rawFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);

      if (!rawFavorites) {
        console.log('📭 localStorage: お気に入りデータが見つかりません');
        setFavorites([]);
        return;
      }

      const parsedFavorites: FavoritesData = JSON.parse(rawFavorites);

      // バージョンチェック
      if (parsedFavorites.version !== FAVORITES_VERSION) {
        console.warn(`⚠️ お気に入りデータのバージョンが古いため削除: ${parsedFavorites.version} → ${FAVORITES_VERSION}`);
        localStorage.removeItem(STORAGE_KEYS.FAVORITES);
        setFavorites([]);
        return;
      }

      console.log(`✅ localStorage: ${parsedFavorites.favorites.length}件のお気に入りを読み込み`);
      setFavorites(parsedFavorites.favorites);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ お気に入り読み込みエラー:', errorMessage);
      setFavorites([]);

      // 破損データを削除
      localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    }
  };

  // 保有銘柄データを読み込み（SSR対応）
  const loadHoldings = () => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    try {
      const rawHoldings = localStorage.getItem(STORAGE_KEYS.HOLDINGS);

      if (!rawHoldings) {
        console.log('📭 localStorage: 保有銘柄データが見つかりません');
        setHoldings([]);
        return;
      }

      const parsedHoldings: HoldingsData = JSON.parse(rawHoldings);

      // バージョンチェック
      if (parsedHoldings.version !== HOLDINGS_VERSION) {
        console.warn(`⚠️ 保有銘柄データのバージョンが古いため削除: ${parsedHoldings.version} → ${HOLDINGS_VERSION}`);
        localStorage.removeItem(STORAGE_KEYS.HOLDINGS);
        setHoldings([]);
        return;
      }

      console.log(`✅ localStorage: ${parsedHoldings.holdings.length}件の保有銘柄を読み込み`);
      setHoldings(parsedHoldings.holdings);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ 保有銘柄読み込みエラー:', errorMessage);
      setHoldings([]);

      // 破損データを削除
      localStorage.removeItem(STORAGE_KEYS.HOLDINGS);
    }
  };

  // 検討銘柄データを読み込み（SSR対応）
  const loadConsidering = () => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    try {
      const rawConsidering = localStorage.getItem(STORAGE_KEYS.CONSIDERING);

      if (!rawConsidering) {
        console.log('📭 localStorage: 検討銘柄データが見つかりません');
        setConsidering([]);
        return;
      }

      const parsedConsidering: ConsideringData = JSON.parse(rawConsidering);

      // バージョンチェック
      if (parsedConsidering.version !== CONSIDERING_VERSION) {
        console.warn(`⚠️ 検討銘柄データのバージョンが古いため削除: ${parsedConsidering.version} → ${CONSIDERING_VERSION}`);
        localStorage.removeItem(STORAGE_KEYS.CONSIDERING);
        setConsidering([]);
        return;
      }

      console.log(`✅ localStorage: ${parsedConsidering.considering.length}件の検討銘柄を読み込み`);
      setConsidering(parsedConsidering.considering);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ 検討銘柄読み込みエラー:', errorMessage);
      setConsidering([]);

      // 破損データを削除
      localStorage.removeItem(STORAGE_KEYS.CONSIDERING);
    }
  };

  // お気に入りデータを保存（SSR対応）
  const saveFavorites = (newFavorites: string[]) => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    try {
      const dataToSave: FavoritesData = {
        favorites: newFavorites,
        lastUpdate: new Date().toISOString(),
        version: FAVORITES_VERSION
      };

      const jsonData = JSON.stringify(dataToSave);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, jsonData);
      setFavorites(newFavorites);

      console.log(`✅ お気に入り保存完了: ${newFavorites.length}件`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ お気に入り保存エラー:', errorMessage);
      setError(`お気に入り保存エラー: ${errorMessage}`);
    }
  };

  // 保有銘柄データを保存（SSR対応）
  const saveHoldings = (newHoldings: string[]) => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    try {
      const dataToSave: HoldingsData = {
        holdings: newHoldings,
        lastUpdate: new Date().toISOString(),
        version: HOLDINGS_VERSION
      };

      const jsonData = JSON.stringify(dataToSave);
      localStorage.setItem(STORAGE_KEYS.HOLDINGS, jsonData);
      setHoldings(newHoldings);

      console.log(`✅ 保有銘柄保存完了: ${newHoldings.length}件`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ 保有銘柄保存エラー:', errorMessage);
      setError(`保有銘柄保存エラー: ${errorMessage}`);
    }
  };

  // 検討銘柄データを保存（SSR対応）
  const saveConsidering = (newConsidering: string[]) => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    try {
      const dataToSave: ConsideringData = {
        considering: newConsidering,
        lastUpdate: new Date().toISOString(),
        version: CONSIDERING_VERSION
      };

      const jsonData = JSON.stringify(dataToSave);
      localStorage.setItem(STORAGE_KEYS.CONSIDERING, jsonData);
      setConsidering(newConsidering);

      console.log(`✅ 検討銘柄保存完了: ${newConsidering.length}件`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ 検討銘柄保存エラー:', errorMessage);
      setError(`検討銘柄保存エラー: ${errorMessage}`);
    }
  };

  // localStorageにデータを保存（4.7MB超過時自動圧縮対応版 + SSR対応 + null関連実装対応）
  const saveStockData = (
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
  ) => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    try {
      console.log(`💾 localStorage: ${stocks.length}銘柄のデータを保存開始...`);

      const nullWarning = generateNullWarningInfo(nullDataSummary);

      const dataToSave: StoredStockData = {
        stocks,
        dailyDataMap,
        lastUpdate: new Date().toISOString(),
        version: DATA_VERSION,
        totalStocks: stocks.length,
        isCompressed: false, // 初期は非圧縮
        nullDataWarning: nullWarning
      };

      const jsonData = JSON.stringify(dataToSave);
      const originalSizeInMB = (jsonData.length / 1024 / 1024).toFixed(2);

      console.log(`📊 元データサイズ: ${originalSizeInMB}MB`);

      if (nullWarning) {
        console.log(`⚠️ nullデータ警告情報を保存: ${nullWarning.summary}`);
      }

      let finalData: string;
      let wasCompressed = false;

      // 4.7MBを超える場合は圧縮
      if (jsonData.length > COMPRESSION_THRESHOLD) {
        console.log('⚠️ データサイズが4.7MBを超えているため、圧縮を実行します');

        try {
          finalData = compressData(jsonData);
          wasCompressed = true;

          // 圧縮後のデータサイズをチェック
          if (finalData.length > COMPRESSION_THRESHOLD) {
            throw new Error(`圧縮後もデータサイズが制限を超えています: ${(finalData.length / 1024 / 1024).toFixed(2)}MB（制限: 4.7MB）`);
          }

        } catch (compressionError) {
          console.error('❌ 圧縮処理に失敗:', compressionError);
          throw new Error(`圧縮処理に失敗しました: ${compressionError instanceof Error ? compressionError.message : '不明なエラー'}`);
        }

      } else {
        console.log('📝 データサイズが4.7MB以下のため、非圧縮で保存します');
        finalData = jsonData;
      }

      const finalSizeInMB = (finalData.length / 1024 / 1024).toFixed(2);
      console.log(`📊 最終データサイズ: ${finalSizeInMB}MB (${wasCompressed ? '圧縮済み' : '非圧縮'})`);

      // localStorage最終チェック
      if (finalData.length > COMPRESSION_THRESHOLD) {
        throw new Error(`データサイズが制限を超えています: ${finalSizeInMB}MB（制限: 4.7MB）`);
      }

      localStorage.setItem(STORAGE_KEYS.STOCK_DATA, finalData);

      // stateの更新（圧縮フラグも更新）
      const updatedData = { ...dataToSave, isCompressed: wasCompressed };
      setStoredData(updatedData);
      setError(null);

      console.log(`✅ localStorage: 保存完了 (${finalSizeInMB}MB, ${wasCompressed ? '圧縮済み' : '非圧縮'})`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ localStorage保存エラー:', errorMessage);
      setError(`データ保存エラー: ${errorMessage}`);
    }
  };

  // localStorageのデータをクリア（SSR対応）
  const clearStoredData = () => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEYS.STOCK_DATA);
      setStoredData(null);
      setError(null);
      console.log('🗑️ localStorage: データを削除しました');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ localStorageクリアエラー:', errorMessage);
      setError(`データクリアエラー: ${errorMessage}`);
    }
  };

  // 特定銘柄のデータを取得
  const getStoredStock = (stockCode: string): { stock: StoredStock; dailyData: DailyData[] } | null => {
    if (!storedData) return null;

    const stock = storedData.stocks.find(s => s.code === stockCode);
    const dailyData = storedData.dailyDataMap[stockCode];

    if (!stock || !dailyData) return null;

    return { stock, dailyData };
  };

  // お気に入り追加（SSR対応）
  const addFavorite = (stockCode: string) => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    // localStorage から最新のお気に入りデータを直接読み込む
    let currentFavorites: string[] = [];

    try {
      const rawFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (rawFavorites) {
        const parsedFavorites: FavoritesData = JSON.parse(rawFavorites);
        if (parsedFavorites.version === FAVORITES_VERSION) {
          currentFavorites = parsedFavorites.favorites;
        }
      }
    } catch (err) {
      console.error('❌ お気に入り読み込みエラー:', err);
      currentFavorites = [];
    }

    // 既に登録済みかチェック
    if (currentFavorites.includes(stockCode)) {
      console.log(`⚠️ ${stockCode} は既にお気に入りに登録済みです`);
      return;
    }

    // 新しいお気に入りリストを作成
    const newFavorites = [...currentFavorites, stockCode];
    saveFavorites(newFavorites);
    console.log(`⭐ ${stockCode} をお気に入りに追加しました`);
  };

  // お気に入り削除（SSR対応）
  const removeFavorite = (stockCode: string) => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    // localStorage から最新のお気に入りデータを直接読み込む
    let currentFavorites: string[] = [];

    try {
      const rawFavorites = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (rawFavorites) {
        const parsedFavorites: FavoritesData = JSON.parse(rawFavorites);
        if (parsedFavorites.version === FAVORITES_VERSION) {
          currentFavorites = parsedFavorites.favorites;
        }
      }
    } catch (err) {
      console.error('❌ お気に入り読み込みエラー:', err);
      currentFavorites = [];
    }

    // お気に入りから削除
    const newFavorites = currentFavorites.filter(code => code !== stockCode);
    saveFavorites(newFavorites);
    console.log(`🗑️ ${stockCode} をお気に入りから削除しました`);
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

    // お気に入り銘柄のデータを取得
    const favoriteStocks = storedData.stocks.filter(stock => favorites.includes(stock.code));

    // 銘柄コード（数値）で昇順ソート
    return favoriteStocks.sort((a, b) => {
      const codeA = parseInt(a.code, 10);
      const codeB = parseInt(b.code, 10);
      return codeA - codeB;
    });
  };

  // 保有銘柄追加（SSR対応）
  const addHolding = (stockCode: string) => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    // localStorage から最新の保有銘柄データを直接読み込む
    let currentHoldings: string[] = [];

    try {
      const rawHoldings = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
      if (rawHoldings) {
        const parsedHoldings: HoldingsData = JSON.parse(rawHoldings);
        if (parsedHoldings.version === HOLDINGS_VERSION) {
          currentHoldings = parsedHoldings.holdings;
        }
      }
    } catch (err) {
      console.error('❌ 保有銘柄読み込みエラー:', err);
      currentHoldings = [];
    }

    // 既に登録済みかチェック
    if (currentHoldings.includes(stockCode)) {
      console.log(`⚠️ ${stockCode} は既に保有銘柄に登録済みです`);
      return;
    }

    // 新しい保有銘柄リストを作成
    const newHoldings = [...currentHoldings, stockCode];
    saveHoldings(newHoldings);
    console.log(`💼 ${stockCode} を保有銘柄に追加しました`);
  };

  // 保有銘柄削除（SSR対応）
  const removeHolding = (stockCode: string) => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    // localStorage から最新の保有銘柄データを直接読み込む
    let currentHoldings: string[] = [];

    try {
      const rawHoldings = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
      if (rawHoldings) {
        const parsedHoldings: HoldingsData = JSON.parse(rawHoldings);
        if (parsedHoldings.version === HOLDINGS_VERSION) {
          currentHoldings = parsedHoldings.holdings;
        }
      }
    } catch (err) {
      console.error('❌ 保有銘柄読み込みエラー:', err);
      currentHoldings = [];
    }

    // 保有銘柄から削除
    const newHoldings = currentHoldings.filter(code => code !== stockCode);
    saveHoldings(newHoldings);
    console.log(`🗑️ ${stockCode} を保有銘柄から削除しました`);
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

  // 検討銘柄追加（SSR対応）
  const addConsidering = (stockCode: string) => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    // localStorage から最新の検討銘柄データを直接読み込む
    let currentConsidering: string[] = [];

    try {
      const rawConsidering = localStorage.getItem(STORAGE_KEYS.CONSIDERING);
      if (rawConsidering) {
        const parsedConsidering: ConsideringData = JSON.parse(rawConsidering);
        if (parsedConsidering.version === CONSIDERING_VERSION) {
          currentConsidering = parsedConsidering.considering;
        }
      }
    } catch (err) {
      console.error('❌ 検討銘柄読み込みエラー:', err);
      currentConsidering = [];
    }

    // 既に登録済みかチェック
    if (currentConsidering.includes(stockCode)) {
      console.log(`⚠️ ${stockCode} は既に検討銘柄に登録済みです`);
      return;
    }

    // 新しい検討銘柄リストを作成
    const newConsidering = [...currentConsidering, stockCode];
    saveConsidering(newConsidering);
    console.log(`🔍 ${stockCode} を検討銘柄に追加しました`);
  };

  // 検討銘柄削除（SSR対応）
  const removeConsidering = (stockCode: string) => {
    // サーバーサイドでは何もしない
    if (typeof window === 'undefined') return;

    // localStorage から最新の検討銘柄データを直接読み込む
    let currentConsidering: string[] = [];

    try {
      const rawConsidering = localStorage.getItem(STORAGE_KEYS.CONSIDERING);
      if (rawConsidering) {
        const parsedConsidering: ConsideringData = JSON.parse(rawConsidering);
        if (parsedConsidering.version === CONSIDERING_VERSION) {
          currentConsidering = parsedConsidering.considering;
        }
      }
    } catch (err) {
      console.error('❌ 検討銘柄読み込みエラー:', err);
      currentConsidering = [];
    }

    // 検討銘柄から削除
    const newConsidering = currentConsidering.filter(code => code !== stockCode);
    saveConsidering(newConsidering);
    console.log(`🗑️ ${stockCode} を検討銘柄から削除しました`);
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

    // 検討銘柄のデータを取得
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

  // 銘柄ステータス設定（排他制御付き統合機能）
  const setStockStatus = (stockCode: string, status: 'none' | 'watching' | 'considering' | 'holding') => {
    // まず全てのリストから削除
    removeFavorite(stockCode);
    removeConsidering(stockCode);
    removeHolding(stockCode);

    // 新しいステータスを設定
    switch (status) {
      case 'watching':
        addFavorite(stockCode);
        break;
      case 'considering':
        addConsidering(stockCode);
        break;
      case 'holding':
        addHolding(stockCode);
        break;
      case 'none':
        // 何もしない（既に全て削除済み）
        break;
    }
  };

  // データの存在確認
  const isDataAvailable = storedData !== null && storedData.stocks.length > 0;

  // データの日時を計算（yyyy-mm-dd hh:mm形式）
  const dataAge = storedData ? (() => {
    const lastUpdate = new Date(storedData.lastUpdate);

    // yyyy-mm-dd hh:mm形式にフォーマット
    const year = lastUpdate.getFullYear();
    const month = String(lastUpdate.getMonth() + 1).padStart(2, '0');
    const day = String(lastUpdate.getDate()).padStart(2, '0');
    const hours = String(lastUpdate.getHours()).padStart(2, '0');
    const minutes = String(lastUpdate.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  })() : null;

  // ストレージ使用量を計算（圧縮対応版 + SSR対応）
  const storageUsage = (() => {
    // サーバーサイドでは0Bを返す
    if (typeof window === 'undefined') return '0B';

    try {
      const stockData = localStorage.getItem(STORAGE_KEYS.STOCK_DATA);
      const favoritesData = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      const holdingsData = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
      const consideringData = localStorage.getItem(STORAGE_KEYS.CONSIDERING);

      const stockDataSize = stockData ? stockData.length : 0;
      const favoritesDataSize = favoritesData ? favoritesData.length : 0;
      const holdingsDataSize = holdingsData ? holdingsData.length : 0;
      const consideringDataSize = consideringData ? consideringData.length : 0;
      const totalSize = stockDataSize + favoritesDataSize + holdingsDataSize + consideringDataSize;

      const sizeInMB = (totalSize / 1024 / 1024).toFixed(2);

      // 圧縮状態を表示
      let compressionInfo = '';
      if (stockData && isCompressedData(stockData)) {
        compressionInfo = ' (圧縮済み)';
      } else if (stockData) {
        compressionInfo = ' (非圧縮)';
      }

      return `${sizeInMB}MB${compressionInfo}`;
    } catch {
      return '不明';
    }
  })();

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