import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PageLoader } from '@/components/PageLoader'
import PageTransition from '@/components/PageTransition'

export const metadata: Metadata = {
  title: '时光笺',
  description: '你和 ta 的私密空间',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d1117',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className="font-sans">
        <PageLoader />
        <PageTransition>
          {children}
        </PageTransition>
      </body>
    </html>
  )
}
