// ========================================
// src/app/api/user-data/route.ts
// ユーザーデータ一括取得API（観察・検討・保有銘柄 + メモ）
// ========================================

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// ビルド時の静的生成を防止
export const dynamic = 'force-dynamic';

// DBの行の型定義
type StockCodeRow = {
  stock_code: string;
};

type MemoRow = {
  stock_code: string;
  memo: string;
};

// GET /api/user-data
export async function GET() {
  try {
    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const sql = getDb();

    // 4テーブルを並列クエリ
    const [favoritesRows, holdingsRows, consideringRows, memosRows] = await Promise.all([
      sql`SELECT stock_code FROM favorites WHERE user_id = ${user.userId} ORDER BY created_at ASC`,
      sql`SELECT stock_code FROM holdings WHERE user_id = ${user.userId} ORDER BY created_at ASC`,
      sql`SELECT stock_code FROM considering WHERE user_id = ${user.userId} ORDER BY created_at ASC`,
      sql`SELECT stock_code, memo FROM memos WHERE user_id = ${user.userId}`,
    ]);

    // レスポンス形式に変換
    const favorites = (favoritesRows as unknown as StockCodeRow[]).map(row => row.stock_code);
    const holdings = (holdingsRows as unknown as StockCodeRow[]).map(row => row.stock_code);
    const considering = (consideringRows as unknown as StockCodeRow[]).map(row => row.stock_code);

    const memos: Record<string, string> = {};
    for (const row of memosRows as unknown as MemoRow[]) {
      memos[row.stock_code] = row.memo;
    }

    return NextResponse.json({
      favorites,
      holdings,
      considering,
      memos,
    });

  } catch (error) {
    console.error('GET /api/user-data エラー:', error);
    return NextResponse.json(
      { error: 'ユーザーデータの取得に失敗しました' },
      { status: 500 }
    );
  }
}
