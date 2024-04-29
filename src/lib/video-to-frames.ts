export enum VideoToFramesMethod {
  fps,
  totalFrames,
}

export type Frame = { id: string; src: string }

export class VideoToFrames {
  /**
   * Extracts frames from the video and returns them as an array of imageData
   * @param videoUrl url to the video file (html5 compatible format) eg: mp4
   * @param amount number of frames per second or total number of frames that you want to extract
   * @param type [fps, totalFrames] The method of extracting frames: Number of frames per second of video or the total number of frames acros the whole video duration. defaults to fps
   */
  public static getFrames(
    videoUrl: string,
    amount: number,
    type: VideoToFramesMethod = VideoToFramesMethod.fps,
  ): Promise<Frame[]> {
    return new Promise((resolve: (frames: Frame[]) => void) => {
      const frames: { id: string; src: string }[] = []
      const canvas: HTMLCanvasElement = document.createElement("canvas")
      const context = canvas.getContext("2d")!
      let duration = 0

      const video = document.createElement("video")
      video.preload = "auto"
      let that = this

      video.addEventListener("loadeddata", async function () {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        duration = video.duration
        let totalFrames = amount
        if (type === VideoToFramesMethod.fps) {
          totalFrames = duration * amount
        }
        for (let time = 0; time < duration; time += duration / totalFrames) {
          const id = window.crypto.randomUUID()
          const src = await that.getVideoFrame(video, context, canvas, time)
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
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    time: number,
  ): Promise<string> {
    return new Promise(
      (resolve: (frame: string) => void, reject: (error: string) => void) => {
        const eventCallback = () => {
          video.removeEventListener("seeked", eventCallback)
          this.storeFrame(video, context, canvas, resolve, reject)
        }
        video.addEventListener("seeked", eventCallback)
        video.currentTime = time
      },
    )
  }

  private static storeFrame(
    video: HTMLVideoElement,
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    resolve: (frame: string) => void,
    reject: (error: string) => void,
  ) {
    try {
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
      resolve(canvas.toDataURL())
    } catch (error) {
      if (error instanceof Error) {
        reject(error.message)
      }
    }
  }
}
