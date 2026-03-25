/**
 * Auth Layout
 * Minimal layout for auth pages (login/signup)
 * Excludes main navigation and styling to focus on auth flow
 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-md p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Quiz Maker</h1>
                        <p className="mt-2 text-gray-600">Sign in to your account</p>
                    </div>

                    {/* Auth Content */}
                    {children}
                </div>
            </div>
        </div>
    )
}
