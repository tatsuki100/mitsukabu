// ========================================
// src/app/api/stocks/route.ts
// 全銘柄の株価データ一括取得API（Neon DBから直接取得）
// ========================================

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { DailyData, StoredStock } from '@/types/stockData';

// ビルド時の静的生成を防止
export const dynamic = 'force-dynamic';

// DBの行の型定義
type StockDataRow = {
  stock_code: string;
  stock_name: string;
  daily_data: DailyData[];
  last_update: string;
};

// DBの行からStoredStockを生成
const buildStoredStock = (row: StockDataRow): StoredStock => {
  const dailyData = row.daily_data;

  if (!dailyData || dailyData.length === 0) {
    return {
      code: row.stock_code,
      name: row.stock_name,
      closePrice: 0,
      openPrice: 0,
      highPrice: 0,
      lowPrice: 0,
      previousClosePrice: 0,
      lastUpdated: new Date(row.last_update + '+00:00').toISOString().split('T')[0],
    };
  }

  const latest = dailyData[dailyData.length - 1];
  const previous = dailyData.length > 1 ? dailyData[dailyData.length - 2] : latest;

  return {
    code: row.stock_code,
    name: row.stock_name,
    closePrice: latest.close,
    openPrice: latest.open,
    highPrice: latest.high,
    lowPrice: latest.low,
    previousClosePrice: previous.close,
    lastUpdated: latest.date,
  };
};

// DBから全銘柄を取得
const getAllStocks = async () => {
  const sql = getDb();

  const rows = await sql`
    SELECT stock_code, stock_name, daily_data, last_update
    FROM stock_data
    ORDER BY stock_code ASC
  `;

  const stocks: StoredStock[] = [];
  const dailyDataMap: Record<string, DailyData[]> = {};
  let latestUpdate = '';

  for (const row of rows) {
    const typedRow = row as unknown as StockDataRow;
    const stock = buildStoredStock(typedRow);
    stocks.push(stock);
    dailyDataMap[typedRow.stock_code] = typedRow.daily_data;

    const lastUpdate = new Date(typedRow.last_update + '+00:00').toISOString();
    if (lastUpdate > latestUpdate) {
      latestUpdate = lastUpdate;
    }
  }

  return {
    stocks,
    dailyDataMap,
    lastUpdate: latestUpdate,
    totalStocks: stocks.length,
  };
};

// GET /api/stocks
export async function GET() {
  try {
    const data = await getAllStocks();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/stocks エラー:', error);
    return NextResponse.json(
      { error: '株価データの取得に失敗しました' },
      { status: 500 }
    );
  }
}
