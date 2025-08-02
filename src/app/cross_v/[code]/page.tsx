// ========================================
// src/app/cross_v/[code]/page.tsx
// クロスV専用の個別銘柄画面
// ========================================

'use client';

import { useParams } from 'next/navigation';
import StockDetailPage from '@/components/StockDetailPage';

const CrossVStockDetailPage = () => {
  // ルーティング用
  const params = useParams();
  const stockCode = params.code as string;

  return (
    <StockDetailPage 
      stockCode={stockCode} 
      navigationMode="cross_v"
      screeningCondition="クロスV"
    />
  );
};

export default CrossVStockDetailPage;