import { AnimatePresence } from "framer-motion"
import { useEffect, useState, type ChangeEventHandler } from "react"
import { Spinner } from "~/components/spinner"
import {
  VideoToFrames,
  VideoToFramesMethod,
  type Frame,
} from "~/lib/video-to-frames"
import { VideoEditorContextProvider } from "./video-editor-context"
import { VideoPreview } from "./video-preview"
import { VideoUploadInput } from "./video-upload-input"

const EXAMPLE_VIDEOS = {
  bunny: "/bunny.webm",
  earth: "/earth.mp4",
}

type PreloadedFrames = {
  [K in keyof typeof EXAMPLE_VIDEOS]?: Frame[]
}

export const VideoEditor = () => {
  const [src, setSrc] = useState("")
  const [frames, setFrames] = useState<Frame[]>([])
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [preloadedFrames, setPreloadedFrames] = useState<PreloadedFrames>({})

  // Preload frames for example videos
  useEffect(() => {
    const preloadVideos = async () => {
      const loadedFrames: PreloadedFrames = {}

      for (const [key, url] of Object.entries(EXAMPLE_VIDEOS)) {
        // Preload video
        const link = document.createElement("link")
        link.rel = "preload"
        link.as = "video"
        link.href = url
        document.head.appendChild(link)

        // Preload frames
        const frames = await VideoToFrames.getFrames(
          url,
          21,
          VideoToFramesMethod.totalFrames,
        )
        loadedFrames[key as keyof typeof EXAMPLE_VIDEOS] = frames
      }
      setPreloadedFrames(loadedFrames)
    }

    preloadVideos()
  }, [])

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    setIsLoadingVideo(true)
    document.body.style.cursor = "wait"
    const file = event.target.files?.item(0)
    if (file instanceof File) {
      const url = URL.createObjectURL(file)
      const frames = await VideoToFrames.getFrames(
        url,
        21,
        VideoToFramesMethod.totalFrames,
      )
      setFrames(frames)
      setSrc(url)
      setIsLoadingVideo(false)
      document.body.style.cursor = "auto"
    }
  }

  const handleExampleClick = (videoSrc: string) => {
    // Find which example video was clicked
    const videoKey = Object.entries(EXAMPLE_VIDEOS).find(
      ([, url]) => url === videoSrc,
    )?.[0] as keyof typeof EXAMPLE_VIDEOS | undefined

    if (videoKey && preloadedFrames[videoKey]) {
      // Use preloaded frames
      setFrames(preloadedFrames[videoKey]!)
      setSrc(videoSrc)
    }
  }

  const handleReset = () => {
    setSrc("")
    setFrames([])
  }

  return (
    <VideoEditorContextProvider
      value={{
        frames,
        src,
        onReset: handleReset,
      }}
    >
      <div className="container relative m-auto flex min-h-[100svh] w-full max-w-[54rem] flex-col items-center justify-center py-8">
        <AnimatePresence mode="wait">
          {src.length > 1 ? (
            <VideoPreview key="preview" src={src} />
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
