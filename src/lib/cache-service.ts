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
const MAX_FRAME_SIZE = 100 * 1024 // 100KB per frame max

export class CacheService {
  private memoryCache: Map<string, CachedVideoData>
  private readonly MAX_LOCAL_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB limit for localStorage
  private readonly MAX_SESSION_STORAGE_SIZE = 5 * 1024 * 1024 // Additional 5MB from sessionStorage

  constructor() {
    this.memoryCache = new Map()
    this.loadFromStorage()
  }

  private loadFromStorage() {
    // Load from localStorage first
    const localEntries = this.loadEntriesFromStorage(localStorage)

    // Then load additional entries from sessionStorage
    const sessionEntries = this.loadEntriesFromStorage(sessionStorage)

    // Combine and sort all entries
    const allEntries = [...localEntries, ...sessionEntries]
      .sort(([, a], [, b]) => b.timestamp - a.timestamp)
      .slice(0, MAX_CACHE_ITEMS)

    // Update memory cache
    allEntries.forEach(([key, value]) => {
      this.memoryCache.set(key, value)
    })
  }

  private loadEntriesFromStorage(storage: Storage): [string, CachedVideoData][] {
    const entries: [string, CachedVideoData][] = []

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const data = JSON.parse(storage.getItem(key) || "")
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
          console.warn(`Failed to load cache entry: ${key}`, error)
        }
      }
    }

    return entries
  }

  async set(
    filename: string,
    video: Partial<UploadedVideo>,
    frames: Frame[],
    clearExisting = true,
  ): Promise<void> {
    if (!frames?.length || !video?.src) {
      console.warn("Invalid data provided to cache")
      return
    }

    if (!clearExisting) {
      const existing = this.get(filename)
      if (existing?.video.src && existing.frames.length > 0) return
    }

    try {
      // Optimize frames before storing
      const optimizedFrames = await this.optimizeFrames(frames.slice(0, MAX_FRAMES))

      const data: CachedVideoData = {
        video: {
          id: video.id,
          src: video.src,
          filename: video.filename || filename,
        },
        frames: optimizedFrames,
        timestamp: Date.now(),
      }

      const entrySize = this.calculateSize(data)
      const localStorageSize = this.getStorageSize(localStorage)

      // Try localStorage first
      if (localStorageSize + entrySize <= this.MAX_LOCAL_STORAGE_SIZE) {
        this.saveToStorage(localStorage, filename, data)
      } else {
        // If localStorage is full, try sessionStorage
        const sessionStorageSize = this.getStorageSize(sessionStorage)
        if (sessionStorageSize + entrySize <= this.MAX_SESSION_STORAGE_SIZE) {
          this.saveToStorage(sessionStorage, filename, data)
        } else {
          // If both storages are full, remove oldest entries and try again
          this.removeOldestEntries(entrySize)
          await this.set(filename, video, frames, clearExisting)
          return
        }
      }

      // Update memory cache
      this.memoryCache.set(filename, data)
    } catch (error) {
      console.warn("Failed to save to storage:", error)
    }
  }

  private saveToStorage(storage: Storage, filename: string, data: CachedVideoData) {
    storage.setItem(
      this.getKey(filename),
      JSON.stringify({
        id: data.video.id,
        src: data.video.src,
        filename: data.video.filename,
        frames: data.frames,
        timestamp: data.timestamp,
      })
    )
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
    const localData = this.getFromStorage(localStorage, filename)
    if (localData) return localData

    // Finally try sessionStorage
    const sessionData = this.getFromStorage(sessionStorage, filename)
    if (sessionData) return sessionData

    return null
  }

  private getFromStorage(storage: Storage, filename: string): { video: Partial<UploadedVideo>; frames: Frame[] } | null {
    try {
      const cached = storage.getItem(this.getKey(filename))
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
      console.warn("Failed to read from storage:", error)
    }
    return null
  }

  private async optimizeFrames(frames: Frame[]): Promise<Frame[]> {
    const optimizedFrames = await Promise.all(
      frames.map(async frame => ({
        id: frame.id,
        src: await this.optimizeDataUrl(frame.src)
      }))
    )
    return optimizedFrames
  }

  private async optimizeDataUrl(dataUrl: string): Promise<string> {
    if (this.getDataUrlSize(dataUrl) > MAX_FRAME_SIZE) {
      return await this.reduceDataUrlQuality(dataUrl)
    }
    return dataUrl
  }

  private async reduceDataUrlQuality(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!

        let { width, height } = img
        const maxDimension = 320

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'medium'
        ctx.drawImage(img, 0, 0, width, height)

        resolve(canvas.toDataURL('image/jpeg', 0.6))
      }
      img.src = dataUrl
    })
  }

  private getDataUrlSize(dataUrl: string): number {
    return new Blob([dataUrl]).size
  }

  private calculateSize(data: CachedVideoData): number {
    return new Blob([JSON.stringify({
      id: data.video.id,
      src: data.video.src,
      filename: data.video.filename,
      frames: data.frames,
      timestamp: data.timestamp,
    })]).size
  }

  private getStorageSize(storage: Storage): number {
    let totalSize = 0
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        totalSize += new Blob([storage.getItem(key) || ""]).size
      }
    }
    return totalSize
  }

  private removeOldestEntries(requiredSpace: number = 0) {
    // Collect entries from both storages
    const localEntries = this.loadEntriesFromStorage(localStorage)
    const sessionEntries = this.loadEntriesFromStorage(sessionStorage)
    const allEntries = [...localEntries, ...sessionEntries]
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)

    let freedSpace = 0
    while (
      allEntries.length > 0 &&
      freedSpace < requiredSpace
    ) {
      const entry = allEntries.shift()
      if (entry) {
        const filename = entry[0].replace(CACHE_PREFIX, "")
        this.memoryCache.delete(filename)
        localStorage.removeItem(entry[0])
        sessionStorage.removeItem(entry[0])
        freedSpace += this.calculateSize(entry[1])
      }
    }
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
