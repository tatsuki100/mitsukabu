// ========================================
// lambda/convertData.ts
// データ変換（filterNullData, convertYahooToDailyData）
// src/hooks/useYahooFinanceAPI.ts のコアロジックを移植
// ========================================

// DailyData型（src/types/stockData.ts と同じ定義）
export type DailyData = {
  date: string;      // 例:"2025-01-27"
  open: number;      // 始値
  close: number;     // 終値
  high: number;      // 高値
  low: number;       // 安値
  volume: number;    // 出来高
};

// Yahoo Finance APIのレスポンス型定義
export type YahooFinanceResponse = {
  chart: {
    result: Array<{
      meta: {
        currency: string;
        symbol: string;
        regularMarketPrice: number;
        chartPreviousClose: number;
        longName: string;
        shortName: string;
      };
      timestamp: number[];
      indicators: {
        quote: [{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }];
      };
    }> | null;
    error: string | null;
  };
};

// nullデータのフィルタリング結果
type FilterResult = {
  filteredData: {
    timestamps: number[];
    open: number[];
    high: number[];
    low: number[];
    close: number[];
    volume: number[];
  };
  nullWarning: {
    hasNullData: boolean;
    nullDates: string[];
    totalNullDays: number;
  };
};

// nullデータを検出し、フィルタリングする関数
// 流用元: src/hooks/useYahooFinanceAPI.ts filterNullData (L66-121)
export const filterNullData = (
  timestamps: number[],
  open: (number | null)[],
  high: (number | null)[],
  low: (number | null)[],
  close: (number | null)[],
  volume: (number | null)[]
): FilterResult => {
  const nullDates: string[] = [];
  const validIndices: number[] = [];

  // nullデータを検出
  timestamps.forEach((timestamp, index) => {
    const hasNull = (
      open[index] === null ||
      high[index] === null ||
      low[index] === null ||
      close[index] === null ||
      volume[index] === null
    );

    if (hasNull) {
      // null データがある日付を記録
      const date = new Date(timestamp * 1000);
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
      nullDates.push(formattedDate);
      console.log(`nullデータ検出: ${formattedDate} - Open:${open[index]}, High:${high[index]}, Low:${low[index]}, Close:${close[index]}, Volume:${volume[index]}`);
    } else {
      validIndices.push(index);
    }
  });

  // 有効なデータのみを抽出
  const filteredTimestamps = validIndices.map(i => timestamps[i]);
  const filteredOpen = validIndices.map(i => open[i] as number);
  const filteredHigh = validIndices.map(i => high[i] as number);
  const filteredLow = validIndices.map(i => low[i] as number);
  const filteredClose = validIndices.map(i => close[i] as number);
  const filteredVolume = validIndices.map(i => volume[i] as number);

  return {
    filteredData: {
      timestamps: filteredTimestamps,
      open: filteredOpen,
      high: filteredHigh,
      low: filteredLow,
      close: filteredClose,
      volume: filteredVolume
    },
    nullWarning: {
      hasNullData: nullDates.length > 0,
      nullDates,
      totalNullDays: nullDates.length
    }
  };
};

// Yahoo APIレスポンス → DailyData配列に変換（nullフィルタリング対応）
// 流用元: src/hooks/useYahooFinanceAPI.ts convertYahooToDailyData (L124-150)
export const convertYahooToDailyData = (
  yahooResponse: YahooFinanceResponse
): { dailyData: DailyData[]; nullWarning: { hasNullData: boolean; nullDates: string[]; totalNullDays: number } } => {
  const result = yahooResponse.chart.result![0];
  const timestamps = result.timestamp;
  const quote = result.indicators.quote[0];

  // nullデータをフィルタリング
  const { filteredData, nullWarning } = filterNullData(
    timestamps,
    quote.open,
    quote.high,
    quote.low,
    quote.close,
    quote.volume
  );

  // フィルタリングされたデータからDailyDataを作成
  const dailyData = filteredData.timestamps.map((timestamp, index) => ({
    date: new Date(timestamp * 1000).toISOString().split('T')[0],
    open: filteredData.open[index],
    close: filteredData.close[index],
    high: filteredData.high[index],
    low: filteredData.low[index],
    volume: filteredData.volume[index]
  }));

  return { dailyData, nullWarning };
};
