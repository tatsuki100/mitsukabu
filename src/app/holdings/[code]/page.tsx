// ========================================
// src/app/holdings/[code]/page.tsx
// 保有銘柄専用の個別銘柄画面
// ========================================

'use client';

import { useParams } from 'next/navigation';
import StockDetailPage from '@/components/StockDetailPage';

const HoldingStockDetailPage = () => {
  // ルーティング用
  const params = useParams();
  const stockCode = params.code as string;

  return (
    <StockDetailPage 
      stockCode={stockCode} 
      navigationMode="holdings" //保有銘柄のみ
    />
  );
};

export default HoldingStockDetailPage;