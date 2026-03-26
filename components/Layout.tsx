'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { History, PlusCircle, Home, LogOut, Loader, Menu, X } from 'lucide-react'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { useLogout } from '@/lib/auth-hooks'

interface LayoutProps {
  children: React.ReactNode
}

function LayoutHeader() {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const { logout, loading: logoutLoading } = useLogout()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  if (pathname?.startsWith('/auth')) {
    return null
  }

  const navLinks = [
    { href: '/', label: 'Home', icon: Home, active: isActive('/') && pathname === '/' },
    { href: '/history', label: 'History', icon: History, active: isActive('/history') },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/favicon.png"
              alt="Quiz Maker"
              className="w-8 h-8 rounded-lg"
            />
            <span className="text-lg font-semibold text-stone-900 tracking-tight">
              Quiz Maker
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  link.active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}

            <Link
              href="/quiz/create"
              className="btn-primary ml-2 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Create Quiz
            </Link>

            <div className="flex items-center gap-2 ml-3 pl-3 border-l border-stone-200">
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin text-stone-400" />
              ) : user ? (
                <>
                  <span className="text-sm text-stone-500 hidden lg:block max-w-[160px] truncate">
                    {user.email}
                  </span>
                  <button
                    onClick={logout}
                    disabled={logoutLoading}
                    className="p-2 text-stone-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all duration-200"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : null}
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all duration-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-stone-100 mt-2 pt-3">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    link.active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}

              <Link
                href="/quiz/create"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary mt-2 text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Create Quiz
              </Link>

              {user && (
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <p className="px-4 text-xs text-stone-400 mb-2 truncate">{user.email}</p>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      logout()
                    }}
                    disabled={logoutLoading}
                    className="flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium w-full transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default function Layout({ children }: LayoutProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-stone-50">
        <LayoutHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
