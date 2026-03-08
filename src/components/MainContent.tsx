// ========================================
// src/components/MainContent.tsx
// メインコンテンツラッパー（パスに応じてパディングを制御）
// ========================================

'use client';

import { usePathname } from 'next/navigation';

const MainContent = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // ログイン・登録ページではヘッダー分のパディングを無しにする
  const noPaddingPages = ['/login', '/register', '/forgot-password', '/reset-password'];
  const noPadding = noPaddingPages.includes(pathname);

  return (
    <main className={`flex-1 ${noPadding ? '' : 'pt-10'}`}>
      {children}
    </main>
  );
};

export default MainContent;
