// ========================================
// src/components/StockDetailPage.tsx
// 個別銘柄画面の共通コンポーネント（スケーラブル設計）
// ========================================

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useCallback, useState } from 'react';
import { useStockDataStorage } from '@/hooks/useStockDataStorage';
import { useStockScreening } from '@/hooks/useStockScreening';
import { CHART_PERIODS, StoredStock } from '@/types/stockData';
import StockChart from './StockChart';
import StockStatusButton from './StockStatusButton';
import AuthRequiredModal from './AuthRequiredModal';
import { useAuth } from '@/components/AuthProvider';
import { ExternalLink } from 'lucide-react';

// ナビゲーションモードの型定義
type NavigationMode = 'all' | 'favorites' | 'holdings' | 'considering' | 'turn_back' | 'cross_v';

interface StockDetailPageProps {
  stockCode: string;
  navigationMode: NavigationMode;
  screeningCondition?: string; // 将来のスクリーニング機能用
}

const StockDetailPage = ({
  stockCode,
  navigationMode
  // screeningCondition 
}: StockDetailPageProps) => {
  const router = useRouter();
  const user = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // localStorage管理
  const {
    storedData,
    loading,
    error,
    getStoredStock,
    isDataAvailable,
    getFavoriteStocks,
    getHoldingStocks,
    getConsideringStocks
  } = useStockDataStorage();

  // スクリーニング機能
  const { turnbackStocks, crossVStocks } = useStockScreening();

  // 現在の銘柄データを取得
  const currentStockData = getStoredStock(stockCode);

  // ページのベースパスを取得
  const getBasePath = useCallback((): string => {
    switch (navigationMode) {
      case 'all':
        return '/stock';
      case 'favorites':
        return '/favorites';
      case 'holdings':
        return '/holdings';
      case 'considering':
        return '/considering';
      case 'turn_back':
        return '/turn_back';
      case 'cross_v':
        return '/cross_v';
      default:
        return '/stock';
    }
  }, [navigationMode]);

  // ナビゲーション用の銘柄リストを取得
  const getNavigationStocks = useCallback((): StoredStock[] => {
    if (!storedData) return [];

    switch (navigationMode) {
      case 'all':
        return storedData.stocks;
      case 'favorites':
        return getFavoriteStocks();
      case 'holdings':
        return getHoldingStocks();
      case 'considering':
        return getConsideringStocks();
      case 'turn_back':
        return turnbackStocks; // ターンバック銘柄を返す
      case 'cross_v':
        return crossVStocks; // クロスV銘柄を返す
      default:
        return storedData.stocks;
    }
  }, [storedData, navigationMode, getFavoriteStocks, getHoldingStocks, getConsideringStocks, turnbackStocks, crossVStocks]);

  // 現在の銘柄のインデックスを取得
  const navigationStocks = getNavigationStocks();
  const currentIndex = navigationStocks.findIndex(stock => stock.code === stockCode);

  // キーボードのイベントハンドラー
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (navigationStocks.length === 0) return;

    const basePath = getBasePath();

    if (event.key === 'ArrowUp') {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : navigationStocks.length - 1;
      router.push(`${basePath}/${navigationStocks[prevIndex].code}`);
    } else if (event.key === 'ArrowDown') {
      const nextIndex = currentIndex < navigationStocks.length - 1 ? currentIndex + 1 : 0;
      router.push(`${basePath}/${navigationStocks[nextIndex].code}`);
    }
  }, [currentIndex, router, navigationStocks, getBasePath]);

  // キーボードイベントのリスナー設定
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 最後に閲覧した銘柄をsessionStorageに保存（ページ種別も含める）
  useEffect(() => {
    if (stockCode) {
      sessionStorage.setItem('lastViewedStock', JSON.stringify({
        code: stockCode,
        page: navigationMode
      }));
    }
  }, [stockCode, navigationMode]);

  // プルダウンの値が変更された時の処理
  const handleStockChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStockCode = event.target.value;
    const basePath = getBasePath();
    router.push(`${basePath}/${newStockCode}`);
  };

  // ページタイトルを取得
  const getPageTitle = (): string => {
    switch (navigationMode) {
      case 'all':
        return 'JPX400';
      case 'favorites':
        return '観察銘柄';
      case 'holdings':
        return '保有銘柄';
      case 'considering':
        return '検討銘柄';
      case 'turn_back':
        return 'ターンバック銘柄';
      case 'cross_v':
        return 'クロスV銘柄';
      default:
        return '銘柄詳細';
    }
  };

  // ローディング中
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">📊 データ読み込み中...</h2>
          <p>localStorageから株価データを読み込んでいます。</p>
        </div>
      </div>
    );
  }

  // エラー時
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">❌ エラーが発生しました</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // データがない場合
  if (!isDataAvailable) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">📭 株価データがありません</h2>
          <p>設定ページで株価データを取得してください。</p>
          <button
            onClick={() => router.push('/setting')}
            className="mt-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            設定ページへ
          </button>
        </div>
      </div>
    );
  }

  // 該当銘柄が見つからない場合
  if (!currentStockData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">❌ 銘柄が見つかりません</h2>
          <p>銘柄コード「{stockCode}」のデータが見つかりません。</p>
          <button
            onClick={() => router.push('/')}
            className="mt-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            一覧ページへ戻る
          </button>
        </div>
      </div>
    );
  }

  // ナビゲーション用銘柄リストが空の場合（お気に入りなしなど）
  if (navigationStocks.length === 0) {
    const backPath =
      navigationMode === 'favorites' ? '/favorites' :
      navigationMode === 'holdings' ? '/holdings' :
      navigationMode === 'considering' ? '/considering' :
      navigationMode === 'turn_back' ? '/turn_back' :
      navigationMode === 'cross_v' ? '/cross_v' : '/';
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">📭 {getPageTitle()}がありません</h2>
          <p>表示できる銘柄がありません。</p>
          <button
            onClick={() => router.push(backPath)}
            className="mt-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            一覧ページへ戻る
          </button>
        </div>
      </div>
    );
  }

  const { stock: stockData, dailyData } = currentStockData;

  // 株価の計算
  const priceDiff = stockData.closePrice - stockData.previousClosePrice;
  const priceChangePercent = ((priceDiff / stockData.previousClosePrice) * 100).toFixed(2);
  const isPriceUp = priceDiff > 0;

  // Yahoo APIのStock型をStockChart用に変換
  const chartStock = {
    ...stockData,
    movingAverageLine: {
      shortTerm: null,
      midTerm: null,
      longTerm: null
    },
    rsi: {
      value: null,
      period: 9
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-64px)]">
      <div className="flex flex-col h-full">
        {/* ヘッダー Start */}
        <div className="mb-6 flex justify-between items-start">
          {/* 左側 Start */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <select
                value={stockCode}
                onChange={handleStockChange}
                className='border rounded-md p-1 text-lg font-bold'
              >
                {navigationStocks.map((stock) => (
                  <option key={stock.code} value={stock.code}>
                    {stock.code} - {stock.name}
                  </option>
                ))}
              </select>

              {/* 銘柄ステータスボタン */}
              <StockStatusButton
                stockCode={stockCode}
                onAuthRequired={!user ? () => setShowAuthModal(true) : undefined}
              />

            </div>

            <p className="text-sm text-gray-500 mb-2">
              {getPageTitle()} | 最終更新：{stockData.lastUpdated}
            </p>

            {/* 証券会社リンクボタン Start */}
            <div className="flex gap-2 my-3">
              <div>
                <a
                  href={`https://site3.sbisec.co.jp/ETGate/?_ControlID=WPLETsiR001Control&_PageID=WPLETsiR001Idtl30&_DataStoreID=DSWPLETsiR001Control&_ActionID=DefaultAID&s_rkbn=2&s_btype=&i_stock_sec=${stockData.code}&i_dom_flg=1&i_exchange_code=JPN&i_output_type=2&exchange_code=TKY&stock_sec_code_mul=${stockData.code}&ref_from=1&ref_to=20&wstm4130_sort_id=&wstm4130_sort_kbn=&qr_keyword=1&qr_suggest=1&qr_sort=1`}
                  target='_blank'
                  rel="noopener noreferrer"
                >
                  <button className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded inline-flex items-center">
                    <span>SBI証券</span>
                    <ExternalLink className="ml-2 w-4 h-4" />
                  </button>
                </a>
              </div>

              <div>
                <a
                  href={`https://www.rakuten-sec.co.jp/web/market/search/quote.html?ric=${stockData.code}.T`}
                  target='_blank'
                  rel="noopener noreferrer"
                >
                  <button className="bg-red-500 hover:bg-red-700 text-white text-sm py-2 px-4 rounded inline-flex items-center">
                    <span>楽天証券</span>
                    <ExternalLink className="ml-2 w-4 h-4" />
                  </button>
                </a>
              </div>
            </div>

          </div>
          {/* 左側 End */}

          {/* 右側 Start */}
          <div className="bg-white rounded-lg shadow-md p-4 flex justify-between gap-6">
            {/* 現在値 */}
            <div>
              <div className="text-gray-600 mb-1">現在値</div>
              <div className={`font-bold ${isPriceUp ? 'text-green-600' : 'text-red-600'}`}>
                ¥{stockData.closePrice.toLocaleString()}
              </div>
            </div>

            {/* 前日比 */}
            <div>
              <div className="text-gray-600 mb-1">前日比</div>
              <div className={`${isPriceUp ? 'text-green-600' : 'text-red-600'}`}>
                {isPriceUp ? '+' : ''}¥{priceDiff.toFixed(0).toLocaleString()} ({priceChangePercent}%)
              </div>
            </div>
          </div>
          {/* 右側 End */}
        </div>
        {/* ヘッダー End */}

        {/* チャート本体 Start */}
        <div className="flex-1">
          <StockChart
            dailyData={dailyData}
            stock={chartStock}
            fullSize={true}
            displayDays={CHART_PERIODS.DETAIL_VIEW}
          />
        </div>
        {/* チャート本体 End */}
      </div>

      {/* 認証必要モーダル */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default StockDetailPage;