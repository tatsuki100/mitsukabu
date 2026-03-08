// ========================================
// src/components/AuthRequiredPage.tsx
// 認証必要フルページメッセージ（観察・検討・保有銘柄ページ用）
// ========================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';

type AuthRequiredPageProps = {
  pageName: string;
};

const AuthRequiredPage = ({ pageName }: AuthRequiredPageProps) => {
  const pathname = usePathname();
  const loginUrl = `/login?from=${encodeURIComponent(pathname)}`;

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="bg-gray-100 border border-gray-300 text-gray-700 px-6 py-12 rounded-lg text-center max-w-lg mx-auto">
        <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-bold mb-2">{pageName}</h2>
        <p className="text-gray-600 mb-6">
          この機能を使うには会員登録が必要です
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md font-medium"
          >
            新規登録
          </Link>
          <Link
            href={loginUrl}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-6 rounded-md font-medium"
          >
            ログイン
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredPage;
