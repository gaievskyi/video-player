import {
  VideoToFrames,
  VideoToFramesMethod,
  type Frame,
} from "../lib/video-to-frames"
import { cacheService } from "./cache-service"
import { dbService, type UploadedVideo } from "./indexed-db-service"

type CachedVideo = {
  url: string
  frames: Frame[]
  lastAccessed: number
}

type PreloadStatus = {
  promise: Promise<UploadedVideo | null>
  timestamp: number
}

export class VideoService {
  private videoCache: Map<string, CachedVideo> = new Map()
  private preloadCache: Map<string, PreloadStatus> = new Map()
  private readonly PRELOAD_CACHE_TIMEOUT = 30000 // 30 seconds

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
      await cacheService.set(filename, video, frames)

      return {
        filename,
        url,
        frames,
      }
    } catch (error) {
      console.error("Error uploading video:", error)
      throw error
    }
  }

  async getAllVideos(): Promise<UploadedVideo[]> {
    try {
      const videos = await dbService.getAllVideos()

      return videos.map((video) => {
        const cached = this.videoCache.get(video.filename)
        if (cached) {
          return {
            ...video,
            src: cached.url,
          }
        }

        const url = URL.createObjectURL(video.videoBlob)
        return {
          ...video,
          src: url,
        }
      })
    } catch (error) {
      console.error("Error getting all videos:", error)
      throw error
    }
  }

  async getVideo(
    filename: string,
  ): Promise<UploadedVideo & { frames: Frame[] }> {
    try {
      // Check fast cache first
      const cached = cacheService.get(filename)
      if (cached?.video.src && cached.frames.length > 0) {
        // For cached videos, create a new blob URL to ensure it's valid
        const video = await dbService.getVideo(filename)
        const url = video
          ? URL.createObjectURL(video.videoBlob)
          : cached.video.src

        return {
          id: cached.video.id || "",
          src: url,
          filename: cached.video.filename || filename,
          videoBlob: video?.videoBlob || new Blob(),
          lastModified: Date.now(),
          createdAt: new Date().toISOString(),
          frames: cached.frames,
        }
      }

      const video = await dbService.getVideo(filename)
      if (!video) {
        throw new Error("Video not found")
      }

      const url = URL.createObjectURL(video.videoBlob)
      const containerWidth = window.innerWidth
      const frames = await VideoToFrames.getFrames(
        url,
        21,
        VideoToFramesMethod.totalFrames,
        containerWidth,
      )

      const videoData = {
        ...video,
        src: url,
        frames,
      }

      // Cache the result
      await cacheService.set(filename, videoData, frames)

      return videoData
    } catch (error) {
      console.error("Error getting video:", error)
      throw error
    }
  }

  async deleteVideo(filename: string): Promise<void> {
    try {
      // Remove from IndexedDB
      await dbService.clearVideo(filename)

      // Remove from cache
      cacheService.remove(filename)

      // Clean up memory cache and blob URL
      const cached = this.videoCache.get(filename)
      if (cached) {
        URL.revokeObjectURL(cached.url)
        this.videoCache.delete(filename)
      }

      // Clean up preload cache
      this.preloadCache.delete(filename)
    } catch (error) {
      console.error("Error deleting video:", error)
      throw error
    }
  }

  getFrames(filename: string): Frame[] | undefined {
    const cached = cacheService.get(filename)
    return cached?.frames
  }

  cleanup(): void {
    // Only clear memory cache
    this.videoCache.forEach((cached: CachedVideo) => {
      if (cached.url.startsWith("blob:")) {
        URL.revokeObjectURL(cached.url)
      }
    })
    this.videoCache.clear()
  }

  async preloadVideo(filename: string): Promise<UploadedVideo | null> {
    // Don't preload if already in cache
    if (this.videoCache.has(filename)) return null

    // Check if there's an ongoing preload
    const existing = this.preloadCache.get(filename)
    if (existing) {
      if (Date.now() - existing.timestamp < this.PRELOAD_CACHE_TIMEOUT) {
        return existing.promise // Use existing preload if it's recent
      }
      // Otherwise, let it continue and start a new preload
    }

    const preloadPromise = this.getVideo(filename)
    this.preloadCache.set(filename, {
      promise: preloadPromise,
      timestamp: Date.now(),
    })

    try {
      await preloadPromise
    } finally {
      // Clean up old preload entries
      for (const [key, value] of this.preloadCache.entries()) {
        if (Date.now() - value.timestamp > this.PRELOAD_CACHE_TIMEOUT) {
          this.preloadCache.delete(key)
        }
      }
    }

    return preloadPromise
  }
}

export const videoService = new VideoService()

// Clean up only memory resources when the window unloads
window.addEventListener("unload", () => {
  videoService.cleanup()
})
