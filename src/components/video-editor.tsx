import { useState, type ChangeEventHandler } from "react"
import { VideoToFrames, VideoToFramesMethod } from "~/lib/video-to-frames"
import { VideoPreview } from "./video-preview"
import { VideoUploadInput } from "./video-upload-input"

type VideoEditorProps = {}

export const VideoEditor = ({}: VideoEditorProps) => {
  const [source, setSource] = useState("")
  const [fileName, setFileName] = useState("")
  const [frames, setFrames] = useState<Array<string>>([])
  const [status, setStatus] = useState<"IDLE" | "LOADING">("IDLE")

  const isLoadingFrames = status === "LOADING"

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    document.body.style.cursor = "wait"
    setStatus("LOADING")
    const file = event.target.files?.item(0)
    if (file instanceof File) {
      const url = URL.createObjectURL(file)
      const frames = await VideoToFrames.getFrames(
        url,
        25,
        VideoToFramesMethod.totalFrames,
      )
      setFrames(frames)
      setFileName(file.name)
      setSource(url)
      setStatus("IDLE")
      document.body.style.cursor = "auto"
    }
  }

  return (
    <div className="relative flex max-w-2xl flex-col items-center justify-center gap-12 p-4">
      {source.length > 1 ? (
        <VideoPreview fileName={fileName} src={source} frames={frames} />
      ) : isLoadingFrames ? (
        <Skeletons />
      ) : (
        <VideoUploadInput onChange={handleFileChange} />
      )}
    </div>
  )
}

const Skeletons = () => (
  <div className="relative flex max-w-2xl flex-col items-center justify-between gap-12">
    <div className="h-[25px] w-1/3 animate-pulse rounded-full bg-card" />
    <div className="h-[360px] w-[640px] animate-pulse rounded-[2cqw] bg-card" />
    <div className="h-[64px] w-full animate-pulse rounded-xl bg-card" />
  </div>
)
