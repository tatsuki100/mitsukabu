// ========================================
// src/app/api/stocks/[code]/route.ts
// 個別銘柄の株価データ取得API
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { DailyData, StoredStock } from '@/types/stockData';

// GET /api/stocks/[code]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code: stockCode } = await context.params;

    // 銘柄コードのバリデーション
    if (!stockCode || !/^\d{4}$/.test(stockCode)) {
      return NextResponse.json(
        { error: '無効な銘柄コードです。4桁の数字を入力してください。' },
        { status: 400 }
      );
    }

    const sql = getDb();

    const rows = await sql`
      SELECT stock_code, stock_name, daily_data, last_update
      FROM stock_data
      WHERE stock_code = ${stockCode}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: `銘柄データが見つかりません: ${stockCode}` },
        { status: 404 }
      );
    }

    const row = rows[0];
    const dailyData = row.daily_data as DailyData[];
    const lastUpdate = new Date(row.last_update as string).toISOString();

    // StoredStockの構築
    let stock: StoredStock;
    if (!dailyData || dailyData.length === 0) {
      stock = {
        code: stockCode,
        name: row.stock_name as string,
        closePrice: 0,
        openPrice: 0,
        highPrice: 0,
        lowPrice: 0,
        previousClosePrice: 0,
        lastUpdated: lastUpdate.split('T')[0],
      };
    } else {
      const latest = dailyData[dailyData.length - 1];
      const previous = dailyData.length > 1 ? dailyData[dailyData.length - 2] : latest;
      stock = {
        code: stockCode,
        name: row.stock_name as string,
        closePrice: latest.close,
        openPrice: latest.open,
        highPrice: latest.high,
        lowPrice: latest.low,
        previousClosePrice: previous.close,
        lastUpdated: latest.date,
      };
    }

    return NextResponse.json({
      stock,
      dailyData,
      lastUpdate,
    });
  } catch (error) {
    console.error('GET /api/stocks/[code] エラー:', error);
    return NextResponse.json(
      { error: '株価データの取得に失敗しました' },
      { status: 500 }
    );
  }
}
