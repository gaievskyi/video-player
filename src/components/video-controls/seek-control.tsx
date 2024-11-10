import { forwardRef } from "react"
import { useQueryStates } from "nuqs"
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

    const startPercent = (start / duration) * 100
    const endPercent = (end / duration) * 100

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
        style={
          {
            "--start": `${startPercent}%`,
            "--end": `${endPercent}%`,
          } as React.CSSProperties
        }
        className="seek absolute z-30 w-full"
      />
    )
  },
)

SeekControl.displayName = "SeekControl"
