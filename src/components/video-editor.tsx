import { useState, type ChangeEventHandler } from "react"
import {
  VideoToFrames,
  VideoToFramesMethod,
  type Frame,
} from "~/lib/video-to-frames"
import { VideoEditorContextProvider } from "./video-editor-context"
import { VideoPreview } from "./video-preview"
import { VideoUploadInput } from "./video-upload-input"

export const VideoEditor = () => {
  const [src, setSrc] = useState("")
  const [fileName, setFileName] = useState(".mp4")
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
        20,
        VideoToFramesMethod.totalFrames,
      )
      setFrames(frames)
      setFileName(file.name)
      setSrc(url)
      setIsLoadingVideo(false)
      document.body.style.cursor = "auto"
    }
  }

  return (
    <VideoEditorContextProvider
      value={{
        fileName,
        frames,
      }}
    >
      <div className="container relative m-auto flex h-full min-h-[100svh] max-w-2xl flex-col items-center justify-center gap-12 px-[115px] py-4 sm:px-4">
        {src.length > 1 ? (
          <VideoPreview src={src} />
        ) : isLoadingVideo ? (
          <Skeletons />
        ) : (
          <VideoUploadInput onChange={handleFileChange} />
        )}
      </div>
    </VideoEditorContextProvider>
  )
}

const Skeletons = () => (
  <div className="container relative m-auto flex h-[100svh] max-w-2xl flex-col items-center justify-center gap-12 px-6 py-4">
    <div className="h-[25px] w-1/3 animate-pulse rounded-full bg-card" />
    <div className="h-[360px] w-[624px] animate-pulse rounded-[2cqw] bg-card" />
    <div className="h-[64px] w-[650px] animate-pulse rounded-xl bg-card" />
  </div>
)
