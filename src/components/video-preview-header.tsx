import { useQueryStates } from "nuqs"
import { FileStackIcon } from "~/components/icons/file-stack-icon"
import { useRouter } from "~/lib/router"
import { parseAsTime } from "~/lib/time-query-parser"
import { formatTime } from "~/lib/utils"
import { SaveButton } from "./video-controls/save-button"
import { useVideoEditorContext } from "./video-editor-context"

interface VideoPreviewHeaderProps {
  duration: number
  src: string
}

export const VideoPreviewHeader = ({
  duration,
  src,
}: VideoPreviewHeaderProps) => {
  const { filename } = useVideoEditorContext()
  const { goBack } = useRouter()
  const [name, extension] = filename.split(".")

  const [{ start, end }] = useQueryStates(
    {
      start: parseAsTime.withDefault(0),
      end: parseAsTime.withDefault(duration),
    },
    {
      clearOnDefault: true,
    },
  )

  const isVideoTrimmed = start > 0 || end < duration

  return (
    <div className="inline-flex w-full items-center justify-between gap-4 rounded-2xl border border-[#171717] bg-[#0d0c0b] p-4 backdrop-blur-sm lg:mt-2">
      <div className="flex items-center gap-2">
        <FileStackIcon />
        <div className="flex flex-col">
          <span className="max-w-[200px] truncate font-medium">{name}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-white/60">.{extension}</span>
            <span className="text-sm text-white/40">•</span>
            <span className="text-sm text-white/60">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isVideoTrimmed && (
          <SaveButton videoSrc={src} startTime={start} endTime={end} />
        )}
        <button
          onClick={goBack}
          className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
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
