import { checkCodecSupport, type SupportedFormat } from "./codec-support"

export class VideoProcessor {
  private startTime: number
  private endTime: number
  private mediaRecorder: MediaRecorder | null = null

  constructor(startTime: number, endTime: number) {
    this.startTime = startTime
    this.endTime = endTime
  }

  private getInputFormat(videoFile: Blob): SupportedFormat {
    const type = videoFile.type.toLowerCase()
    return type.includes("webm") ? "webm" : "mp4"
  }

  private getBestSupportedMimeType(
    support: ReturnType<typeof checkCodecSupport>,
  ): string {
    if (support.webm) return "video/webm"
    if (support.mp4) return "video/mp4"
    throw new Error("No supported video format found for recording")
  }

  public async trimVideo(videoFile: Blob): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        const support = checkCodecSupport()
        const inputFormat = this.getInputFormat(videoFile)

        if (!support[inputFormat]) {
          throw new Error(
            `Your browser doesn't support processing ${inputFormat.toUpperCase()} videos.`,
          )
        }

        const videoElement = document.createElement("video")
        videoElement.muted = true
        videoElement.playsInline = true

        // Create object URL for the video
        const videoURL = URL.createObjectURL(videoFile)
        videoElement.src = videoURL

        // Wait for metadata to load
        await new Promise((resolve) => {
          videoElement.onloadedmetadata = () => resolve(null)
        })

        // Set initial time
        videoElement.currentTime = this.startTime

        // Create a canvas to draw video frames
        const canvas = document.createElement("canvas")
        canvas.width = videoElement.videoWidth
        canvas.height = videoElement.videoHeight
        const ctx = canvas.getContext("2d")!

        // Create a media stream from the canvas
        const stream = canvas.captureStream(30) // 30 FPS

        // Setup MediaRecorder with best supported format
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: this.getBestSupportedMimeType(support),
          videoBitsPerSecond: 8000000, // 8 Mbps
        })

        const chunks: Blob[] = []
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data)
          }
        }

        this.mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: videoFile.type })
          URL.revokeObjectURL(videoURL)
          resolve(blob)
        }

        // Start recording
        this.mediaRecorder.start()

        // Function to process frame
        const processFrame = () => {
          if (!this.mediaRecorder) return

          if (videoElement.currentTime >= this.endTime) {
            this.mediaRecorder.stop()
            return
          }

          // Draw current frame to canvas
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

          // Request next frame
          requestAnimationFrame(processFrame)
        }

        // Start playback and processing
        await videoElement.play()
        processFrame()
      } catch (error) {
        reject(error)
      }
    })
  }
}
