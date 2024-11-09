import { AnimatePresence } from "framer-motion"
import { useEffect, useState, type ChangeEventHandler } from "react"
import { Spinner } from "~/components/spinner"
import { useRouter } from "~/lib/router"
import { videoService } from "~/lib/video-service"
import {
  VideoToFrames,
  VideoToFramesMethod,
  type Frame,
} from "~/lib/video-to-frames"
import { CodecSupportIndicator } from "./codec-support-indicator"
import { VideoEditorContextProvider } from "./video-editor-context"
import { VideoPreview } from "./video-preview"
import { VideoUploadInput } from "./video-upload-input"

const EXAMPLE_VIDEOS = {
  bunny: {
    id: "bunny.webm",
    src: "/bunny.webm",
    filename: "bunny.webm",
    poster: "/rabbit.png",
    frames: [] as Frame[],
  },
  earth: {
    id: "earth.mp4",
    src: "/earth.mp4",
    filename: "earth.mp4",
    frames: [] as Frame[],
  },
}

type VideoData = {
  src: string
  filename: string
  frames: Frame[]
}

export const VideoEditor = () => {
  const { navigate, params } = useRouter()
  const videoId = params.id
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [videoData, setVideoData] = useState<VideoData | null>(null)

  // Preload example video frames
  useEffect(() => {
    const preloadExampleFrames = async () => {
      for (const video of Object.values(EXAMPLE_VIDEOS)) {
        if (video.frames.length === 0) {
          const frames = await VideoToFrames.getFrames(
            video.src,
            21,
            VideoToFramesMethod.totalFrames,
          )
          video.frames = frames
        }
      }
    }

    preloadExampleFrames()
  }, [])

  // Load video data on mount or when videoId changes
  useEffect(() => {
    const loadVideo = async () => {
      if (!videoId) {
        setVideoData(null)
        return
      }

      // Check if it's an example video first
      const exampleVideo = Object.values(EXAMPLE_VIDEOS).find(
        (v) => v.id === videoId,
      )
      if (exampleVideo) {
        // If frames are already loaded, use them immediately
        if (exampleVideo.frames.length > 0) {
          setVideoData({
            src: exampleVideo.src,
            filename: exampleVideo.filename,
            frames: exampleVideo.frames,
          })
          return
        }
        // If not, load them quickly
        const frames = await VideoToFrames.getFrames(
          exampleVideo.src,
          21,
          VideoToFramesMethod.totalFrames,
        )
        exampleVideo.frames = frames
        setVideoData({
          src: exampleVideo.src,
          filename: exampleVideo.filename,
          frames,
        })
        return
      }

      // Check cache first
      const cachedFrames = videoService.getFrames(videoId)
      const cachedVideo = await videoService.getVideo(videoId)

      if (cachedFrames && cachedVideo) {
        setVideoData({
          src: cachedVideo.src,
          filename: cachedVideo.filename,
          frames: cachedFrames,
        })
        return
      }

      // If not in cache, show loading state
      setIsLoadingVideo(true)

      try {
        const video = await videoService.getVideo(videoId)
        if (video) {
          const frames = await VideoToFrames.getFrames(
            video.src,
            21,
            VideoToFramesMethod.totalFrames,
          )
          setVideoData({
            src: video.src,
            filename: video.filename,
            frames,
          })
        } else {
          console.error("Video not found")
          navigate("/")
        }
      } catch (error) {
        console.error("Failed to load video:", error)
        navigate("/")
      } finally {
        setIsLoadingVideo(false)
      }
    }

    loadVideo()
  }, [videoId, navigate])

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.item(0)
    if (!(file instanceof File)) return

    setIsLoadingVideo(true)
    document.body.style.cursor = "wait"

    try {
      const { filename, url, frames } = await videoService.uploadVideo(file)
      setVideoData({
        src: url,
        filename,
        frames,
      })
      navigate(`/videos/${encodeURIComponent(filename)}`)
    } catch (error) {
      console.error("Failed to upload video:", error)
    } finally {
      setIsLoadingVideo(false)
      document.body.style.cursor = "auto"
    }
  }

  const handleExampleClick = (filename: string) => {
    navigate(`/videos/${filename}`)
  }

  return (
    <VideoEditorContextProvider
      value={{
        frames: videoData?.frames || [],
        src: videoData?.src || "",
        filename: videoData?.filename || "",
      }}
    >
      <CodecSupportIndicator />
      <div className="container relative m-auto flex h-[100svh] w-[52rem] flex-col items-center justify-center py-8">
        <AnimatePresence mode="wait">
          {videoData ? (
            <VideoPreview key="preview" src={videoData.src} />
          ) : isLoadingVideo ? (
            <Spinner key="spinner" />
          ) : (
            <VideoUploadInput
              key="upload"
              onChange={handleFileChange}
              onExampleClick={handleExampleClick}
            />
          )}
        </AnimatePresence>
      </div>
    </VideoEditorContextProvider>
  )
}
