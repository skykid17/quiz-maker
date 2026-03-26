export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-100 via-stone-50 to-blue-50/30 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                <div className="card p-8 sm:p-10 shadow-warm-md">
                    <div className="text-center mb-8">
                        <img
                            src="/favicon.png"
                            alt="Quiz Maker"
                            className="w-12 h-12 rounded-xl mx-auto mb-4"
                        />
                        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
                            Quiz Maker
                        </h1>
                        <p className="mt-1.5 text-stone-500 text-sm">
                            Sign in to your account
                        </p>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    )
}
