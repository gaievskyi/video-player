import { useVideoEditorContext } from "./video-editor-context"

export const VideoPreviewHeader = () => {
  const { src, onReset } = useVideoEditorContext()
  const fileName = src.split("/").pop()

  return (
    <div className="inline-flex w-full items-center justify-between gap-4">
      <span className="max-w-[200px] truncate">{fileName}</span>
      <button
        onClick={onReset}
        className="text-muted-foreground rounded-lg bg-card p-1.5 hover:bg-card/80"
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
  )
}
