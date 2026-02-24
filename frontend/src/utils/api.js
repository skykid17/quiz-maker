const API_BASE = '/api'

async function api(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  if (options.body && typeof options.body === 'object') {
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
  list: () => api('/quizzes'),
  get: async (id) => {
    const response = await fetch(`${API_BASE}/quizzes/${id}`);
    const data = await response.json();
    return data;
  },
  create: (data) => api('/quizzes', { method: 'POST', body: data }),
  update: (id, data) => api(`/quizzes/${id}`, { method: 'PUT', body: data }),
  delete: (id) => api(`/quizzes/${id}`, { method: 'DELETE' }),
  import: (data) => api('/quizzes/import', { method: 'POST', body: data }),
  export: (id) => api(`/quizzes/${id}/export`),
  share: (id) => api(`/quizzes/${id}/share`, { method: 'POST' }),
  getShared: (code) => api(`/quizzes/shared/${code}`),
  duplicate: (id) => api(`/quizzes/${id}/duplicate`, { method: 'POST' }),
}

export const progressApi = {
  get: (quizId) => api(`/progress/${quizId}`),
  save: (quizId, data) => api(`/progress/${quizId}`, { method: 'POST', body: data }),
  clear: (quizId) => api(`/progress/${quizId}`, { method: 'DELETE' }),
}

export const attemptApi = {
  getAll: () => api('/attempts'),
  getByQuiz: (quizId) => api(`/attempts/quiz/${quizId}`),
  get: (id) => api(`/attempts/${id}`),
  submit: (data) => api('/attempts', { method: 'POST', body: data }),
  delete: (id) => api(`/attempts/${id}`, { method: 'DELETE' }),
}

export const draftApi = {
  getAll: () => api('/drafts'),
  get: (id) => api(`/drafts/${id}`),
  save: (data) => api('/drafts', { method: 'POST', body: data }),
  delete: (id) => api(`/drafts/${id}`, { method: 'DELETE' }),
  publish: (id) => api(`/drafts/${id}/publish`, { method: 'POST' }),
}
