import { AnimatePresence } from "framer-motion"
import { useEffect, useState, type ChangeEventHandler } from "react"
import { Spinner } from "~/components/spinner"
import { cacheService } from "~/lib/cache-service"
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
  const [videoData, setVideoData] = useState<VideoData | null>(() => {
    // Initialize with cached data if available
    if (videoId) {
      const decodedVideoId = decodeURIComponent(videoId)
      const cached = cacheService.get(decodedVideoId)
      if (cached?.video.src && cached.frames.length > 0) {
        return {
          src: cached.video.src,
          filename: cached.video.filename || decodedVideoId,
          frames: cached.frames,
        }
      }
    }
    return null
  })

  // Load video data on mount or when videoId changes
  useEffect(() => {
    let isMounted = true

    const loadVideo = async () => {
      if (!videoId) {
        setVideoData(null)
        return
      }

      const decodedVideoId = decodeURIComponent(videoId)

      // Check if it's an example video first
      const exampleVideo = Object.values(EXAMPLE_VIDEOS).find(
        (v) => v.id === decodedVideoId,
      )
      if (exampleVideo) {
        if (exampleVideo.frames.length > 0) {
          if (isMounted) {
            setVideoData({
              src: exampleVideo.src,
              filename: exampleVideo.filename,
              frames: exampleVideo.frames,
            })
          }
          return
        }
        const frames = await VideoToFrames.getFrames(
          exampleVideo.src,
          21,
          VideoToFramesMethod.totalFrames,
        )
        exampleVideo.frames = frames
        if (isMounted) {
          setVideoData({
            src: exampleVideo.src,
            filename: exampleVideo.filename,
            frames,
          })
        }
        return
      }

      // Check cache first
      const cached = cacheService.get(decodedVideoId)
      if (cached?.video.src && cached.frames.length > 0) {
        if (isMounted) {
          setVideoData({
            src: cached.video.src,
            filename: cached.video.filename || decodedVideoId,
            frames: cached.frames,
          })
        }
        return
      }

      // Only show loading state if we need to fetch
      if (isMounted) {
        setIsLoadingVideo(true)
      }

      try {
        const video = await videoService.getVideo(decodedVideoId)
        if (video && isMounted) {
          setVideoData({
            src: video.src,
            filename: video.filename,
            frames: video.frames,
          })
        } else if (!video && isMounted) {
          console.error("Video not found")
          navigate("/")
        }
      } catch (error) {
        console.error("Failed to load video:", error)
        if (isMounted) {
          navigate("/")
        }
      } finally {
        if (isMounted) {
          setIsLoadingVideo(false)
        }
      }
    }

    loadVideo()

    return () => {
      isMounted = false
    }
  }, [videoId, navigate])

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
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
    navigate(`/videos/${encodeURIComponent(filename)}`)
  }

  // Reset video data when unmounting
  useEffect(() => {
    return () => {
      setVideoData(null)
    }
  }, [])

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
            <VideoPreview key={videoData.filename} src={videoData.src} />
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
