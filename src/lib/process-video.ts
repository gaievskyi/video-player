import { checkCodecSupport } from "./codec-support"

export class VideoProcessor {
  private startTime: number
  private endTime: number

  constructor(startTime: number, endTime: number) {
    this.startTime = startTime
    this.endTime = endTime
  }

  async trimVideo(videoFile: Blob): Promise<Blob> {
    const video = document.createElement("video")
    video.src = URL.createObjectURL(videoFile)
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve
    })

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Failed to get canvas context")

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Set video to start time
    video.currentTime = this.startTime

    const chunks: Blob[] = []

    // Determine output format and codec
    const isMP4 = videoFile.type.includes("mp4")
    const supportedTypes = [
      'video/mp4;codecs=avc1.42E01E',
      'video/mp4;codecs=h264',
      'video/webm;codecs=vp8',
      'video/webm;codecs=vp9',
    ]

    let mimeType = 'video/webm;codecs=vp8' // default fallback

    // Find the first supported mime type
    if (isMP4) {
      const mp4Type = supportedTypes.find(type =>
        type.includes('mp4') && MediaRecorder.isTypeSupported(type)
      )
      if (mp4Type) {
        mimeType = mp4Type
      }
    }

    const mediaRecorder = new MediaRecorder(canvas.captureStream(), {
      mimeType,
      videoBitsPerSecond: 8000000, // 8Mbps for better quality
    })

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data)
      }
    }

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        URL.revokeObjectURL(video.src)
        const outputType = mimeType.startsWith('video/mp4') ? 'video/mp4' : 'video/webm'
        const blob = new Blob(chunks, { type: outputType })
        resolve(blob)
      }

      mediaRecorder.onerror = (error) => {
        URL.revokeObjectURL(video.src)
        reject(error)
      }

      video.ontimeupdate = () => {
        if (video.currentTime >= this.endTime) {
          mediaRecorder.stop()
          video.ontimeupdate = null
          return
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      }

      // Start recording and playback
      mediaRecorder.start()
      video.play()
    })
  }

  // Helper method to check if the browser supports video recording
  static checkSupport(): boolean {
    const supportedTypes = [
      'video/mp4;codecs=avc1.42E01E',
      'video/mp4;codecs=h264',
      'video/webm;codecs=vp8',
      'video/webm;codecs=vp9',
    ]
    return supportedTypes.some(type => MediaRecorder.isTypeSupported(type))
  }
}
