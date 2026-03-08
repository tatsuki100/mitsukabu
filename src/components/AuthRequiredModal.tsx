// ========================================
// src/components/AuthRequiredModal.tsx
// 認証必要ポップアップ（未ログイン時の機能使用時に表示）
// ========================================

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';

type AuthRequiredModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AuthRequiredModal = ({ isOpen, onClose }: AuthRequiredModalProps) => {
  const pathname = usePathname();

  if (!isOpen) return null;

  const loginUrl = `/login?from=${encodeURIComponent(pathname)}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 mx-4 max-w-sm w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold mb-2 text-center">会員登録が必要です</h3>
        <p className="text-gray-600 text-sm mb-6 text-center">
          この機能を使うには会員登録が必要です
        </p>
        <div className="flex gap-3">
          <Link
            href="/register"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md font-medium"
          >
            新規登録
          </Link>
          <Link
            href={loginUrl}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-2 px-4 rounded-md font-medium"
          >
            ログイン
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredModal;
