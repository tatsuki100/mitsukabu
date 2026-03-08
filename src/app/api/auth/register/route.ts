// ========================================
// src/app/api/auth/register/route.ts
// ユーザー登録API
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { signToken, setTokenCookie } from '@/lib/auth';

// POST /api/auth/register
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName, email, password } = body;

    // バリデーション
    if (!userName || typeof userName !== 'string') {
      return NextResponse.json(
        { error: 'ユーザー名を入力してください' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'パスワードを入力してください' },
        { status: 400 }
      );
    }

    // ユーザー名: 3〜20文字、英数字+アンダースコアのみ
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(userName)) {
      return NextResponse.json(
        { error: 'ユーザー名は3〜20文字の英数字・アンダースコアで入力してください' },
        { status: 400 }
      );
    }

    // メールアドレスバリデーション
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'メールアドレスを入力してください' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'メールアドレスの形式が正しくありません' },
        { status: 400 }
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        { error: 'メールアドレスが長すぎます' },
        { status: 400 }
      );
    }

    // パスワード: 8文字以上
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上で入力してください' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // ユーザー名の重複チェック
    const existing = await sql`
      SELECT id FROM users WHERE user_name = ${userName}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'このユーザー名は既に使用されています' },
        { status: 409 }
      );
    }

    // メールアドレスの重複チェック
    const existingEmail = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `;

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 409 }
      );
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    // ユーザー登録
    const inserted = await sql`
      INSERT INTO users (user_name, password_hash, email, role)
      VALUES (${userName}, ${passwordHash}, ${email.toLowerCase()}, 'user')
      RETURNING id
    `;

    const userId = (inserted[0] as unknown as { id: number }).id;

    // JWT発行 + Cookie設定（自動ログイン）
    const token = await signToken({
      userId,
      userName,
      role: 'user',
    });
    await setTokenCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        userId,
        userName,
        role: 'user',
      },
    });

  } catch (error) {
    console.error('POST /api/auth/register エラー:', error);
    return NextResponse.json(
      { error: 'ユーザー登録に失敗しました' },
      { status: 500 }
    );
  }
}
