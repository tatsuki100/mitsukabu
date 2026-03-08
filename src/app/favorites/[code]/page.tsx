// ========================================
// src/app/favorites/[code]/page.tsx
// お気に入り専用の個別銘柄画面
// ========================================

'use client';

import { useParams } from 'next/navigation';
import StockDetailPage from '@/components/StockDetailPage';
import { useAuth } from '@/components/AuthProvider';
import AuthRequiredPage from '@/components/AuthRequiredPage';

const FavoriteStockDetailPage = () => {
  const user = useAuth();
  // ルーティング用
  const params = useParams();
  const stockCode = params.code as string;

  if (!user) {
    return <AuthRequiredPage pageName="観察銘柄" />;
  }

  return (
    <StockDetailPage
      stockCode={stockCode}
      navigationMode="favorites" //お気に入り銘柄のみ
    />
  );
};

export default FavoriteStockDetailPage;
