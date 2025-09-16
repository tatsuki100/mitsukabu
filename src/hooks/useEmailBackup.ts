// ========================================
// src/hooks/useEmailBackup.ts
// EmailJSを使った観察銘柄バックアップ機能
// ========================================

import { useState } from 'react';
import emailjs from '@emailjs/browser';

// EmailJS設定情報
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_xvlxas4',
  TEMPLATE_ID: 'template_em900rf',
  PUBLIC_KEY: 'PCBa1doXA7FdMQQN7',
  TO_EMAIL: 'mitsukabu.backup@gmail.com'
};

// バックアップ状態の型定義
type BackupStatus = 'idle' | 'sending' | 'success' | 'error';

// hook
export const useEmailBackup = () => {
  const [status, setStatus] = useState<BackupStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // EmailJSの初期化
  const initEmailJS = () => {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  };

  // 観察銘柄リスト + メモをメール送信
  const sendFavoritesBackup = async (
    favorites: string[], 
    stockNames: { [key: string]: string },
    allMemos: { [key: string]: string }
  ) => {
    setStatus('sending');
    setError(null);

    try {
      // EmailJSを初期化
      initEmailJS();

      // 観察銘柄リストを整形
      const favoritesList = favorites.map((code, index) => {
        const name = stockNames[code] || '銘柄名不明';
        return `${index + 1}. ${code} - ${name}`;
      }).join('\n');

      // メモがある銘柄のリストを作成
      const memosWithContent = Object.entries(allMemos)
        .filter(([, memo]) => memo.trim().length > 0) // 空でないメモのみ
        .map(([code, memo], index) => {
          const name = stockNames[code] || '銘柄名不明';
          return `${index + 1}. ${code} - ${name}：${memo}`;
        });

      const memosList = memosWithContent.length > 0 
        ? memosWithContent.join('\n')
        : 'メモが登録されている銘柄はありません。';

      // 現在の日時を取得
      const now = new Date();
      const backupDate = now.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      });

      // EmailJSのテンプレートパラメータ
      const templateParams = {
        to_email: EMAILJS_CONFIG.TO_EMAIL,
        favorites_count: favorites.length,
        favorites_list: favoritesList,
        memos_count: memosWithContent.length,
        memos_list: memosList,
        backup_date: backupDate
      };

      console.log('📧 メール送信開始...');
      console.log('送信パラメータ:', templateParams);

      // EmailJSでメール送信
      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );

      console.log('✅ メール送信成功:', response);
      setStatus('success');
      
      return { success: true };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラー';
      console.error('❌ メール送信エラー:', errorMessage);
      setError(`メール送信に失敗しました: ${errorMessage}`);
      setStatus('error');
      
      return { success: false, error: errorMessage };
    }
  };

  // ステータスをリセット
  const resetStatus = () => {
    setStatus('idle');
    setError(null);
  };

  return {
    status,
    error,
    sendFavoritesBackup,
    resetStatus,
    isLoading: status === 'sending'
  };
};