// ========================================
// src/components/Footer.tsx
// フッターコンポーネント
// ========================================

import Link from 'next/link'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              © {currentYear} みつかぶ. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              株価データはYahoo Finance APIを使用しています。
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <Link 
              href="/privacy" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              プライバシーポリシー
            </Link>
            <Link 
              href="/terms" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              利用規約
            </Link>
            {/* <a 
              href="https://twitter.com/your_handle" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Twitter
            </a> */}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            投資の判断は必ずご自身の責任で行ってください。当サービスは投資の結果について一切の責任を負いません。
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer