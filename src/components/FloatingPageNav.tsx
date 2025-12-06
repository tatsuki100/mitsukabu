// ========================================
// src/components/FloatingPageNav.tsx
// 画面左右に追従するページ送りボタン（PC専用）
// ========================================

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FloatingPageNavProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const FloatingPageNav = ({
  currentPage,
  totalPages,
  onPageChange,
}: FloatingPageNavProps) => {
  // 1ページ以下の場合は表示しない
  if (totalPages <= 1) {
    return null;
  }

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= totalPages - 1;

  const handlePrevious = () => {
    if (!isFirstPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (!isLastPage) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <>
      {/* 戻るボタン（左側） - 1ページ目以外で表示 */}
      {!isFirstPage && (
        <button
          onClick={handlePrevious}
          className="fixed left-12 top-1/2 -translate-y-1/2 z-50
                     hidden lg:flex items-center justify-center
                     w-14 h-14 rounded-full
                     bg-blue-600/70 hover:bg-blue-600/90
                     text-white shadow-lg
                     transition-all duration-200
                     hover:scale-110"
          aria-label="前のページへ"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* 次へボタン（右側） - 最終ページ以外で表示 */}
      {!isLastPage && (
        <button
          onClick={handleNext}
          className="fixed right-12 top-1/2 -translate-y-1/2 z-50
                     hidden lg:flex items-center justify-center
                     w-14 h-14 rounded-full
                     bg-blue-600/70 hover:bg-blue-600/90
                     text-white shadow-lg
                     transition-all duration-200
                     hover:scale-110"
          aria-label="次のページへ"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}
    </>
  );
};

export default FloatingPageNav;
