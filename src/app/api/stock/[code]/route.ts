// ========================================
// src/app/api/stock/[code]/route.ts
// Yahoo Finance APIのプロキシAPI
// ========================================

import { NextRequest, NextResponse } from 'next/server';

// Yahoo Finance APIのレスポンス型定義
type YahooFinanceResponse = {
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
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }];
      };
    }> | null;
    error: null | string;
  };
};

// GET リクエストハンドラ
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const stockCode = params.code;
    
    // 銘柄コードの基本的なバリデーション
    if (!stockCode || !/^\d{4}$/.test(stockCode)) {
      return NextResponse.json(
        { error: '無効な銘柄コードです。4桁の数字を入力してください。' },
        { status: 400 }
      );
    }

    console.log(`📡 Yahoo Finance API取得開始: ${stockCode}`);

    // Yahoo Finance APIのURL生成（7〜8ヶ月のデータが必要だが、localstorageは5MBが上限）
    const yahooURL = `https://query1.finance.yahoo.com/v8/finance/chart/${stockCode}.T?interval=1d&range=7mo`;
    
    // Yahoo Finance APIへのリクエスト
    const response = await fetch(yahooURL, {
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
      console.error(`Yahoo Finance API HTTP Error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Yahoo Finance APIエラー: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // レスポンスをJSONとしてパース
    const data: YahooFinanceResponse = await response.json();

    // Yahoo Finance APIのエラーチェック
    if (data.chart.error) {
      console.error(`Yahoo Finance API Error: ${data.chart.error}`);
      return NextResponse.json(
        { error: `Yahoo Finance APIエラー: ${data.chart.error}` },
        { status: 400 }
      );
    }

    // データ存在チェック
    if (!data.chart.result || data.chart.result.length === 0) {
      console.error(`銘柄データが見つかりません: ${stockCode}`);
      return NextResponse.json(
        { error: `銘柄データが見つかりません: ${stockCode}` },
        { status: 404 }
      );
    }

    const result = data.chart.result[0];
    
    // 必要なデータが存在するかチェック
    if (!result.timestamp || !result.indicators?.quote?.[0]) {
      console.error(`不完全なデータ: ${stockCode}`);
      return NextResponse.json(
        { error: `不完全なデータが返されました: ${stockCode}` },
        { status: 400 }
      );
    }

    console.log(`Yahoo Finance API取得成功: ${stockCode} - ${result.timestamp.length}日分のデータ`);

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      stockCode,
      data: data,
      dataPoints: result.timestamp.length,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Route内部エラー:', error);
    
    return NextResponse.json(
      { 
        error: '内部サーバーエラーが発生しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}