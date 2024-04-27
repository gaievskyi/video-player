import { useState, type ChangeEventHandler } from "react"
import { VideoToFrames, VideoToFramesMethod } from "~/lib/video-to-frames"
import { CloseIcon } from "./icons"
import { VideoPreview } from "./video-preview"
import { VideoTimeline } from "./video-timeline"
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
    setStatus("LOADING")
    const file = event.target.files?.item(0)
    if (file instanceof File) {
      const url = URL.createObjectURL(file)
      const frames = await VideoToFrames.getFrames(
        url,
        15,
        VideoToFramesMethod.totalFrames,
      )
      setFrames(frames)
      setFileName(file.name)
      setSource(url)
      setStatus("IDLE")
    }
  }

  const close = () => {
    setSource("")
  }

  return (
    <div className="container mx-auto flex max-w-2xl flex-col p-4">
      {(source.length > 1 || isLoadingFrames) && (
        <button
          onClick={close}
          className="mb-6 grid w-12 place-items-center self-end rounded-xl border-red-500 bg-card p-4 transition-colors hover:bg-card/80"
        >
          <CloseIcon />
        </button>
      )}
      <div className="relative flex flex-col items-center justify-center gap-4">
        {source.length > 1 ? (
          <>
            <VideoPreview fileName={fileName} src={source} />
            <VideoTimeline frames={frames} />
          </>
        ) : isLoadingFrames ? (
          <Skeletons />
        ) : (
          <VideoUploadInput onChange={handleFileChange} />
        )}
      </div>
    </div>
  )
}

const Skeletons = () => (
  <div className="flex flex-col items-center justify-between gap-4">
    <div className="h-[25px] w-1/3 animate-pulse rounded-full bg-card" />
    <div className="h-[360px] w-[640px] animate-pulse rounded-[2cqw] bg-card" />
    <div className="h-[64px] w-full animate-pulse rounded-xl bg-card" />
  </div>
)
