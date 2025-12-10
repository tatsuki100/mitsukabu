// ========================================
// src/app/considering/[code]/page.tsx
// 検討銘柄専用の個別銘柄画面
// ========================================

'use client';

import { useParams } from 'next/navigation';
import StockDetailPage from '@/components/StockDetailPage';

const ConsideringStockDetailPage = () => {
  // ルーティング用
  const params = useParams();
  const stockCode = params.code as string;

  return (
    <StockDetailPage
      stockCode={stockCode}
      navigationMode="considering" // 検討銘柄のみ
    />
  );
};

export default ConsideringStockDetailPage;
