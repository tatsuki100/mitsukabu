// ========================================
// src/components/StockCard.tsx
// 銘柄一覧ページのチャートカードコンポーネント
// （TOPページ・観察銘柄・ターンバックなど全ページ汎用）
// ========================================

import { StoredStock } from '@/types/stockData';
import StockChart from './StockChart';
import StockStatusButton from './StockStatusButton';
import { useStockDataStorage } from '@/hooks/useStockDataStorage';
import { useStockMemo } from '@/hooks/useStockMemo';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import AuthRequiredModal from '@/components/AuthRequiredModal';

// リンクプレフィックスの型定義
type LinkPrefix = 'stock' | 'favorites' | 'holdings' | 'considering' | 'turn_back' | 'cross_v';

// Propsの型定義
interface StockCardProps {
  stock: StoredStock;
  linkPrefix?: LinkPrefix;
}

const StockCard = ({ stock, linkPrefix = 'stock' }: StockCardProps) => {
  // 認証状態
  const user = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // localStorage管理
  const { getStoredStock } = useStockDataStorage();

  // メモ管理
  const { getMemo, saveMemo } = useStockMemo();

  // メモのテキスト状態管理
  const [memoText, setMemoText] = useState<string>('');

  // 該当銘柄の詳細データ（DailyData含む）を取得
  const stockDetailData = getStoredStock(stock.code);

  // リンクパスを動的生成
  const linkPath = `/${linkPrefix}/${stock.code}`;

  // 初回表示時にメモを読み込み
  useEffect(() => {
    const currentMemo = getMemo(stock.code);
    setMemoText(currentMemo);
  }, [stock.code, getMemo]);

  // RSIを計算する関数（StockChart.tsxと同じロジック）
  const calculateRSI = (closeData: number[], period: number = 9): (number | null)[] => {
    if (closeData.length < period + 1) {
      return new Array(closeData.length).fill(null);
    }

    const gains: number[] = [];
    const losses: number[] = [];

    // 価格変動を計算
    for (let i = 1; i < closeData.length; i++) {
      const change = closeData[i] - closeData[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }

    // 初期の平均利益/損失を計算
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // RSIの結果配列
    const rsiData: (number | null)[] = [];

    // 最初のperiod分はnull
    for (let i = 0; i < period; i++) {
      rsiData.push(null);
    }

    // RSIを計算
    for (let i = period; i < closeData.length; i++) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      rsiData.push(parseFloat(rsi.toFixed(2)));

      // 次の期間の平均を計算（指数移動平均的手法）
      if (i < gains.length) {
        avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
      }
    }

    return rsiData;
  };

  // 最新のRSI値を計算
  const getLatestRSI = (): number | null => {
    if (!stockDetailData || !stockDetailData.dailyData || stockDetailData.dailyData.length < 15) {
      return null; // データが不十分な場合
    }

    const closeData = stockDetailData.dailyData.map(item => item.close);
    const rsiArray = calculateRSI(closeData, 9);

    // 最新の有効なRSI値を取得（後ろから探す）
    for (let i = rsiArray.length - 1; i >= 0; i--) {
      if (rsiArray[i] !== null) {
        return rsiArray[i];
      }
    }

    return null;
  };

  // メモの変更ハンドラー（リアルタイム保存）
  const handleMemoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setMemoText(newText);
    saveMemo(stock.code, newText); // リアルタイムで保存
  };

  // 前日比を計算
  const priceDiff = stock.closePrice - stock.previousClosePrice;
  const priceChangePercent = ((priceDiff / stock.previousClosePrice) * 100).toFixed(2);
  const isPriceUp = priceDiff > 0;

  // 最新のRSI値を取得
  const latestRSI = getLatestRSI();

  // RSIの色分け用
  const getRSIColor = (rsiValue: number | null): string => {
    if (rsiValue === null) return 'text-gray-400';
    if (rsiValue <= 30) return 'text-red-600';   // 売られ過ぎ（買いシグナル）
    if (rsiValue >= 70) return 'text-blue-600';  // 買われ過ぎ（売りシグナル）
    return 'text-gray-600';                      // 中立
  };

  // RSIの表示テキスト
  const getRSIDisplayText = (rsiValue: number | null): string => {
    if (rsiValue === null) return '---';
    return Math.round(rsiValue).toString(); // 整数表示
  };

  // StockChart用にStock型を調整
  const chartStock = {
    ...stock,
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

  // メモがあるかどうかを判定（空文字や空白のみの場合は「メモなし」と判定）
  const hasMemo = memoText.trim().length > 0;

  // 最後に閲覧した銘柄かどうかを判定（同じページ種別の場合のみ）
  const [isLastViewed, setIsLastViewed] = useState(false);

  useEffect(() => {
    const lastViewedData = sessionStorage.getItem('lastViewedStock');
    if (lastViewedData) {
      try {
        const { code, page } = JSON.parse(lastViewedData);
        // linkPrefixとnavigationModeの対応：stock→all、それ以外は同じ名前
        const currentPage = linkPrefix === 'stock' ? 'all' : linkPrefix;
        setIsLastViewed(code === stock.code && page === currentPage);
      } catch {
        // JSON解析失敗時は旧形式のデータなのでハイライトしない
        setIsLastViewed(false);
      }
    }
  }, [stock.code, linkPrefix]);

  // メモ欄の背景色を動的に決定
  const getMemoBackgroundClass = (): string => {
    if (hasMemo) {
      return 'bg-blue-200 border-blue-300'; // メモがある場合：薄い青色の背景＆青い枠線
    } else {
      return 'bg-white border-gray-300'; // メモがない場合：通常の白い背景＆グレーの枠線
    }
  };

  // カードの外枠クラスを動的に決定
  const getCardBorderClass = (): string => {
    if (isLastViewed) {
      return 'ring-2 ring-blue-500 ring-offset-2'; // 最後に閲覧した銘柄：青い枠線
    }
    return '';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow relative ${getCardBorderClass()}`}>

      {/* 銘柄ステータスボタン */}
      <div className="absolute top-3 right-3 z-10">
        <StockStatusButton
          stockCode={stock.code}
          onAuthRequired={!user ? () => setShowAuthModal(true) : undefined}
        />
      </div>

      <Link
        href={linkPath}
        className="block"
      >
        {/* ヘッダー Start */}
        <div className="border-b pb-2 mb-3 pr-14"> {/* 右側にステータスボタンの余白を確保 */}
          <div className="text-lg font-bold overflow-hidden whitespace-nowrap text-ellipsis">
            {stock.code} - {stock.name}
          </div>
        </div>
        {/* ヘッダー End */}

        {/* 価格情報 Start */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span>現在値</span>
            <div className={`text-lg font-bold ${isPriceUp ? 'text-green-600' : 'text-red-600'}`}>
              ¥{Math.round(stock.closePrice).toLocaleString()}
            </div>
          </div>
          <div className="flex justify-between">
            <span>前日比</span>
            <div className={isPriceUp ? 'text-green-600' : 'text-red-600'}>
              {isPriceUp ? '+' : ''}¥{Math.round(priceDiff).toLocaleString()} ({priceChangePercent}%)
            </div>
          </div>
        </div>
        {/* 価格情報 End */}

        {/* テクニカル指標 Start */}
        <div className="space-y-1 text-sm">
          {/* RSI */}
          <div className="flex justify-between">
            <span>RSI (9日)</span>
            <span className={getRSIColor(latestRSI)}>
              {getRSIDisplayText(latestRSI)}
            </span>
          </div>
        </div>
        {/* テクニカル指標 End */}

        {/* チャート Start */}
        {stockDetailData && (
          <div className="mt-4">
            <StockChart
              dailyData={stockDetailData.dailyData}
              stock={chartStock}
              isListView={true}
            />
          </div>
        )}

        {/* データがない場合の表示 */}
        {!stockDetailData && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-center text-sm text-gray-600">
            チャートデータが見つかりません
          </div>
        )}
        {/* チャート End */}
      </Link>

      {/* メモ欄 Start */}
      <div className="mt-4 border-t pt-3">
        <div className="mt-2">
          <textarea
            value={user ? memoText : ''}
            onChange={user ? handleMemoChange : undefined}
            readOnly={!user}
            placeholder="売買メモ記入欄"
            className={`w-full p-2 border rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${user ? getMemoBackgroundClass() : 'bg-white border-gray-300 cursor-pointer'}`}
            rows={3}
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                setShowAuthModal(true);
              }
            }}
            onFocus={(e) => {
              if (!user) {
                e.target.blur();
                setShowAuthModal(true);
              }
            }}
          />
          {user && (
            <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
              <span>
                {hasMemo ? '📝 メモ保存済み' : '自動保存されます'}
              </span>
              <span className={hasMemo ? 'text-blue-600 font-medium' : ''}>
                {memoText.length}/500
              </span>
            </div>
          )}
        </div>
      </div>
      {/* メモ欄 End */}

      {/* 証券会社リンクボタン Start */}
      <div className="flex justify-center gap-4 my-3">
        {/* SBI証券 */}
        <div className="flex justify-center mt-4">
          <a
            href={`https://site3.sbisec.co.jp/ETGate/?_ControlID=WPLETsiR001Control&_PageID=WPLETsiR001Idtl30&_DataStoreID=DSWPLETsiR001Control&_ActionID=DefaultAID&s_rkbn=2&s_btype=&i_stock_sec=${stock.code}&i_dom_flg=1&i_exchange_code=JPN&i_output_type=2&exchange_code=TKY&stock_sec_code_mul=${stock.code}&ref_from=1&ref_to=20&wstm4130_sort_id=&wstm4130_sort_kbn=&qr_keyword=1&qr_suggest=1&qr_sort=1`}
            target='_blank'
            rel="noopener noreferrer"
          >
            <button className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-2 px-4 rounded inline-flex items-center">
              <span>SBI証券</span>
              <ExternalLink className="ml-2 w-4 h-4" />
            </button>
          </a>
        </div>

        {/* 楽天証券 */}
        <div className="flex justify-center mt-4">
          <a
            href={`https://www.rakuten-sec.co.jp/web/market/search/quote.html?ric=${stock.code}.T`}
            target='_blank'
            rel="noopener noreferrer"
          >
            <button className="bg-red-500 hover:bg-red-700 text-white text-xs py-2 px-4 rounded inline-flex items-center">
              <span>楽天証券</span>
              <ExternalLink className="ml-2 w-4 h-4" />
            </button>
          </a>
        </div>
      </div>
      {/* 証券会社リンクボタン End */}

      {/* 認証必要モーダル */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default StockCard;