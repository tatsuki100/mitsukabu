// ========================================
// src/components/Header.tsx
// グローバルヘッダーファイル（レスポンシブ対応）
// ========================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartCandlestick, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // 現在のページかどうかを判定（個別ページも含む）
  const isCurrentPage = (href: string): boolean => {
    if (href === '/') {
      // トップページは完全一致または/stock/で始まる場合
      return pathname === '/' || pathname.startsWith('/stock/');
    }
    // その他は前方一致
    return pathname.startsWith(href.replace(/\/$/, ''));
  };

  // ナビゲーションリンクのスタイルを取得（PC用）
  const getNavLinkClass = (href: string): string => {
    const baseClass = 'transition-colors';
    if (isCurrentPage(href)) {
      return `${baseClass} text-blue-600`;
    }
    return `${baseClass} text-gray-600 hover:text-blue-400`;
  };

  // ナビゲーションリンクのスタイルを取得（スマホ用）
  const getMobileNavLinkClass = (href: string): string => {
    const baseClass = 'block px-6 py-3 transition-colors border-b border-gray-100';
    if (isCurrentPage(href)) {
      return `${baseClass} text-blue-600 font-bold bg-blue-50`;
    }
    return `${baseClass} text-gray-600 hover:bg-gray-50 hover:text-blue-400`;
  };

  // メニューの開閉を切り替え
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // メニューアイテムをクリックした時にメニューを閉じる
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm fixed top-0 w-full z-50">
      <div className="container mx-auto px-4">
        <div className="h-12 flex items-center justify-between">
          {/* 左側（ロゴ） */}
          <div className="text-lg font-bold">
            <Link href="/" className="flex items-center" onClick={closeMenu}>
              <ChartCandlestick className="mr-1" />
              みつかぶ
            </Link>
          </div>

          {/* 右側（PC用ナビゲーション） */}
          <nav className="hidden md:flex items-center space-x-5">
            <a href="https://site3.sbisec.co.jp/ETGate/?_ControlID=WPLETmgR001Control&_PageID=WPLETmgR001Mdtl20&_DataStoreID=DSWPLETmgR001Control&_ActionID=DefaultAID&burl=iris_indexDetail&cat1=market&cat2=index&dir=tl1-idxdtl%7Ctl2-.N225%7Ctl5-jpn&file=index.html&getFlg=on" target='_blank'>日経平均</a>
            <Link href="/" className={getNavLinkClass('/')}>JPX400一覧</Link>
            <Link href="/turn_back/" className={getNavLinkClass('/turn_back/')}>ターンバック</Link>
            <Link href="/cross_v/" className={getNavLinkClass('/cross_v/')}>クロスV</Link>
            <Link href="/favorites/" className={getNavLinkClass('/favorites/')}>観察銘柄</Link>
            <Link href="/considering/" className={getNavLinkClass('/considering/')}>検討銘柄</Link>
            <Link href="/holdings/" className={getNavLinkClass('/holdings/')}>保有銘柄</Link>
            <Link href="/setting/" className={getNavLinkClass('/setting/')}>設定</Link>
          </nav>

          {/* ハンバーガーメニューボタン（スマホ用） */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="メニューを開く"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* スマホ用ドロップダウンメニュー（右からスライドイン） */}
        <div 
          className={`md:hidden fixed top-12 right-0 h-[calc(100vh-48px)] w-64 bg-white shadow-lg border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <nav className="py-4">
            <Link
              href="/"
              className={getMobileNavLinkClass('/')}
              onClick={closeMenu}
            >
              JPX400一覧
            </Link>
            <Link
              href="/turn_back/"
              className={getMobileNavLinkClass('/turn_back/')}
              onClick={closeMenu}
            >
              ターンバック
            </Link>
            <Link
              href="/cross_v/"
              className={getMobileNavLinkClass('/cross_v/')}
              onClick={closeMenu}
            >
              クロスV
            </Link>
            <Link
              href="/favorites/"
              className={getMobileNavLinkClass('/favorites/')}
              onClick={closeMenu}
            >
              観察銘柄
            </Link>
            <Link
              href="/considering/"
              className={getMobileNavLinkClass('/considering/')}
              onClick={closeMenu}
            >
              検討銘柄
            </Link>
            <Link
              href="/holdings/"
              className={getMobileNavLinkClass('/holdings/')}
              onClick={closeMenu}
            >
              保有銘柄
            </Link>
            <Link
              href="/setting/"
              className={getMobileNavLinkClass('/setting/')}
              onClick={closeMenu}
            >
              設定
            </Link>
          </nav>
        </div>

        {/* オーバーレイ（メニューが開いている時の背景） */}
        {isMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 top-12 bg-black bg-opacity-50 z-40"
            onClick={closeMenu}
          />
        )}
      </div>
    </header>
  );
};

export default Header;