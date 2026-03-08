// ========================================
// src/app/setting/page.tsx
// 設定ページ（DB移行版 - 株価データは毎日16時に自動更新）
// ========================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStockDataStorage } from '@/hooks/useStockDataStorage';
import { useAuth } from '@/components/AuthProvider';

// ユーザー一覧の型
type UserItem = {
  id: number;
  userName: string;
  email: string | null;
  role: string;
  createdAt: string;
};

const SettingPage = () => {
  // 株価データ管理
  const {
    storedData,
    loading: storageLoading,
    error: storageError,
    isDataAvailable,
    dataAge,
  } = useStockDataStorage();

  // 認証情報（管理者判定用）
  const user = useAuth();

  // 手動更新の状態管理
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // ユーザー管理の状態管理
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<number | null>(null);

  // ユーザー一覧取得
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'ユーザー一覧の取得に失敗しました');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // admin時のみユーザー一覧を取得
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  // 権限変更
  const handleRoleChange = async (userId: number, newRole: string) => {
    setChangingRoleId(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // 成功 → 一覧を更新
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(err instanceof Error ? err.message : '権限の変更に失敗しました');
    } finally {
      setChangingRoleId(null);
    }
  };

  // 管理者用手動更新
  const handleManualRefresh = async () => {
    setRefreshStatus('sending');
    setRefreshError(null);

    try {
      const response = await fetch('/api/stocks/refresh', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新の開始に失敗しました');
      }

      setRefreshStatus('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      setRefreshError(errorMessage);
      setRefreshStatus('error');
    }
  };

  // データ読み込み中
  if (storageLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">設定ページ読み込み中...</h2>
          <p>株価データを読み込んでいます。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* ヘッダー */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h1 className="text-2xl font-bold mb-1">株価データ設定</h1>
        <p>株価データは毎日6時ごろ（月〜金）にLambda関数で自動更新されます。</p>
        <p>※毎年8月末に最新のJPX400銘柄リストを更新してください。（<a href="https://www.torezista.com/tool/jpx400/" target='_blank' className='text-blue-500 underline'>ダウンロードリンク</a>）</p>
        <h2 className='mt-6 font-bold text-lg'>更新履歴</h2>
        <ul>
          <li>2026.03.08 - 会員登録機能＆株価の自動更新機能実装</li>
          <li>2026.03.07 - データベース化に伴うバックアップメール廃止</li>
          <li>2025.12.10 - 検討銘柄新設＆バックアップメール改修</li>
          <li>2025.12.6 - ページネーション改修</li>
          <li>2025.11.29 - 3141上場廃止</li>
          <li>2025.09.18 - 株価データがnullの場合のスキップ表示を実装</li>
          <li>2025.09.17 - localstorage上限時の自動圧縮を5MBから4.7MBに引き下げ</li>
          <li>2025.09.16 - 観察銘柄とメモのバックアップ機能を追加</li>
          <li>2025.09.15 - <span className='font-bold'>JPX400銘柄更新</span></li>
          <li>2025.09.14 - RSIの計算期間を14日から9日に変更</li>
          <li>2025.09.12 - localstorageの5MB上限を改善</li>
          <li>2025.08.03 - デプロイ</li>
        </ul>
      </div>

      {/* データ保存状況 */}
      <div className="bg-white border border-gray-200 p-4 rounded shadow">
        <h2 className="text-lg font-bold mb-3">データ保存状況</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 border border-gray-200 rounded">
            <div className="text-2xl font-bold text-gray-600">
              {isDataAvailable ? storedData!.totalStocks : 0}
            </div>
            <div className="text-sm text-gray-700">保存銘柄数</div>
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

      {/* 管理者用：手動更新ボタン */}
      {user?.role === 'admin' && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded">
          <h2 className="text-lg font-bold mb-1">管理者用：株価データ手動更新</h2>
          <p className="text-gray-600 mb-3">
            Lambda関数を手動で実行して株価データを更新します。通常は毎日16時ごろに自動実行されます。
          </p>
          <button
            onClick={handleManualRefresh}
            disabled={refreshStatus === 'sending'}
            className={`font-bold py-2 px-4 rounded ${
              refreshStatus === 'sending'
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-700 text-white'
            }`}
          >
            {refreshStatus === 'sending' ? '更新開始中...' : '手動更新を実行'}
          </button>

          {refreshStatus === 'success' && (
            <p className="text-green-600 text-sm mt-2">
              更新を開始しました。完了まで数分かかります。
            </p>
          )}
          {refreshStatus === 'error' && refreshError && (
            <p className="text-red-500 text-sm mt-2">
              エラー: {refreshError}
            </p>
          )}
        </div>
      )}

      {/* 管理者用：ユーザー管理 */}
      {user?.role === 'admin' && (
        <div className="bg-white border border-gray-200 p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-3">管理者用：ユーザー管理</h2>

          {usersLoading && (
            <p className="text-gray-500 text-sm">読み込み中...</p>
          )}

          {usersError && (
            <p className="text-red-500 text-sm">{usersError}</p>
          )}

          {!usersLoading && !usersError && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="py-2 pr-4">No.</th>
                    <th className="py-2 pr-4">ユーザー名</th>
                    <th className="py-2 pr-4">メールアドレス</th>
                    <th className="py-2 pr-4">権限</th>
                    <th className="py-2 pr-4">登録日</th>
                    <th className="py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, index) => (
                    <tr key={u.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4 text-gray-500">{index + 1}</td>
                      <td className="py-2 pr-4 font-medium">{u.userName}</td>
                      <td className="py-2 pr-4 text-gray-600">{u.email || '—'}</td>
                      <td className="py-2 pr-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          u.role === 'admin'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-600'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                      </td>
                      <td className="py-2">
                        {u.id === user.userId ? (
                          <span className="text-xs text-gray-400">自分</span>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                            disabled={changingRoleId === u.id}
                            className={`text-xs px-2 py-1 rounded ${
                              changingRoleId === u.id
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : u.role === 'admin'
                                  ? 'bg-blue-200 hover:bg-blue-300 text-blue-700'
                                  : 'bg-red-100 hover:bg-red-200 text-red-700'
                            }`}
                          >
                            {changingRoleId === u.id
                              ? '変更中...'
                              : u.role === 'admin'
                                ? 'userに変更'
                                : 'adminに変更'
                            }
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!usersLoading && !usersError && users.length === 0 && (
            <p className="text-gray-500 text-sm">ユーザーが見つかりません</p>
          )}
        </div>
      )}

      {/* Gitコマンド */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h2 className='mb-3 font-bold text-lg'>Gitのプッシュコマンド</h2>
        <ul>
          <li className='mb-3'># 変更されたファイルを確認：　git status</li>
          <li className='mb-3'># 変更をステージング：　git add .</li>
          <li className='mb-3'># コミット：　git commit -m &quot;update&quot;</li>
          <li className='mb-3'># GitHubにプッシュ：　git push origin main</li>
        </ul>
      </div>
    </div>
  );
};

export default SettingPage;
