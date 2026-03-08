// ========================================
// src/app/api/stock-status/route.ts
// 銘柄ステータス変更API（排他制御付きトランザクション）
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// ビルド時の静的生成を防止
export const dynamic = 'force-dynamic';

// 有効なステータス値
const VALID_STATUSES = ['none', 'watching', 'considering', 'holding'] as const;
type StockStatus = typeof VALID_STATUSES[number];

// ステータスとテーブル名のマッピング
const STATUS_TABLE_MAP: Record<Exclude<StockStatus, 'none'>, string> = {
  watching: 'favorites',
  considering: 'considering',
  holding: 'holdings',
};

// PUT /api/stock-status
export async function PUT(request: NextRequest) {
  try {
    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { stockCode, status } = body;

    // バリデーション
    if (!stockCode || typeof stockCode !== 'string') {
      return NextResponse.json(
        { error: '銘柄コードが必要です' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `無効なステータスです: ${status}` },
        { status: 400 }
      );
    }

    const sql = getDb();
    const userId = user.userId;

    // トランザクション: 全テーブルから削除 → 対象テーブルに挿入
    const queries = [
      sql`DELETE FROM favorites WHERE user_id = ${userId} AND stock_code = ${stockCode}`,
      sql`DELETE FROM holdings WHERE user_id = ${userId} AND stock_code = ${stockCode}`,
      sql`DELETE FROM considering WHERE user_id = ${userId} AND stock_code = ${stockCode}`,
    ];

    // status が 'none' 以外の場合、対象テーブルに挿入
    if (status !== 'none') {
      const tableName = STATUS_TABLE_MAP[status as Exclude<StockStatus, 'none'>];
      // neonのtagged template literalではテーブル名を動的に渡せないため、条件分岐で対応
      if (tableName === 'favorites') {
        queries.push(
          sql`INSERT INTO favorites (user_id, stock_code) VALUES (${userId}, ${stockCode}) ON CONFLICT (user_id, stock_code) DO NOTHING`
        );
      } else if (tableName === 'considering') {
        queries.push(
          sql`INSERT INTO considering (user_id, stock_code) VALUES (${userId}, ${stockCode}) ON CONFLICT (user_id, stock_code) DO NOTHING`
        );
      } else if (tableName === 'holdings') {
        queries.push(
          sql`INSERT INTO holdings (user_id, stock_code) VALUES (${userId}, ${stockCode}) ON CONFLICT (user_id, stock_code) DO NOTHING`
        );
      }
    }

    // トランザクションで実行
    await sql.transaction(queries);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('PUT /api/stock-status エラー:', error);
    return NextResponse.json(
      { error: 'ステータスの更新に失敗しました' },
      { status: 500 }
    );
  }
}
