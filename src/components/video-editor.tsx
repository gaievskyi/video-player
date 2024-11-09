import { useState, type ChangeEventHandler } from "react"
import { Spinner } from "~/components/spinner"
import {
  VideoToFrames,
  VideoToFramesMethod,
  type Frame,
} from "~/lib/video-to-frames"
import { VideoEditorContextProvider } from "./video-editor-context"
import { VideoPreview } from "./video-preview"
import { VideoUploadInput } from "./video-upload-input"
import { AnimatePresence } from "framer-motion"

export const VideoEditor = () => {
  const [src, setSrc] = useState("")
  const [frames, setFrames] = useState<Array<Frame>>([])
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
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

  const handleExampleClick = async (videoSrc: string) => {
    setIsLoadingVideo(true)
    document.body.style.cursor = "wait"
    const frames = await VideoToFrames.getFrames(
      videoSrc,
      21,
      VideoToFramesMethod.totalFrames,
    )
    setFrames(frames)
    setSrc(videoSrc)
    setIsLoadingVideo(false)
    document.body.style.cursor = "auto"
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
      <div className="container relative m-auto flex h-full min-h-[100svh] w-full flex-col items-center justify-center gap-12 px-8 py-4 md:max-w-2xl">
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
