import { motion, useDragControls } from "framer-motion"
import { useQueryStates } from "nuqs"
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

  return (
    <div
      id="trimmer"
      className="absolute inset-y-0 outline outline-4 outline-[#e6e6e6]"
      style={{
        left: `${startPercent}%`,
        width: `${endPercent - startPercent}%`,
      }}
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

      {/* Trim handles */}
      <div
        onMouseDown={onTrimStart}
        onTouchStart={onTrimStart}
        onMouseUp={onTrimComplete}
        onTouchEnd={onTrimComplete}
        id="trim-start"
        className="group absolute -left-1 -top-1 bottom-[-4px] z-20 w-3 cursor-ew-resize touch-none bg-[#e6e6e6]"
      >
        <div className="absolute -left-1 h-full w-1 rounded-l-3xl bg-[#e6e6e6]" />
        <div className="pointer-events-none absolute left-[3px] top-4 lg:top-5 block h-7 w-[2px] rounded-full bg-black/20 transition-all group-active:scale-y-[1.1] group-active:bg-black" />
      </div>

      <div
        onMouseDown={onTrimEnd}
        onTouchStart={onTrimEnd}
        onMouseUp={onTrimComplete}
        onTouchEnd={onTrimComplete}
        id="trim-end"
        className="group absolute -right-1 -top-1 bottom-[-4px] z-20 w-3 cursor-ew-resize touch-none bg-[#e6e6e6]"
      >
        <div className="absolute -right-1 h-full w-1 rounded-r-3xl bg-[#e6e6e6]" />
        <div className="pointer-events-none absolute right-[3px] top-4 lg:top-5 block h-7 w-[2px] rounded-full bg-black/20 transition-all group-active:scale-y-[1.1] group-active:bg-black" />
      </div>

      <div className="absolute z-30 h-full w-full">{children}</div>
    </div>
  )
}
