// ========================================
// src/types/stockData.ts
// 株価データの型定義
// ========================================

// 日足データの型定義
export type DailyData = {
  date: string;      // 例:"2025-01-27"
  open: number;      // 始値
  close: number;     // 終値
  high: number;      // 高値
  low: number;       // 安値
  volume: number;    // 出来高
};

// 銘柄基本情報の型定義
export type StockInfo = {
  code: string;      // 銘柄コード
  name: string;      // 銘柄名（日本語）
  market: string;    // 市場区分
};

// localStorage保存用の株価データ型
export type StoredStock = {
  code: string;
  name: string;
  closePrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClosePrice: number;
  lastUpdated: string;
};

// Yahoo Finance API用のStock型
export type YahooStock = {
  code: string;
  name: string;
  closePrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClosePrice: number;
  lastUpdated: string;
  // 注：移動平均線・RSIはフロントエンドで計算するためnull
  movingAverageLine: {
    shortTerm: null;
    midTerm: null;
    longTerm: null;
  };
  rsi: {
    value: null;
    period: number;
  };
};

// チャート表示設定
export const CHART_PERIODS = {
  LIST_VIEW: 45,     // 一覧画面での表示期間（日数）
  DETAIL_VIEW: 100   // 個別画面での表示期間（日数）
} as const;


// RSIの計算期間
export const RSI_DEFAULT_PERIOD = 9;


// 移動平均線の期間設定（変更する場合はsrc/components/StockChart.tsxにもハードコードされているのでそっちも変更すること。）
export const MA_PERIODS = {
  SHORT: 5,    // 短期移動平均線
  MEDIUM: 25,  // 中期移動平均線
  LONG: 75     // 長期移動平均線
} as const;