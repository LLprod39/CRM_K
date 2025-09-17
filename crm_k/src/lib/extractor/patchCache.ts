import type { ExtractorPatch } from '@/domain/entities'

interface CacheEntry {
  patch: ExtractorPatch
  expiresAt: number
}

const CACHE = new Map<string, CacheEntry>()
const DEFAULT_TTL_MS = Number(process.env.EXTRACTOR_PATCH_CACHE_TTL_MS ?? 300000)

export function getCachedPatch(key: string): ExtractorPatch | null {
  const entry = CACHE.get(key)
  if (!entry) {
    return null
  }

  if (Date.now() > entry.expiresAt) {
    CACHE.delete(key)
    return null
  }

  return entry.patch
}

export function setCachedPatch(key: string, patch: ExtractorPatch, ttlMs?: number) {
  const expiresAt = Date.now() + (ttlMs ?? DEFAULT_TTL_MS)
  CACHE.set(key, { patch, expiresAt })
}

export function clearExpiredPatches() {
  const now = Date.now()
  for (const [key, entry] of CACHE.entries()) {
    if (now > entry.expiresAt) {
      CACHE.delete(key)
    }
  }
}
