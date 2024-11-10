export enum VideoToFramesMethod {
  fps,
  totalFrames,
}

export type Frame = {
  id: string
  src: string
  width: number
  height: number
}

export class VideoToFrames {
  private static readonly CHUNK_SIZE = 5 // Process frames in smaller chunks
  private static readonly MAX_DIMENSION = 1280 // Max dimension for frame extraction
  private static readonly QUALITY = 0.75 // Slightly reduce quality for better memory usage
  private static readonly MIN_FRAMES = 12 // Minimum number of frames
  private static readonly MAX_FRAMES = 24 // Maximum number of frames

  public static async getFrames(
    videoUrl: string,
    amount: number,
    type: VideoToFramesMethod = VideoToFramesMethod.fps,
    containerWidth?: number,
  ): Promise<Frame[]> {
    return new Promise((resolve, reject) => {
      const frames: Frame[] = []
      let canvas: OffscreenCanvas | null = null
      let context: OffscreenCanvasRenderingContext2D | null = null
      let video: HTMLVideoElement | null = null

      const cleanup = () => {
        if (video) {
          video.removeAttribute("src")
          video.load()
          video = null
        }
        canvas = null
        context = null
      }

      try {
        video = document.createElement("video")
        video.preload = "auto"
        video.playsInline = true
        video.muted = true

        video.addEventListener("loadeddata", async () => {
          try {
            // Calculate optimal frame count based on container width
            const optimalFrameCount = containerWidth
              ? Math.max(
                  this.MIN_FRAMES,
                  Math.min(
                    Math.floor(containerWidth / 100), // Roughly 100px per frame
                    this.MAX_FRAMES,
                  ),
                )
              : Math.min(amount, this.MAX_FRAMES)

            // Calculate scaled dimensions
            const scale = Math.min(
              1,
              this.MAX_DIMENSION /
                Math.max(video!.videoWidth, video!.videoHeight),
            )
            const width = Math.floor(video!.videoWidth * scale)
            const height = Math.floor(video!.videoHeight * scale)

            canvas = new OffscreenCanvas(width, height)
            context = canvas.getContext("2d", {
              alpha: false,
              desynchronized: true,
              willReadFrequently: true,
            })

            if (!context) {
              throw new Error("Failed to get canvas context")
            }

            const duration = video!.duration
            const totalFrames =
              type === VideoToFramesMethod.fps
                ? Math.min(duration * amount, optimalFrameCount)
                : Math.min(amount, optimalFrameCount)

            // Ensure frames are evenly distributed across the video duration
            const timeStep = duration / (totalFrames - 1) // Subtract 1 to include both start and end frames

            // Process frames in chunks
            for (let i = 0; i < totalFrames; i += this.CHUNK_SIZE) {
              const chunkSize = Math.min(this.CHUNK_SIZE, totalFrames - i)
              const chunkPromises = []

              for (let j = 0; j < chunkSize; j++) {
                const frameIndex = i + j
                const time = frameIndex * timeStep
                chunkPromises.push(
                  this.getVideoFrame(
                    video!,
                    context,
                    canvas,
                    time,
                    width,
                    height,
                  ),
                )
              }

              const chunkFrames = await Promise.all(chunkPromises)
              frames.push(...chunkFrames)

              // Force garbage collection between chunks
              await new Promise((resolve) => setTimeout(resolve, 0))
            }

            cleanup()
            resolve(frames)
          } catch (error) {
            cleanup()
            reject(error)
          }
        })

        video.addEventListener("error", (e) => {
          cleanup()
          reject(new Error(`Video loading failed: ${e.message}`))
        })

        video.src = videoUrl
        video.load()
      } catch (error) {
        cleanup()
        reject(error)
      }
    })
  }

  private static getVideoFrame(
    video: HTMLVideoElement,
    context: OffscreenCanvasRenderingContext2D,
    canvas: OffscreenCanvas,
    time: number,
    width: number,
    height: number,
  ): Promise<Frame> {
    return new Promise((resolve, reject) => {
      const onSeeked = async () => {
        try {
          video.removeEventListener("seeked", onSeeked)
          const frame = await this.storeFrame(
            video,
            context,
            canvas,
            width,
            height,
          )
          resolve({
            id: time.toFixed(2),
            src: frame,
            width,
            height,
          })
        } catch (error) {
          reject(error)
        }
      }

      video.addEventListener("seeked", onSeeked)
      video.currentTime = time
    })
  }

  private static async storeFrame(
    video: HTMLVideoElement,
    context: OffscreenCanvasRenderingContext2D,
    canvas: OffscreenCanvas,
    width: number,
    height: number,
  ): Promise<string> {
    // Clear previous frame
    context.clearRect(0, 0, width, height)

    // Draw with smoothing for better quality
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "medium"

    context.drawImage(video, 0, 0, width, height)

    try {
      const blob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality: this.QUALITY,
      })

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result?.toString() || "")
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      throw new Error(`Failed to convert frame to blob: ${error}`)
    }
  }
}
