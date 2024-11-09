import { AnimatePresence, motion } from "framer-motion"
import { formatTime } from "~/lib/utils"

type TrimmerControlProps = {
  start: number
  end: number
  duration: number
  onTrimStart: (e: React.MouseEvent | React.TouchEvent) => void
  onTrimEnd: (e: React.MouseEvent | React.TouchEvent) => void
  onTrimComplete: () => void
}

export const TrimmerControl = ({
  start,
  end,
  duration,
  onTrimStart,
  onTrimEnd,
  onTrimComplete,
}: TrimmerControlProps) => {
  const areHandlesClose = end - start < 15

  return (
    <div
      id="trimmer"
      className="absolute inset-y-0 cursor-grab border-y-4 border-[#e6e6e6]"
      style={{ left: `${start}%`, width: `${end - start}%` }}
    >
      <div
        onMouseDown={(e) => onTrimStart(e)}
        onTouchStart={(e) => onTrimStart(e)}
        onMouseUp={onTrimComplete}
        onTouchEnd={onTrimComplete}
        id="trim-start"
        className="group absolute -left-1 -top-1 bottom-[-4px] z-20 w-3 cursor-ew-resize touch-none bg-[#e6e6e6]"
      >
        <div className="absolute -left-1 h-full w-1 rounded-l-3xl bg-[#e6e6e6]" />
        <AnimatePresence>
          {!areHandlesClose && (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-black/80 shadow-sm"
            >
              {formatTime((duration * start) / 100)}
            </motion.span>
          )}
        </AnimatePresence>
        <div className="pointer-events-none absolute left-[2px] top-5 block h-6 w-[2px] rounded-full bg-black/20 transition-all group-active:scale-y-[1.1] group-active:bg-black" />
      </div>

      <div
        onMouseDown={(e) => onTrimEnd(e)}
        onTouchStart={(e) => onTrimEnd(e)}
        onMouseUp={onTrimComplete}
        onTouchEnd={onTrimComplete}
        id="trim-end"
        className="group absolute -right-1 -top-1 bottom-[-4px] z-20 w-3 cursor-ew-resize touch-none bg-[#e6e6e6]"
      >
        <div className="absolute -right-1 h-full w-1 rounded-r-3xl bg-[#e6e6e6]" />
        <AnimatePresence>
          {areHandlesClose ? (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-black/80 shadow-sm"
            >
              {formatTime((duration * start) / 100)} -{" "}
              {formatTime((duration * end) / 100)}
            </motion.span>
          ) : (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-black/80 shadow-sm"
            >
              {formatTime((duration * end) / 100)}
            </motion.span>
          )}
        </AnimatePresence>
        <div className="pointer-events-none absolute right-[2px] top-5 block h-6 w-[2px] rounded-full bg-black/20 transition-all group-active:scale-y-[1.1] group-active:bg-black" />
      </div>
    </div>
  )
}