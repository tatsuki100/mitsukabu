// ========================================
// src/lib/auth.ts
// JWT認証ユーティリティ（jose + httpOnly Cookie）
// ========================================

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// Cookie名
const COOKIE_NAME = 'mitsukabu_token';

// JWT有効期限（30日）
const JWT_EXPIRATION = '30d';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30日（秒）

// JWTペイロード型
export type AuthUser = {
  userId: number;
  userName: string;
  role: string;
};

// AUTH_SECRETをUint8Arrayに変換（jose用）
function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

// JWT発行
export async function signToken(payload: AuthUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(getSecretKey());
}

// JWT検証（成功時はペイロード、失敗時はnull）
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      userId: payload.userId as number,
      userName: payload.userName as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

// CookieからJWTを取得→検証→ユーザー情報を返す
// Server Component / Route Handler から呼び出し可能
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

// JWTをhttpOnly Cookieに設定
export async function setTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

// JWT Cookieを削除
export async function deleteTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
