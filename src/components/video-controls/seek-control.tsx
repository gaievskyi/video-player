import { useQueryStates } from "nuqs"
import { forwardRef, useState } from "react"
import { parseAsTime } from "~/lib/time-query-parser"

type SeekControlProps = {
  duration: number
  onInput: React.FormEventHandler
  onMouseDown: React.MouseEventHandler
  onMouseUp: React.MouseEventHandler
}

export const SeekControl = forwardRef<HTMLInputElement, SeekControlProps>(
  ({ duration, onInput, onMouseDown, onMouseUp }, ref) => {
    const [{ start, end }] = useQueryStates(
      {
        start: parseAsTime.withDefault(0),
        end: parseAsTime.withDefault(duration),
      },
      {
        clearOnDefault: true,
      },
    )

    const [isSeeking, setIsSeeking] = useState(false)

    const startPercent = (start / duration) * 100
    const endPercent = (end / duration) * 100

    const handleTouchStart = (e: React.TouchEvent) => {
      setIsSeeking(true)
      onMouseDown(e as unknown as React.MouseEvent)
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
      setIsSeeking(false)
      onMouseUp(e as unknown as React.MouseEvent)
    }

    const handleTouchMove = (e: React.TouchEvent<HTMLInputElement>) => {
      e.preventDefault()
      const input = e.target as HTMLInputElement
      const touch = e.touches[0]
      const rect = input.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const percentage = (x / rect.width) * 100
      input.value = Math.max(0, Math.min(100, percentage)).toString()
      onInput(e)
    }

    return (
      <input
        ref={ref}
        type="range"
        min="0"
        max="100"
        step="0.01"
        defaultValue="0"
        onInput={onInput}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={
          {
            "--start": `${startPercent}%`,
            "--end": `${endPercent}%`,
            outline: "none",
            touchAction: "none", // Prevent scrolling while seeking
          } as React.CSSProperties
        }
        className={`seek absolute z-50 w-full touch-none focus:outline-none focus:ring-0 ${
          isSeeking ? "seeking" : ""
        }`}
      />
    )
  },
)

SeekControl.displayName = "SeekControl"
