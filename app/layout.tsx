import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import Layout from '@/components/Layout'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'Quiz Maker',
  description: 'Create and take quizzes',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}
