export enum VideoToFramesMethod {
  fps,
  totalFrames,
}

export type Frame = { id: string; src: string }

export class VideoToFrames {
  public static async getFrames(
    videoUrl: string,
    amount: number,
    type: VideoToFramesMethod = VideoToFramesMethod.fps,
  ): Promise<Frame[]> {
    return new Promise((resolve) => {
      const frames: Frame[] = []
      const canvas = new OffscreenCanvas(0, 0)
      const context = canvas.getContext("2d")!
      let duration = 0

      const video = document.createElement("video")
      video.preload = "auto"

      video.addEventListener("loadeddata", async () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        duration = video.duration

        // Optimize frame count for better visual quality
        const desiredFrameCount = 24 // iOS-like frame density
        const totalFrames = type === VideoToFramesMethod.fps
          ? Math.min(duration * amount, desiredFrameCount)
          : Math.min(amount, desiredFrameCount)

        const timeStep = duration / totalFrames

        // Generate frames with consistent spacing
        for (let i = 0; i < totalFrames; i++) {
          const time = i * timeStep
          const id = time.toFixed(2)
          const src = await this.getVideoFrame(video, context, canvas, time)
          frames.push({ id, src })
        }

        resolve(frames)
      })

      video.src = videoUrl
      video.load()
    })
  }

  private static getVideoFrame(
    video: HTMLVideoElement,
    context: OffscreenCanvasRenderingContext2D,
    canvas: OffscreenCanvas,
    time: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked)
        this.storeFrame(video, context, canvas, resolve, reject)
      }
      video.addEventListener("seeked", onSeeked)
      video.currentTime = time
    })
  }

  private static storeFrame(
    video: HTMLVideoElement,
    context: OffscreenCanvasRenderingContext2D,
    canvas: OffscreenCanvas,
    resolve: (frame: string) => void,
    reject: (error: string) => void,
  ) {
    // Ensure high-quality frame extraction
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
    canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.85  // Balance between quality and performance
    }).then(
      (blob) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result?.toString() ?? "")
        reader.readAsDataURL(blob)
      },
      (error) => reject(error.message),
    )
  }
}
