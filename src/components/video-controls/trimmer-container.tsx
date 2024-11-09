import { motion } from "framer-motion"
import { Frames } from "../frames"
import { SeekControl } from "./seek-control"
import { TrimmerControl } from "./trimmer-control"

type TrimmerContainerProps = {
  start: number
  end: number
  duration: number
  seekRef: React.RefObject<HTMLInputElement>
  onTrimStart: (e: React.MouseEvent | React.TouchEvent) => void
  onTrimEnd: (e: React.MouseEvent | React.TouchEvent) => void
  onTrimComplete: () => void
  onSeekInput: React.FormEventHandler
  onSeekMouseDown: React.MouseEventHandler
  onSeekMouseUp: React.MouseEventHandler
}

export const TrimmerContainer = ({
  start,
  end,
  duration,
  seekRef,
  onTrimStart,
  onTrimEnd,
  onTrimComplete,
  onSeekInput,
  onSeekMouseDown,
  onSeekMouseUp,
}: TrimmerContainerProps) => {
  return (
    <motion.div
      className="container relative flex h-16 justify-between rounded-xl bg-card border border-[#171717]"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5, type: "spring", bounce: 0.3 }}
    >
      <div
        className="absolute bottom-0 top-0 z-20 rounded-l-xl bg-black/30 backdrop-blur-sm"
        style={{ left: 0, width: `${start}%` }}
      />
      <div
        className="absolute bottom-0 top-0 z-20 rounded-r-xl bg-black/30 backdrop-blur-sm"
        style={{ left: `${end}%`, right: 0 }}
      />

      <TrimmerControl
        start={start}
        end={end}
        duration={duration}
        onTrimStart={onTrimStart}
        onTrimEnd={onTrimEnd}
        onTrimComplete={onTrimComplete}
      />

      <SeekControl
        start={start}
        onInput={onSeekInput}
        onMouseDown={onSeekMouseDown}
        onMouseUp={onSeekMouseUp}
        seekRef={seekRef}
      />

      <div className="flex justify-between overflow-clip rounded-xl">
        <div className="flex justify-between">
          <Frames />
        </div>
      </div>
    </motion.div>
  )
}