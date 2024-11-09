import { useVideoEditorContext } from "./video-editor-context"
import { SaveButton } from "./video-controls/save-button"

interface VideoPreviewHeaderProps {
  duration: number
  start: number
  end: number
  src: string
}

export const VideoPreviewHeader = ({ duration, start, end, src }: VideoPreviewHeaderProps) => {
  const { onReset } = useVideoEditorContext()
  const fileName = src.split("/").pop() || ""
  const [name, extension] = fileName.split(".")

  const isVideoTrimmed = start > 0 || end < 100

  return (
    <div className="inline-flex w-full items-center justify-between gap-4 rounded-2xl border border-[#171717] bg-black/20 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/10">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 8.00001V16C4 17.1046 4.89543 18 6 18H18C19.1046 18 20 17.1046 20 16V8.00001C20 6.89544 19.1046 6.00001 18 6.00001H6C4.89543 6.00001 4 6.89544 4 8.00001Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 12L10 9V15L15 12Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="max-w-[200px] truncate font-medium">{name}</span>
          <span className="text-sm text-white/60">.{extension}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isVideoTrimmed && (
          <SaveButton
            videoSrc={src}
            startTime={(duration * start) / 100}
            endTime={(duration * end) / 100}
          />
        )}
        <button
          onClick={onReset}
          className="rounded-lg bg-white/10 p-2.5 transition-colors hover:bg-white/20"
          aria-label="Close video"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
