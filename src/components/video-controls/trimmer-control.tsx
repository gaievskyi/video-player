import { motion, useDragControls } from "framer-motion"
import { useQueryStates } from "nuqs"
import { useCallback, useEffect } from "react"
import { parseAsTime } from "~/lib/time-query-parser"

interface TrimmerControlProps {
  duration: number
  onTrimStart: (e: React.MouseEvent | React.TouchEvent) => void
  onTrimEnd: (e: React.MouseEvent | React.TouchEvent) => void
  onTrimComplete: () => void
  children?: React.ReactNode
}

export const TrimmerControl = ({
  duration,
  onTrimStart,
  onTrimEnd,
  onTrimComplete,
  children,
}: TrimmerControlProps) => {
  const [{ start, end }, setQuery] = useQueryStates(
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

  const dragControls = useDragControls()

  const handleDrag = (_: unknown, info: { delta: { x: number } }) => {
    const containerWidth =
      document.getElementById("trimmer")?.parentElement?.clientWidth || 0
    const deltaPercent = (info.delta.x / containerWidth) * 100
    const deltaTime = (deltaPercent / 100) * duration

    const newStart = Math.max(0, start + deltaTime)
    const newEnd = Math.min(duration, end + deltaTime)

    if (newStart >= 0 && newEnd <= duration) {
      setQuery({ start: newStart, end: newEnd })
    }
  }

  // Add touch event handlers
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault() // Prevent scrolling while trimming
      const touch = e.touches[0]
      const container = document.getElementById("trimmer")?.parentElement
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const containerWidth = rect.width
      const percent = (x / containerWidth) * 100
      const time = (percent / 100) * duration

      // Update based on which handle is being dragged
      const activeTrimmer = document.elementFromPoint(
        touch.clientX,
        touch.clientY,
      )
      if (activeTrimmer?.id === "trim-start") {
        const newStart = Math.max(0, Math.min(end - 1, time))
        setQuery({ start: newStart })
      } else if (activeTrimmer?.id === "trim-end") {
        const newEnd = Math.min(duration, Math.max(start + 1, time))
        setQuery({ end: newEnd })
      }
    },
    [duration, end, setQuery, start],
  )

  useEffect(() => {
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    return () => {
      document.removeEventListener("touchmove", handleTouchMove)
    }
  }, [start, end])

  return (
    <div
      id="trimmer"
      className="absolute inset-y-0 outline outline-4 outline-[#e6e6e6]"
      style={{
        left: `${startPercent}%`,
        width: `${endPercent - startPercent}%`,
      }}
      role="group"
      aria-label="Video trim controls"
    >
      {/* Draggable overlay for top and bottom edges */}
      <motion.div
        drag="x"
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0}
        onDrag={handleDrag}
        dragConstraints={{ left: 0, right: 0 }}
        className="pointer-events-none absolute inset-0 z-10"
      >
        <div
          className="pointer-events-auto absolute inset-x-0 -top-1 h-2 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        />
        <div
          className="pointer-events-auto absolute inset-x-0 -bottom-1 h-2 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        />
      </motion.div>

      {/* Start handle with invisible touch area */}
      <div
        onMouseDown={onTrimStart}
        onTouchStart={onTrimStart}
        onMouseUp={onTrimComplete}
        onTouchEnd={onTrimComplete}
        id="trim-start"
        className="group absolute -left-3 -top-[4px] bottom-[-4px] z-[60] w-3 cursor-ew-resize touch-none bg-[#e6e6e6]"
        role="slider"
        aria-label="Trim start time"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={start}
        tabIndex={0}
      >
        {/* Invisible touch target */}
        <div className="absolute -bottom-6 -left-3 -top-6 w-12 touch-none" />
        {/* Visual handle remains the same size */}
        <div className="absolute -left-1 h-full w-1 rounded-l-3xl bg-[#e6e6e6]" />
        <div className="pointer-events-none absolute left-[3px] top-4 block h-7 w-[2px] rounded-full bg-black/20 transition-all group-active:scale-y-[1.1] group-active:bg-black lg:top-5" />
      </div>

      {/* End handle with invisible touch area */}
      <div
        onMouseDown={onTrimEnd}
        onTouchStart={onTrimEnd}
        onMouseUp={onTrimComplete}
        onTouchEnd={onTrimComplete}
        id="trim-end"
        className="group absolute -right-[12.5px] -top-[4px] bottom-[-4px] z-[60] w-3 cursor-ew-resize touch-none bg-[#e6e6e6]"
        role="slider"
        aria-label="Trim end time"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={end}
        tabIndex={0}
      >
        {/* Invisible touch target */}
        <div className="absolute -bottom-6 -right-3 -top-6 w-12 touch-none" />
        {/* Visual handle remains the same size */}
        <div className="absolute -right-1 h-full w-1 rounded-r-3xl bg-[#e6e6e6]" />
        <div className="pointer-events-none absolute right-[3px] top-4 block h-7 w-[2px] rounded-full bg-black/20 transition-all group-active:scale-y-[1.1] group-active:bg-black lg:top-5" />
      </div>

      <div className="absolute z-30 h-full w-full">{children}</div>
    </div>
  )
}
