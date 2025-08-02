// ========================================
// src/app/turn_back/[code]/page.tsx
// ターンバック専用の個別銘柄画面
// ========================================

'use client';

import { useParams } from 'next/navigation';
import StockDetailPage from '@/components/StockDetailPage';

const TurnBackStockDetailPage = () => {
  // ルーティング用
  const params = useParams();
  const stockCode = params.code as string;

  return (
    <StockDetailPage 
      stockCode={stockCode} 
      navigationMode="turn_back"
      screeningCondition="ターンバック"
    />
  );
};

export default TurnBackStockDetailPage;