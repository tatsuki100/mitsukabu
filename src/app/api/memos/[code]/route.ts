// ========================================
// src/app/api/memos/[code]/route.ts
// メモCRUD API（UPSERT / DELETE）
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// ビルド時の静的生成を防止
export const dynamic = 'force-dynamic';

// PUT /api/memos/[code] - メモの保存（UPSERT）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { code: stockCode } = await params;
    const body = await request.json();
    const { memo } = body;

    // バリデーション
    if (typeof memo !== 'string') {
      return NextResponse.json(
        { error: 'メモの内容が必要です' },
        { status: 400 }
      );
    }

    if (memo.length > 500) {
      return NextResponse.json(
        { error: 'メモは500文字以内で入力してください' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // UPSERT: 存在すれば更新、なければ挿入
    await sql`
      INSERT INTO memos (user_id, stock_code, memo)
      VALUES (${user.userId}, ${stockCode}, ${memo})
      ON CONFLICT (user_id, stock_code)
      DO UPDATE SET memo = ${memo}, updated_at = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('PUT /api/memos エラー:', error);
    return NextResponse.json(
      { error: 'メモの保存に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE /api/memos/[code] - メモの削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // 認証チェック
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { code: stockCode } = await params;
    const sql = getDb();

    await sql`
      DELETE FROM memos
      WHERE user_id = ${user.userId} AND stock_code = ${stockCode}
    `;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('DELETE /api/memos エラー:', error);
    return NextResponse.json(
      { error: 'メモの削除に失敗しました' },
      { status: 500 }
    );
  }
}
