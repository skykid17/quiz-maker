import type { Quiz, QuizDraft, Attempt, Progress, QuizWithStats, Question } from './supabase/types'

const API_BASE = '/api'

// Frontend uses camelCase, API transforms to snake_case
interface DraftInput {
  _id?: string
  id?: string
  title?: string
  description?: string
  timeLimit?: number | null
  tags?: string[]
  autoGenerateShareCode?: boolean
  questions?: Question[]
  currentStep?: number
}

async function api<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body)
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || error.errors?.join(', ') || 'Request failed')
  }

  return response.json()
}

export const quizApi = {
  list: () => api<QuizWithStats[]>('/quizzes'),
  get: (id: string) => api<{ quiz: Quiz; attempts: Attempt[] }>(`/quizzes/${id}`),
  create: (data: Partial<Quiz>) => api<Quiz>('/quizzes', { method: 'POST', body: data as unknown as BodyInit }),
  update: (id: string, data: Partial<Quiz>) => api<Quiz>(`/quizzes/${id}`, { method: 'PUT', body: data as unknown as BodyInit }),
  delete: (id: string) => api<{ message: string }>(`/quizzes/${id}`, { method: 'DELETE' }),
  import: (data: Partial<Quiz>) => api<Quiz>('/quizzes/import', { method: 'POST', body: data as unknown as BodyInit }),
  export: (id: string) => api<Quiz>(`/quizzes/${id}/export`),
  share: (id: string) => api<{ shareCode: string }>(`/quizzes/${id}/share`, { method: 'POST' }),
  getShared: (code: string) => api<Quiz>(`/quizzes/shared/${code}`),
  duplicate: (id: string) => api<Quiz>(`/quizzes/${id}/duplicate`, { method: 'POST' }),
}

export const progressApi = {
  get: (quizId: string) => api<Progress | null>(`/progress/${quizId}`),
  save: (quizId: string, data: Partial<Progress>) =>
    api<Progress>(`/progress/${quizId}`, { method: 'POST', body: data as unknown as BodyInit }),
  clear: (quizId: string) => api<{ message: string }>(`/progress/${quizId}`, { method: 'DELETE' }),
}

export const attemptApi = {
  getAll: () => api<Attempt[]>('/attempts'),
  getByQuiz: (quizId: string) => api<Attempt[]>(`/attempts/quiz/${quizId}`),
  get: (id: string) => api<Attempt & { quizId: Quiz }>(`/attempts/${id}`),
  submit: (data: {
    quizId: string
    answers: { questionId: string; selectedOptionIds: string[] }[]
    startedAt: string
    mode: 'immediate' | 'end'
  }) => api<Attempt>('/attempts', { method: 'POST', body: data as unknown as BodyInit }),
  delete: (id: string) => api<{ message: string }>(`/attempts/${id}`, { method: 'DELETE' }),
}

export const draftApi = {
  getAll: () => api<(QuizDraft & { _id: string; questionCount: number })[]>('/drafts'),
  get: (id: string) => api<QuizDraft & { _id: string }>(`/drafts/${id}`),
  save: (data: DraftInput) =>
    api<QuizDraft & { _id: string }>('/drafts', { method: 'POST', body: data as unknown as BodyInit }),
  delete: (id: string) => api<{ message: string }>(`/drafts/${id}`, { method: 'DELETE' }),
  publish: (id: string) => api<{ quizId: string; quiz: Quiz; message: string }>(`/drafts/${id}/publish`, { method: 'POST' }),
}

export async function uploadImage(
  file: File,
  type: 'question' | 'option',
  quizId: string,
  questionId: string,
  optionId?: string
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  formData.append('quizId', quizId)
  formData.append('questionId', questionId)
  if (optionId) formData.append('optionId', optionId)

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(error.error || 'Upload failed')
  }

  const { url } = await response.json()
  return url
}
