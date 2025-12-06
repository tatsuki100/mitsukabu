// ========================================
// src/hooks/usePagination.ts
// ページネーション機能のカスタムHook
// URLクエリパラメータで状態を保持
// ========================================

import { useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

// Hook の Props 型定義
type UsePaginationProps<T> = {
  items: T[];                    // ページネーション対象のアイテム配列
  searchQuery?: string;          // 検索クエリ（オプション）
  itemsPerPage?: number;         // 1ページあたりの表示数（デフォルト32）
};

// Hook の戻り値型定義
type UsePaginationReturn = {
  currentPage: number;           // 現在のページ（0ベース）
  totalPages: number;            // 総ページ数
  totalItems: number;            // 総アイテム数
  startIndex: number;            // 開始インデックス
  endIndex: number;              // 終了インデックス
  handlePageChange: (newPage: number) => void;  // ページ変更ハンドラー
  getPageNumbers: () => (number | string)[];    // ページ番号配列取得関数
};

export const usePagination = <T,>({
  items,
  searchQuery = '',
  itemsPerPage = 32,
}: UsePaginationProps<T>): UsePaginationReturn => {
  // Next.js Router hooks
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URLからページ番号を取得（0ベース）
  const pageParam = searchParams.get('page');
  const urlPage = pageParam ? parseInt(pageParam, 10) - 1 : 0; // URLは1ベース、内部は0ベース

  // 前回値を記憶（データリセット最適化）
  const prevSearchRef = useRef<string>(searchQuery);

  // ページネーション計算
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // currentPageを計算（範囲外の場合は補正）
  let currentPage = urlPage;
  if (currentPage < 0) {
    currentPage = 0;
  } else if (totalPages > 0 && currentPage >= totalPages) {
    currentPage = totalPages - 1;
  }

  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // URL更新関数（内部用）
  const updateUrl = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newPage === 0) {
      // 1ページ目の場合はクエリパラメータを削除（URLをきれいに）
      params.delete('page');
    } else {
      // URLは1ベースで表示
      params.set('page', String(newPage + 1));
    }

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  // 検索クエリが変わった時にページをリセット
  useEffect(() => {
    if (prevSearchRef.current !== searchQuery) {
      // 検索クエリが変わったらページを1に戻す
      if (currentPage !== 0) {
        updateUrl(0);
      }
      prevSearchRef.current = searchQuery;
    }
  }, [searchQuery, currentPage, updateUrl]);

  // ページ変更ハンドラー
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      updateUrl(newPage);
      // ページ変更時にトップにスクロール
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages, updateUrl]);

  // キーボード操作のハンドラー
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 入力フィールドにフォーカスがある場合は無視
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (currentPage > 0) {
          handlePageChange(currentPage - 1);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (currentPage < totalPages - 1) {
          handlePageChange(currentPage + 1);
        }
        break;
      case 'Home':
        event.preventDefault();
        handlePageChange(0);
        break;
      case 'End':
        event.preventDefault();
        handlePageChange(totalPages - 1);
        break;
    }
  }, [currentPage, totalPages, handlePageChange]);

  // キーボードイベントリスナーの設定
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    // クリーンアップ
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // ページ番号の配列を生成（...省略対応）
  const getPageNumbers = useCallback((): (number | string)[] => {
    const pageNumbers: (number | string)[] = [];
    const maxVisiblePages = 7; // 表示する最大ページ数

    if (totalPages <= maxVisiblePages) {
      // 全ページ表示
      for (let i = 0; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // 省略表示
      if (currentPage <= 3) {
        // 最初の方のページ
        for (let i = 0; i < 3; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages - 1);
      } else if (currentPage >= totalPages - 4) {
        // 最後の方のページ
        pageNumbers.push(0);
        pageNumbers.push('...');
        for (let i = totalPages - 5; i < totalPages; i++) pageNumbers.push(i);
      } else {
        // 中間のページ
        pageNumbers.push(0);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pageNumbers.push(i);
        pageNumbers.push('...');
        pageNumbers.push(totalPages - 1);
      }
    }

    return pageNumbers;
  }, [currentPage, totalPages]);

  return {
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    handlePageChange,
    getPageNumbers,
  };
};
