// ========================================
// src/app/stock/[code]/page.tsx
// 個別銘柄画面
// ========================================

'use client';

import { useParams } from 'next/navigation';
import StockDetailPage from '@/components/StockDetailPage';

const StockDetailPageWrapper = () => {
  // ルーティング用
  const params = useParams();
  const stockCode = params.code as string;

  return (
    <StockDetailPage 
      stockCode={stockCode} 
      navigationMode="all"  // 全銘柄表示
    />
  );
};

export default StockDetailPageWrapper;