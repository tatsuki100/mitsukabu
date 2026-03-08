// ========================================
// lambda/fetchYahooFinance.ts
// Yahoo Finance APIリクエスト + リトライ
// 流用元: src/hooks/useYahooFinanceAPI.ts fetchSingleStockWithRetry (L197-267)
// 変更点: useState除去、Yahoo Finance APIに直接リクエスト（内部APIルート経由ではなく）
// ========================================

import { convertYahooToDailyData, DailyData, YahooFinanceResponse } from './convertData';

// 取得結果の型
export type StockFetchResult = {
  success: boolean;
  stockCode: string;
  stockName: string;
  dailyData?: DailyData[];
  nullWarning?: {
    hasNullData: boolean;
    nullDates: string[];
    totalNullDays: number;
  };
  error?: string;
};

// Yahoo Finance APIのURL生成（直接アクセス）
const generateYahooFinanceURL = (stockCode: string): string => {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${stockCode}.T?interval=1d&range=7mo`;
};

// 単一銘柄のデータ取得（リトライ機能付き）
export const fetchSingleStock = async (
  stockCode: string,
  stockName: string,
  maxRetries: number = 3
): Promise<StockFetchResult> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`${stockCode} (${stockName}): 取得試行 ${attempt}/${maxRetries}`);

      const url = generateYahooFinanceURL(stockCode);

      // Yahoo Finance APIに直接リクエスト
      // ヘッダー: src/app/api/stock/[code]/route.ts (L59-64) と同じ
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });

      // HTTPステータスチェック
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data: YahooFinanceResponse = await response.json();

      // Yahoo Finance APIのエラーチェック
      if (data.chart.error) {
        throw new Error(`Yahoo Finance API Error: ${data.chart.error}`);
      }

      // データ存在チェック
      if (!data.chart.result || data.chart.result.length === 0) {
        throw new Error('データが見つかりません');
      }

      const result = data.chart.result[0];

      // 必要なデータの存在チェック
      if (!result.timestamp || !result.indicators?.quote?.[0]) {
        throw new Error('不完全なデータが返されました');
      }

      // データ変換（nullフィルタリング込み）
      const { dailyData, nullWarning } = convertYahooToDailyData(data);

      // nullデータがあった場合はログ出力
      if (nullWarning.hasNullData) {
        console.log(`${stockCode} (${stockName}): ${nullWarning.totalNullDays}日分のnullデータを除外 - ${nullWarning.nullDates.join(', ')}`);
      }

      console.log(`${stockCode} (${stockName}): 取得成功 - ${dailyData.length}日分のデータ`);

      return {
        success: true,
        stockCode,
        stockName,
        dailyData,
        nullWarning
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      console.log(`${stockCode} (${stockName}): 試行 ${attempt} 失敗 - ${errorMessage}`);

      if (attempt === maxRetries) {
        console.error(`${stockCode} (${stockName}): 最終的に失敗`);
        return {
          success: false,
          stockCode,
          stockName,
          error: errorMessage
        };
      }

      // リトライ前に2秒待機
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return {
    success: false,
    stockCode,
    stockName,
    error: '最大試行回数に達しました'
  };
};
