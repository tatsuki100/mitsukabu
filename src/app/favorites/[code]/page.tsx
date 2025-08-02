// ========================================
// src/app/favorites/[code]/page.tsx
// お気に入り専用の個別銘柄画面
// ========================================

'use client';

import { useParams } from 'next/navigation';
import StockDetailPage from '@/components/StockDetailPage';

const FavoriteStockDetailPage = () => {
  // ルーティング用
  const params = useParams();
  const stockCode = params.code as string;

  return (
    <StockDetailPage 
      stockCode={stockCode} 
      navigationMode="favorites" //お気に入り銘柄のみ
    />
  );
};

export default FavoriteStockDetailPage;