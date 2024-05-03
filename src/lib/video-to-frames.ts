export enum VideoToFramesMethod {
  fps,
  totalFrames,
}

export type Frame = { id: string; src: string }

export class VideoToFrames {
  public static getFrames(
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
        const totalFrames =
          type === VideoToFramesMethod.fps ? duration * amount : amount

        for (let time = 0; time < duration; time += duration / totalFrames) {
          const id = time.toString()
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
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
    canvas.convertToBlob().then(
      (blob) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result?.toString() ?? "")
        reader.readAsDataURL(blob)
      },
      (error) => reject(error.message),
    )
  }
}
