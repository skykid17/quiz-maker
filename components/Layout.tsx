'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, History, PlusCircle, Home, LogOut, Loader } from 'lucide-react'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { useLogout } from '@/lib/auth-hooks'

interface LayoutProps {
  children: React.ReactNode
}

/**
 * Layout Header Component
 * Shows navigation and user info
 */
function LayoutHeader() {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const { logout, loading: logoutLoading } = useLogout()

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  // Don't show header on auth pages
  if (pathname?.startsWith('/auth')) {
    return null
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-2 sm:h-16 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 min-h-10">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900">Quiz Maker</span>
          </Link>

          <nav className="w-full sm:w-auto flex flex-wrap items-center justify-end gap-2 sm:gap-4">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-2 min-h-10 rounded-lg text-sm font-medium transition-colors ${isActive('/') && pathname === '/'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>

            <Link
              href="/history"
              className={`flex items-center gap-2 px-3 py-2 min-h-10 rounded-lg text-sm font-medium transition-colors ${isActive('/history')
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </Link>

            <Link
              href="/quiz/create"
              className="flex items-center gap-2 px-4 py-2 min-h-10 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Create Quiz</span>
            </Link>

            {/* User Info and Logout */}
            <div className="flex items-center gap-2 sm:gap-3 sm:ml-4 sm:pl-4 sm:border-l border-gray-200">
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin text-gray-400" />
              ) : user ? (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    disabled={logoutLoading}
                    className="flex items-center gap-2 px-3 py-2 min-h-10 text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm">Logout</span>
                  </button>
                </>
              ) : null}
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

/**
 * Main Layout Component with Auth Provider
 */
export default function Layout({ children }: LayoutProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <LayoutHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
