import type { UploadedVideo } from "./indexed-db"
import type { Frame } from "./video-to-frames"

type CachedVideoData = {
  video: {
    id?: string
    src: string
    filename: string
  }
  frames: Frame[]
  timestamp: number
}

const CACHE_PREFIX = "video-editor:"
const CACHE_EXPIRY = 1000 * 60 * 60 * 24 // 24 hours
const MAX_FRAMES = 21 // Maximum number of frames to store
const MAX_CACHE_ITEMS = 5 // Maximum number of videos in cache

export class CacheService {
  private memoryCache: Map<string, CachedVideoData>
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB limit

  constructor() {
    this.memoryCache = new Map()
    this.loadFromLocalStorage()
  }

  set(
    filename: string,
    video: Partial<UploadedVideo>,
    frames: Frame[],
    clearExisting = true,
  ) {
    if (!frames?.length || !video?.src) {
      console.warn("Invalid data provided to cache")
      return
    }

    if (!clearExisting) {
      const existing = this.get(filename)
      if (existing?.video.src && existing.frames.length > 0) return
    }

    const data: CachedVideoData = {
      video: {
        id: video.id,
        src: video.src,
        filename: video.filename || filename,
      },
      frames: frames.slice(0, MAX_FRAMES),
      timestamp: Date.now(),
    }

    try {
      // Calculate entry size
      const entrySize = new Blob([JSON.stringify(data)]).size

      // Check if we need to clear space
      if (this.getStorageSize() + entrySize > this.MAX_STORAGE_SIZE) {
        this.removeOldestEntries(entrySize)
      }

      // Update memory cache
      this.memoryCache.set(filename, data)

      // Save to localStorage
      localStorage.setItem(
        this.getKey(filename),
        JSON.stringify({
          ...data.video,
          frames: data.frames,
          timestamp: data.timestamp,
        }),
      )
    } catch (error) {
      if (error instanceof Error && error.name === "QuotaExceededError") {
        this.removeOldestEntries()
        // Try again after clearing
        this.set(filename, video, frames, clearExisting)
      } else {
        console.warn("Failed to save to storage:", error)
      }
    }
  }

  private getStorageSize(): number {
    let totalSize = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        totalSize += new Blob([localStorage.getItem(key) || ""]).size
      }
    }
    return totalSize
  }

  private removeOldestEntries(requiredSpace: number = 0) {
    const entries: { key: string; timestamp: number; size: number }[] = []

    // Collect all entries with their sizes
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const value = localStorage.getItem(key) || ""
          const data = JSON.parse(value)
          entries.push({
            key,
            timestamp: data.timestamp,
            size: new Blob([value]).size,
          })
        } catch {
          // Remove corrupted entries
          localStorage.removeItem(key)
        }
      }
    }

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp)

    let freedSpace = 0
    let removedCount = 0

    // Remove oldest entries until we have enough space
    while (
      entries.length > 0 &&
      (freedSpace < requiredSpace ||
        removedCount < entries.length - MAX_CACHE_ITEMS)
    ) {
      const entry = entries.shift()
      if (entry) {
        const filename = entry.key.replace(CACHE_PREFIX, "")
        this.memoryCache.delete(filename)
        localStorage.removeItem(entry.key)
        freedSpace += entry.size
        removedCount++
      }
    }
  }

  get(
    filename: string,
  ): { video: Partial<UploadedVideo>; frames: Frame[] } | null {
    // Try memory cache first
    const memoryData = this.memoryCache.get(filename)
    if (
      memoryData?.video.src &&
      Date.now() - memoryData.timestamp < CACHE_EXPIRY &&
      this.isValidCacheEntry(memoryData)
    ) {
      return {
        video: memoryData.video,
        frames: memoryData.frames,
      }
    }

    // Try localStorage next
    try {
      const cached = localStorage.getItem(this.getKey(filename))
      if (cached) {
        const data = JSON.parse(cached)
        if (
          this.isValidCacheEntry(data) &&
          Date.now() - data.timestamp <= CACHE_EXPIRY
        ) {
          const cachedData = {
            video: {
              filename: data.filename,
              src: data.src,
              id: data.id,
            },
            frames: data.frames,
            timestamp: data.timestamp,
          }

          // Update memory cache
          this.memoryCache.set(filename, cachedData)
          return cachedData
        }
      }
    } catch (error) {
      console.warn("Failed to read from localStorage:", error)
    }

    return null
  }

  private getKey(filename: string): string {
    return `${CACHE_PREFIX}${filename}`
  }

  private isValidCacheEntry(data: CachedVideoData): boolean {
    return Boolean(
      data &&
        data.video?.src &&
        Array.isArray(data.frames) &&
        data.frames.length > 0 &&
        data.frames.every((frame) => frame.id && frame.src),
    )
  }

  private loadFromLocalStorage() {
    const entries: [string, CachedVideoData][] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "")
          if (Date.now() - data.timestamp <= CACHE_EXPIRY) {
            const filename = key.replace(CACHE_PREFIX, "")
            entries.push([
              filename,
              {
                video: {
                  filename: data.filename,
                  src: data.src,
                  id: data.id,
                },
                frames: data.frames,
                timestamp: data.timestamp,
              },
            ])
          }
        } catch (error) {
          // Don't remove items on error, just skip them
          console.warn(`Failed to load cache entry: ${key}`, error)
        }
      }
    }

    // Only keep the most recent items in memory
    entries
      .sort(([, a], [, b]) => b.timestamp - a.timestamp)
      .slice(0, MAX_CACHE_ITEMS)
      .forEach(([key, value]) => {
        this.memoryCache.set(key, value)
      })
  }

  remove(filename: string) {
    this.memoryCache.delete(filename)
    localStorage.removeItem(this.getKey(filename))
  }

  clear() {
    // Only clear memory cache
    this.memoryCache.clear()
  }
}

export const cacheService = new CacheService()
