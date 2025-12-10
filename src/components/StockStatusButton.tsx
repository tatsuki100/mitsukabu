// ========================================
// src/components/StockStatusButton.tsx
// 銘柄ステータス選択ボタン（ロータリー式：クリックで順番に切替）
// ========================================

'use client';

import { useStockDataStorage } from '@/hooks/useStockDataStorage';
import { Star, GraduationCap, Wallet, Circle } from 'lucide-react';

// ステータスの型定義
type StockStatus = 'none' | 'watching' | 'considering' | 'holding';

// ステータスの順番定義（ロータリー順序）
const STATUS_ORDER: StockStatus[] = ['none', 'watching', 'considering', 'holding'];

interface StockStatusButtonProps {
  stockCode: string;
}

const StockStatusButton = ({ stockCode }: StockStatusButtonProps) => {
  const { getStockStatus, setStockStatus } = useStockDataStorage();

  const status = getStockStatus(stockCode);

  // ステータスに応じたアイコンを取得
  const getStatusIcon = (currentStatus: StockStatus) => {
    switch (currentStatus) {
      case 'watching':
        return <Star className="w-5 h-5 fill-current" />;
      case 'considering':
        return <GraduationCap className="w-5 h-5" />;
      case 'holding':
        return <Wallet className="w-5 h-5 fill-current" />;
      default:
        return <Circle className="w-5 h-5" />;
    }
  };

  // ステータスに応じたボタンのスタイルを取得
  const getButtonStyle = (currentStatus: StockStatus) => {
    switch (currentStatus) {
      case 'watching':
        return 'text-yellow-400 bg-yellow-50 hover:bg-yellow-100';
      case 'considering':
        return 'text-green-500 bg-green-50 hover:bg-green-100';
      case 'holding':
        return 'text-red-400 bg-red-50 hover:bg-red-100';
      default:
        return 'text-gray-400 bg-gray-50 hover:bg-gray-100';
    }
  };

  // ステータスに応じたツールチップを取得
  const getTooltip = (currentStatus: StockStatus) => {
    switch (currentStatus) {
      case 'watching':
        return '観察銘柄（クリックで検討銘柄へ）';
      case 'considering':
        return '検討銘柄（クリックで保有銘柄へ）';
      case 'holding':
        return '保有銘柄（クリックで解除）';
      default:
        return 'なし（クリックで観察銘柄へ）';
    }
  };

  // クリックで次のステータスに切り替え
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 現在のステータスのインデックスを取得
    const currentIndex = STATUS_ORDER.indexOf(status);
    // 次のステータスを計算（最後まで行ったら最初に戻る）
    const nextIndex = (currentIndex + 1) % STATUS_ORDER.length;
    const nextStatus = STATUS_ORDER[nextIndex];

    setStockStatus(stockCode, nextStatus);
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full transition-colors ${getButtonStyle(status)}`}
      title={getTooltip(status)}
    >
      {getStatusIcon(status)}
    </button>
  );
};

export default StockStatusButton;
