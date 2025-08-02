// ========================================
// src/app/layout.tsx
// 全体レイアウトファイル
// ========================================

import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Header from '@/components/Header'
import Footer from '@/components/Footer'
// import Script from 'next/script'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "みつかぶ",
  description: "JPX400銘柄のチャートを一覧で表示しています。会員登録不要。毎日17時ごろ株価データ更新。お気に入り機能もあり。【狙い目の株が見つかる。みつかぶ】",
  // SEO用の追加メタデータ
  keywords: "株式投資, JPX400, スクリーニング, ローソク足チャート, 移動平均線, RSI, MACD, ターンバック, テクニカル分析, 株価チャート",
  authors: [{ name: "みつかぶ" }],
  creator: "みつかぶ",
  publisher: "みつかぶ",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  // OGP設定
  openGraph: {
    title: "みつかぶ - JPX400株式スクリーニングツール",
    description: "JPX400銘柄をローソク足チャートで一覧表示。会員登録不要＆完全無料。株価データは毎日17時ごろ更新。【狙い目の株が見つかる。みつかぶ。】",
    type: "website",
    locale: "ja_JP",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://www.mitsukabu.com" || "https://mitsukabu.com",
    siteName: "みつかぶ",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "みつかぶ - JPX400株式スクリーニングツール",
      },
    ],
  },
  // Twitter Card設定
  twitter: {
    card: "summary_large_image",
    title: "みつかぶ - JPX400株式スクリーニングツール",
    description: "JPX400銘柄をローソク足チャートで一覧表示。移動平均線、RSI、MACDを使ったテクニカル分析ツール。",
    images: ["/og-image.jpg"],
  },
  // アプリアイコン設定
  // icons: {
  //   icon: "/favicon.ico",
  //   shortcut: "/favicon-16x16.png",
  //   apple: "/apple-touch-icon.png",
  // },
  // その他のメタデータ
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://www.mitsukabu.com" || "https://mitsukabu.com"),
  alternates: {
    canonical: "/",
  },
}

// Google Analytics の測定ID（環境変数から取得）
// const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        {/* Google アナリティクスタグ Start */}
        {/* {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_title: document.title,
                  page_location: window.location.href,
                });
              `}
            </Script>
          </>
        )} */}
        {/* Google アナリティクスタグ End */}
      </head>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="pt-10 flex-1"> {/* ヘッダーの高さと同じ分の余白 */}
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  )
}