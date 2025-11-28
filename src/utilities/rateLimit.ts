const store = new Map<string, number>()

export function canSend(key: string, intervalMs: number) {
  const last = store.get(key) || 0
  const now = Date.now()
  if (last && now - last < intervalMs) return false
  store.set(key, now)
  return true
}

export function touch(key: string) {
  store.set(key, Date.now())
}

