// ========================================
// src/app/api/auth/forgot-password/route.ts
// パスワードリセットメール送信API
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

// DBから取得するユーザー行の型
type UserRow = {
  id: number;
  user_name: string;
};

// POST /api/auth/forgot-password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // バリデーション
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'メールアドレスを入力してください' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // メールアドレスでユーザーを検索
    const rows = await sql`
      SELECT id, user_name FROM users WHERE email = ${email.toLowerCase()}
    `;

    // ★ セキュリティ: ユーザーが存在しなくても同じレスポンスを返す
    if (rows.length > 0) {
      const user = rows[0] as unknown as UserRow;

      // トークン生成（256ビットのランダムバイト）
      const rawToken = crypto.randomBytes(32).toString('hex');

      // SHA-256ハッシュをDBに保存
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // 既存の未使用トークンを無効化（1ユーザーにつき有効なトークンは1つだけ）
      await sql`
        UPDATE password_reset_tokens
        SET used = TRUE
        WHERE user_id = ${user.id} AND used = FALSE
      `;

      // 新しいトークンを保存（有効期限: 1時間）
      await sql`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (${user.id}, ${tokenHash}, NOW() + INTERVAL '1 hour')
      `;

      // リセットURLを生成
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.mitsukabu.com';
      const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

      // メール送信
      await sendPasswordResetEmail(email.toLowerCase(), resetUrl);
    }

    // ★ ユーザーの有無に関係なく同じメッセージを返す
    return NextResponse.json({
      success: true,
      message: 'メールアドレスが登録されていれば、再設定用のリンクを送信しました',
    });

  } catch (error) {
    console.error('POST /api/auth/forgot-password エラー:', error);
    return NextResponse.json(
      { error: 'メールの送信に失敗しました。しばらくしてからもう一度お試しください' },
      { status: 500 }
    );
  }
}
