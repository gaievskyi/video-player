import { AnimatePresence } from "framer-motion"
import { useQueryState } from "nuqs"
import { useEffect, useState, type ChangeEventHandler } from "react"
import { Spinner } from "~/components/spinner"
import { dbService, type EditorState } from "~/lib/indexed-db"
import {
  VideoToFrames,
  VideoToFramesMethod,
  type Frame,
} from "~/lib/video-to-frames"
import { AutoSaveIndicator } from "./auto-save-indicator"
import { CodecSupportIndicator } from "./codec-support-indicator"
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
  // Replace src state with query parameter
  const [videoSrc, setVideoSrc] = useQueryState("src")
  const [filename, setFilename] = useQueryState("filename")

  const [frames, setFrames] = useState<Frame[]>([])
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)
  const [preloadedFrames, setPreloadedFrames] = useState<PreloadedFrames>({})
  const [isSaving, setIsSaving] = useState(false)

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

  // Load saved state on mount and when URL params change
  useEffect(() => {
    const loadSavedState = async () => {
      if (videoSrc) {
        setIsLoadingVideo(true)
        try {
          // For example videos, just load them directly
          if (Object.values(EXAMPLE_VIDEOS).includes(videoSrc)) {
            const frames = await VideoToFrames.getFrames(
              videoSrc,
              21,
              VideoToFramesMethod.totalFrames,
            )
            setFrames(frames)
            return
          }

          // For uploaded videos, try to load from IndexedDB
          const savedState = await dbService.getState()
          if (savedState?.videoBlob) {
            const url = URL.createObjectURL(savedState.videoBlob)
            const frames = await VideoToFrames.getFrames(
              url,
              21,
              VideoToFramesMethod.totalFrames,
            )
            setFrames(frames)
          }
        } finally {
          setIsLoadingVideo(false)
        }
      }
    }

    loadSavedState()
  }, [videoSrc])

  // Save state when video changes
  useEffect(() => {
    const saveState = async () => {
      if (videoSrc && videoSrc.startsWith("blob:")) {
        setIsSaving(true)
        try {
          const response = await fetch(videoSrc)
          const blob = await response.blob()
          const state: EditorState = {
            src: videoSrc,
            filename: filename || "",
            videoBlob: blob,
            lastModified: Date.now(),
          }
          await dbService.saveState(state)
        } finally {
          setIsSaving(false)
        }
      }
    }

    if (videoSrc) {
      saveState()
    }
  }, [videoSrc, filename])

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
      setVideoSrc(url)
      setFilename(file.name)
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
      setVideoSrc(videoSrc)
      setFilename(videoSrc.split("/").pop() || "")
    }
  }

  const handleReset = async () => {
    setVideoSrc(null)
    setFrames([])
    setFilename(null)
    await dbService.clearState()
  }

  return (
    <VideoEditorContextProvider
      value={{
        frames,
        src: videoSrc || "",
        filename: filename || "",
        onReset: handleReset,
      }}
    >
      <CodecSupportIndicator />
      <div className="container relative m-auto flex h-[100svh] w-full max-w-[54rem] flex-col items-center justify-center py-8">
        <AnimatePresence mode="wait">
          {videoSrc ? (
            <VideoPreview key="preview" src={videoSrc} />
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
      <AutoSaveIndicator saving={isSaving} />
    </VideoEditorContextProvider>
  )
}
