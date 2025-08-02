// ========================================
// src/middleware.ts
// 全サイトBasic認証 + noindex設定
// ========================================

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // 環境変数から認証情報を取得
  const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER;
  const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;

  // 環境変数が設定されていない場合は認証をスキップ
  if (!BASIC_AUTH_USER || !BASIC_AUTH_PASSWORD) {
    console.warn('⚠️ Basic認証の環境変数が設定されていません。');
    return NextResponse.next();
  }

  // リクエストヘッダーからAuthorizationを取得
  const authorizationHeader = request.headers.get('authorization');

  if (!authorizationHeader) {
    // 認証ヘッダーがない場合は認証ダイアログを表示
    return new NextResponse('個人利用サイトです。認証が必要です。', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Personal Demo Site"',
        // SEO完全ブロック
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, nosnap, noimageindex, notranslate',
      },
    });
  }

  // Basic認証の解析
  const base64Credentials = authorizationHeader.split(' ')[1];
  if (!base64Credentials) {
    return new NextResponse('認証情報が無効です', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Personal Demo Site"',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, nosnap, noimageindex, notranslate',
      },
    });
  }

  try {
    // Base64デコード
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // 認証チェック
    if (username !== BASIC_AUTH_USER || password !== BASIC_AUTH_PASSWORD) {
      return new NextResponse('ユーザー名またはパスワードが違います', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Personal Demo Site"',
          'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, nosnap, noimageindex, notranslate',
        },
      });
    }

    // 認証成功時もSEOブロックヘッダーを追加
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, nosnap, noimageindex, notranslate');
    return response;

  } catch (error) {
    console.error('認証エラー:', error);
    return new NextResponse('認証エラーが発生しました', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Personal Demo Site"',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, nosnap, noimageindex, notranslate',
      },
    });
  }
}

// 全てのパスに適用（設定ページだけでなく全体を保護）
export const config = {
  matcher: '/:path*',
}