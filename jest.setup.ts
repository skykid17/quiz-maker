import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  },
}))

// Mock API
jest.mock('@/lib/api', () => ({
  quizApi: {
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue({ quiz: {}, attempts: [] }),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    import: jest.fn().mockResolvedValue({}),
    getShared: jest.fn().mockResolvedValue({}),
    share: jest.fn().mockResolvedValue({ shareCode: 'TEST-123' }),
    duplicate: jest.fn().mockResolvedValue({ id: 'new-id' }),
  },
  draftApi: {
    get: jest.fn().mockResolvedValue({}),
    save: jest.fn().mockResolvedValue({ _id: 'draft-123' }),
    publish: jest.fn().mockResolvedValue({ quizId: 'quiz-123' }),
  },
  attemptApi: {
    getAll: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue({}),
    submit: jest.fn().mockResolvedValue({ id: 'attempt-123' }),
    delete: jest.fn().mockResolvedValue({}),
  },
  progressApi: {
    get: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue({}),
    clear: jest.fn().mockResolvedValue({}),
  },
}))

// Mock auth hooks
jest.mock('@/lib/auth-hooks', () => ({
  useLogin: () => ({ login: jest.fn(), loading: false, error: null }),
  useSignUp: () => ({ signUp: jest.fn(), loading: false, error: null }),
  useLogout: () => ({ logout: jest.fn(), loading: false }),
}))

// Mock auth context
jest.mock('@/lib/auth-context', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ session: null, user: null, isLoading: false }),
}))

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}