import { dbService, type UploadedVideo } from "./indexed-db"
import { VideoToFrames, VideoToFramesMethod, type Frame } from "./video-to-frames"

type CachedVideo = {
  url: string
  frames: Frame[]
  lastAccessed: number
}

export class VideoService {
  private videoUrls: Map<string, string> = new Map()
  private videoCache: Map<string, CachedVideo> = new Map()
  private readonly MAX_CACHE_SIZE = 10 // Maximum number of videos to cache

  private addToCache(filename: string, url: string, frames: Frame[]) {
    // If cache is full, remove least recently used item
    if (this.videoCache.size >= this.MAX_CACHE_SIZE) {
      let oldestTime = Date.now()
      let oldestKey = ''

      this.videoCache.forEach((cache, key) => {
        if (cache.lastAccessed < oldestTime) {
          oldestTime = cache.lastAccessed
          oldestKey = key
        }
      })

      if (oldestKey) {
        const oldCache = this.videoCache.get(oldestKey)
        if (oldCache) {
          URL.revokeObjectURL(oldCache.url)
        }
        this.videoCache.delete(oldestKey)
      }
    }

    this.videoCache.set(filename, {
      url,
      frames,
      lastAccessed: Date.now()
    })
  }

  private updateCacheAccess(filename: string) {
    const cache = this.videoCache.get(filename)
    if (cache) {
      cache.lastAccessed = Date.now()
    }
  }

  async uploadVideo(file: File): Promise<{
    filename: string
    url: string
    frames: Frame[]
  }> {
    try {
      const filename = file.name
      const url = URL.createObjectURL(file)

      const frames = await VideoToFrames.getFrames(
        url,
        21,
        VideoToFramesMethod.totalFrames,
      )

      const video: UploadedVideo = {
        id: crypto.randomUUID(),
        src: url,
        filename,
        videoBlob: file,
        lastModified: Date.now(),
        createdAt: new Date().toISOString(),
      }

      await dbService.saveVideo(video)
      this.addToCache(filename, url, frames)

      return {
        filename,
        url,
        frames,
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      throw error
    }
  }

  async getAllVideos(): Promise<UploadedVideo[]> {
    try {
      const videos = await dbService.getAllVideos()

      return videos.map(video => {
        const cached = this.videoCache.get(video.filename)
        if (cached) {
          this.updateCacheAccess(video.filename)
          return {
            ...video,
            src: cached.url
          }
        }

        const url = URL.createObjectURL(video.videoBlob)
        return {
          ...video,
          src: url
        }
      })
    } catch (error) {
      console.error('Error getting all videos:', error)
      throw error
    }
  }

  async getVideo(filename: string): Promise<UploadedVideo | null> {
    try {
      // Check cache first
      const cached = this.videoCache.get(filename)
      if (cached) {
        this.updateCacheAccess(filename)
        const video = await dbService.getVideo(filename)
        if (!video) return null

        return {
          ...video,
          src: cached.url
        }
      }

      // If not in cache, load from IndexedDB
      const video = await dbService.getVideo(filename)
      if (!video) return null

      const url = URL.createObjectURL(video.videoBlob)
      const frames = await VideoToFrames.getFrames(
        url,
        21,
        VideoToFramesMethod.totalFrames,
      )

      this.addToCache(filename, url, frames)

      return {
        ...video,
        src: url
      }
    } catch (error) {
      console.error('Error getting video:', error)
      throw error
    }
  }

  async deleteVideo(filename: string): Promise<void> {
    try {
      await dbService.clearVideo(filename)
      const cached = this.videoCache.get(filename)
      if (cached) {
        URL.revokeObjectURL(cached.url)
        this.videoCache.delete(filename)
      }
    } catch (error) {
      console.error('Error deleting video:', error)
      throw error
    }
  }

  getFrames(filename: string): Frame[] | undefined {
    const cached = this.videoCache.get(filename)
    if (cached) {
      this.updateCacheAccess(filename)
      return cached.frames
    }
    return undefined
  }

  cleanup(): void {
    this.videoCache.forEach((cache) => {
      URL.revokeObjectURL(cache.url)
    })
    this.videoCache.clear()
  }
}

export const videoService = new VideoService()

// Clean up URLs when the window unloads
window.addEventListener('unload', () => {
  videoService.cleanup()
})