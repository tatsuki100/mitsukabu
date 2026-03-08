// ========================================
// src/app/api/auth/reset-password/route.ts
// パスワードリセット実行API
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';

// DBから取得するトークン行の型
type TokenRow = {
  id: number;
  user_id: number;
  expires_at: string;
};

// POST /api/auth/reset-password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // バリデーション
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: '無効なリクエストです' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: '新しいパスワードを入力してください' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上で入力してください' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // トークンのハッシュ化
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // トークンを検索（未使用 & 有効期限内）
    const rows = await sql`
      SELECT id, user_id, expires_at
      FROM password_reset_tokens
      WHERE token_hash = ${tokenHash}
        AND used = FALSE
        AND expires_at > NOW()
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'リセットリンクが無効または有効期限切れです。もう一度パスワードリセットを行ってください' },
        { status: 400 }
      );
    }

    const tokenRow = rows[0] as unknown as TokenRow;

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    // パスワード更新
    await sql`
      UPDATE users SET password_hash = ${passwordHash} WHERE id = ${tokenRow.user_id}
    `;

    // トークンを使用済みにする
    await sql`
      UPDATE password_reset_tokens SET used = TRUE WHERE id = ${tokenRow.id}
    `;

    return NextResponse.json({
      success: true,
      message: 'パスワードが更新されました。ログインしてください',
    });

  } catch (error) {
    console.error('POST /api/auth/reset-password エラー:', error);
    return NextResponse.json(
      { error: 'パスワードの更新に失敗しました' },
      { status: 500 }
    );
  }
}
