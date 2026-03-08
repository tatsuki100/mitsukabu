// ========================================
// src/app/considering/[code]/page.tsx
// 検討銘柄専用の個別銘柄画面
// ========================================

'use client';

import { useParams } from 'next/navigation';
import StockDetailPage from '@/components/StockDetailPage';
import { useAuth } from '@/components/AuthProvider';
import AuthRequiredPage from '@/components/AuthRequiredPage';

const ConsideringStockDetailPage = () => {
  const user = useAuth();
  // ルーティング用
  const params = useParams();
  const stockCode = params.code as string;

  if (!user) {
    return <AuthRequiredPage pageName="検討銘柄" />;
  }

  return (
    <StockDetailPage
      stockCode={stockCode}
      navigationMode="considering" // 検討銘柄のみ
    />
  );
};

export default ConsideringStockDetailPage;
