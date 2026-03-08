// ========================================
// src/proxy.ts
// JWT認証プロキシ（公開アクセス対応 + admin専用パス制御）
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'mitsukabu_token';

// admin専用パス（これらのパスはadminロールのユーザーのみアクセス可能）
const ADMIN_PATHS = ['/turn_back', '/cross_v', '/setting'];

// admin専用パスかどうか判定
function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(adminPath =>
    pathname === adminPath || pathname.startsWith(adminPath + '/')
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

  // ---- 1. 認証済みユーザーが認証ページにアクセスした場合はトップにリダイレクト ----
  const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];
  if (AUTH_PAGES.includes(pathname)) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL('/', request.url));
      } catch {
        // トークンが無効 → そのままlogin/registerページを表示
      }
    }
    return NextResponse.next();
  }

  // ---- 2. admin専用パスの制御 ----
  if (isAdminPath(pathname)) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      // 未ログイン → トップページにリダイレクト
      return NextResponse.redirect(new URL('/', request.url));
    }
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.role !== 'admin') {
        // admin以外 → トップページにリダイレクト
        return NextResponse.redirect(new URL('/', request.url));
      }
      return NextResponse.next();
    } catch {
      // トークンが無効 → トップページにリダイレクト
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ---- 3. その他の全てのパスは認証不要で通過 ----
  // APIルートは各route内で認証チェック済み（401を返す）
  return NextResponse.next();
}

// 静的ファイルとNext.js内部パスを除外
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|og-image\\.jpg).*)'],
};
