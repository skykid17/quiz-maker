interface CacheEntry {
  quiz: unknown
  attempts: unknown[]
  fetchedAt: number
}

const cache = new Map<string, CacheEntry>()
const TTL = 30_000

export function setQuizCache(id: string, data: { quiz: unknown; attempts: unknown[] }) {
  cache.set(id, { ...data, fetchedAt: Date.now() })
}

export function getQuizCache(id: string): { quiz: unknown; attempts: unknown[] } | null {
  const entry = cache.get(id)
  if (!entry || Date.now() - entry.fetchedAt > TTL) {
    if (entry) cache.delete(id)
    return null
  }
  return { quiz: entry.quiz, attempts: entry.attempts }
}