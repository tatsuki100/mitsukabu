// ========================================
// src/app/setting/page.tsx
// 株価データ取得・管理の設定ページ
// ========================================

'use client';

import { useState } from 'react';
import { useJPX400StocksWithUtils } from '@/hooks/useJPX400Stocks';
import { useYahooFinanceAPI } from '@/hooks/useYahooFinanceAPI';
import { useStockDataStorage, StoredStock } from '@/hooks/useStockDataStorage';
import { DailyData } from '@/types/stockData';

// 取得進捗の型
type FetchProgress = {
  current: number;
  total: number;
  currentStock: string;
  successCount: number;
  failureCount: number;
  isCompleted: boolean;
};

// 取得結果の型定義（useYahooFinanceAPIのStockDataResultと同じ）
type StockDataResult = {
  success: boolean;
  stock?: {
    code: string;
    name: string;
    closePrice: number;
    openPrice: number;
    highPrice: number;
    lowPrice: number;
    previousClosePrice: number;
    lastUpdated: string;
  };
  dailyData?: DailyData[];
  error?: string;
};

const SettingPage = () => {
  // JPX400銘柄データ
  const { 
    stocks: jpxStocks, 
    loading: jpxLoading, 
    error: jpxError,
    getDevelopmentCodes
  } = useJPX400StocksWithUtils();

  // Yahoo Finance API
  const { fetchMultipleStocks, loading: apiLoading } = useYahooFinanceAPI();

  // localStorage管理
  const {
    storedData,
    loading: storageLoading,
    error: storageError,
    saveStockData,
    clearStoredData,
    isDataAvailable,
    dataAge,
    storageUsage
  } = useStockDataStorage();

  // 取得進捗の状態
  const [fetchProgress, setFetchProgress] = useState<FetchProgress | null>(null);
  const [fetchResults, setFetchResults] = useState<StockDataResult[]>([]);

  // 確認モーダルの状態
  const [showConfirm, setShowConfirm] = useState<{
    type: 'fetch' | 'clear';
    message: string;
    action: () => void;
  } | null>(null);

  // 開発環境用（10銘柄）の株価データ取得
  const handleDevelopmentFetch = async () => {
    if (jpxStocks.length === 0) return;

    const developmentCodes = getDevelopmentCodes();
    const stockList = developmentCodes.map(code => {
      const stock = jpxStocks.find(s => s.code === code);
      return { code, name: stock?.name || `銘柄${code}` };
    });

    await executeStockFetch(stockList, 'テスト用10銘柄');
  };

  // 全銘柄（396銘柄）の株価データ取得
  const handleFullFetch = async () => {
    if (jpxStocks.length === 0) return;

    const stockList = jpxStocks.map(stock => ({
      code: stock.code,
      name: stock.name
    }));

    await executeStockFetch(stockList, '全396銘柄');
  };

  // 実際の株価データ取得処理
  const executeStockFetch = async (stockList: { code: string; name: string }[], description: string) => {
    try {
      console.log(`🚀 ${description}の株価データ取得を開始`);
      
      // 進捗初期化
      setFetchProgress({
        current: 0,
        total: stockList.length,
        currentStock: '',
        successCount: 0,
        failureCount: 0,
        isCompleted: false
      });
      setFetchResults([]);

      // カスタム進捗付きフェッチ
      const results: StockDataResult[] = [];
      for (let i = 0; i < stockList.length; i++) {
        const { code, name } = stockList[i];
        
        // 進捗更新
        setFetchProgress(prev => prev ? {
          ...prev,
          current: i + 1,
          currentStock: `${code} (${name})`
        } : null);

        // 個別銘柄取得
        const singleResult = await fetchMultipleStocks([{ code, name }]);
        const result = singleResult[0];
        results.push(result);

        // 成功・失敗カウント更新
        setFetchProgress(prev => prev ? {
          ...prev,
          successCount: prev.successCount + (result.success ? 1 : 0),
          failureCount: prev.failureCount + (result.success ? 0 : 1)
        } : null);

        // リクエスト間隔（500ms）
        if (i < stockList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // 取得完了
      setFetchProgress(prev => prev ? { ...prev, isCompleted: true } : null);
      setFetchResults(results);

      // localStorage保存
      const successResults = results.filter(r => r.success);
      if (successResults.length > 0) {
        const stocks: StoredStock[] = successResults.map(r => ({
          code: r.stock!.code,
          name: r.stock!.name,
          closePrice: r.stock!.closePrice,
          openPrice: r.stock!.openPrice,
          highPrice: r.stock!.highPrice,
          lowPrice: r.stock!.lowPrice,
          previousClosePrice: r.stock!.previousClosePrice,
          lastUpdated: r.stock!.lastUpdated
        }));

        const dailyDataMap: Record<string, DailyData[]> = {};
        successResults.forEach(r => {
          dailyDataMap[r.stock!.code] = r.dailyData!;
        });

        saveStockData(stocks, dailyDataMap);
        console.log(`${successResults.length}銘柄のデータをlocalStorageに保存完了`);
      }

    } catch (error) {
      console.error('株価データ取得エラー:', error);
      setFetchProgress(prev => prev ? { ...prev, isCompleted: true } : null);
    }
  };

  // 確認モーダルを表示
  const showConfirmModal = (type: 'fetch' | 'clear', message: string, action: () => void) => {
    setShowConfirm({ type, message, action });
  };

  // モーダルを閉じる
  const closeConfirmModal = () => {
    setShowConfirm(null);
  };

  // データクリア実行
  const handleClearData = () => {
    clearStoredData();
    setFetchProgress(null);
    setFetchResults([]);
    closeConfirmModal();
  };

  // JPX400データ読み込み中
  if (jpxLoading || storageLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">設定ページ読み込み中...</h2>
          <p>JPX400銘柄データとlocalStorageデータを読み込んでいます。</p>
        </div>
      </div>
    );
  }

  // JPX400データ読み込みエラー
  if (jpxError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">JPX400データエラー</h2>
          <p>{jpxError}</p>
        </div>
      </div>
    );
  }

  const successResults = fetchResults.filter(r => r.success);
  const failureResults = fetchResults.filter(r => !r.success);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* ヘッダー */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h1 className="text-2xl font-bold mb-1">株価データ設定</h1>
        <p>Yahoo Finance APIから株価データを取得してlocalStorageに保存します。</p>
        <p>※毎年8月末に最新のJPX400銘柄リストを更新してください。（<a href="https://www.torezista.com/tool/jpx400/" target='_blank' className='text-blue-500 underline'>ダウンロードリンク</a>）</p>
        <h2 className='mt-6 font-bold text-lg'>更新履歴</h2>
        <ul>
          <li>2025.09.14 - RSIの計算期間を14日から9日に変更</li>
          <li>2025.09.12 - localstorageの5MB上限を改善</li>
          <li>2025.08.03 -  デプロイ</li>
        </ul>
      </div>

      {/* localStorage状況 */}
      <div className="bg-white border border-gray-200 p-4 rounded shadow">
        <h2 className="text-lg font-bold mb-3">データ保存状況</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded">
            <div className="text-2xl font-bold text-gray-600">
              {isDataAvailable ? storedData!.totalStocks : 0}
            </div>
            <div className="text-sm text-gray-700">保存銘柄数</div>
          </div>
          <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded">
            <div className="text-2xl font-bold text-gray-600">{storageUsage}</div>
            <div className="text-sm text-gray-700">使用容量(最大5MB)</div>
          </div>
          <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded">
            <div className="text-2xl font-bold text-gray-600">
              {dataAge || '未取得'}
            </div>
            <div className="text-sm text-gray-700">最終更新</div>
          </div>
          <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded">
            <div className={`text-2xl font-bold ${isDataAvailable ? 'text-green-500' : 'text-red-500'}`}>
              {isDataAvailable ? 'Success' : 'Failure'}
            </div>
            <div className="text-sm text-gray-700">データ状態</div>
          </div>
        </div>
        
        {storageError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            <strong>エラー:</strong> {storageError}
          </div>
        )}
      </div>

      {/* 環境情報 */}
      {/* <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
        <h2 className="text-lg font-bold mb-3">現在の開発環境設定</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><strong>最大銘柄数:</strong> {config.maxStocks}銘柄</div>
          <div><strong>自動取得:</strong> {config.autoFetch ? '有効' : '無効'}</div>
          <div><strong>デバッグボタン:</strong> {config.showDebugButton ? '表示' : '非表示'}</div>
        </div>
      </div> */}

      {/* データ取得ボタン */}
      <div className="bg-green-50 border border-green-200 p-4 rounded">
        <h2 className="text-lg font-bold mb-1">株価データ取得</h2>
        <p className='text-red-400 mb-3'>※APIリクエスト制限が起こらないように、更新し過ぎに注意してください。</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => showConfirmModal(
              'fetch',
              `テスト用に10銘柄だけ株価データを取得します。\n約6秒程度かかります。\n実行しますか？`,
              handleDevelopmentFetch
            )}
            disabled={apiLoading || jpxStocks.length === 0}
            className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            {apiLoading ? '取得中...' : 'テスト用10銘柄取得'}
          </button>
          
          <button
            onClick={() => showConfirmModal(
              'fetch',
              `JPX400の全銘柄の株価データを取得します。\n約4〜5分程度かかります。\n実行しますか？`,
              handleFullFetch
            )}
            disabled={apiLoading || jpxStocks.length === 0}
            className="bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            {apiLoading ? '取得中...' : 'JPX400全銘柄取得'}
          </button>
          
          <button
            onClick={() => showConfirmModal(
              'clear',
              'localStorage内の全ての株価データを削除します。\n本当に削除しますか？',
              handleClearData
            )}
            disabled={apiLoading}
            className="bg-red-500 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            データ全削除
          </button>
        </div>
      </div>

      {/* 取得進捗 */}
      {fetchProgress && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          <h2 className="text-lg font-bold mb-3">📊 取得進捗</h2>
          <div className="space-y-3">
            <div className="bg-blue-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${(fetchProgress.current / fetchProgress.total) * 100}%` }}
              ></div>
            </div>
            <div className="text-sm">
              <div><strong>進捗:</strong> {fetchProgress.current}/{fetchProgress.total} ({Math.round((fetchProgress.current / fetchProgress.total) * 100)}%)</div>
              <div><strong>現在:</strong> {fetchProgress.currentStock}</div>
              <div><strong>成功:</strong> {fetchProgress.successCount}件 / <strong>失敗:</strong> {fetchProgress.failureCount}件</div>
              {fetchProgress.isCompleted && (
                <div className="text-green-600 font-bold">取得完了!</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 取得結果 */}
      {fetchProgress?.isCompleted && fetchResults.length > 0 && (
        <div className="space-y-4">
          {/* 結果サマリー */}
          <div className="bg-white border border-gray-200 p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-3">📈 取得結果</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 border border-green-200 rounded">
                <div className="text-2xl font-bold text-green-600">{successResults.length}</div>
                <div className="text-sm text-green-700">成功</div>
              </div>
              <div className="text-center p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-2xl font-bold text-red-600">{failureResults.length}</div>
                <div className="text-sm text-red-700">失敗</div>
              </div>
              <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="text-2xl font-bold text-blue-600">{fetchResults.length}</div>
                <div className="text-sm text-blue-700">総数</div>
              </div>
            </div>
          </div>

          {/* 失敗した銘柄（ある場合のみ） */}
          {failureResults.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-4 rounded">
              <h3 className="text-lg font-bold mb-3 text-red-800">取得失敗銘柄</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {failureResults.map((result, index) => (
                  <div key={index} className="bg-white border border-red-300 p-3 rounded text-sm">
                    <div className="text-red-700">
                      <strong>エラー:</strong> {result.error}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 確認モーダル */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">
              {showConfirm.type === 'fetch' ? '実行確認' : '削除確認'}
            </h3>
            <p className="text-gray-700 mb-6 whitespace-pre-line">
              {showConfirm.message}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  showConfirm.action();
                  closeConfirmModal();
                }}
                className={`px-4 py-2 text-white rounded ${
                  showConfirm.type === 'fetch' 
                    ? 'bg-blue-500 hover:bg-blue-700' 
                    : 'bg-red-500 hover:bg-red-700'
                }`}
              >
                {showConfirm.type === 'fetch' ? '実行' : '削除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingPage;