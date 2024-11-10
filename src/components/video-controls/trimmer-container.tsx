import { motion } from "framer-motion"
import { useQueryStates } from "nuqs"
import { parseAsTime } from "~/lib/time-query-parser"
import { Frames } from "../frames"
import { SeekControl } from "./seek-control"
import { TrimmerControl } from "./trimmer-control"

type TrimmerContainerProps = {
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
  duration,
  seekRef,
  onTrimStart,
  onTrimEnd,
  onTrimComplete,
  onSeekInput,
  onSeekMouseDown,
  onSeekMouseUp,
}: TrimmerContainerProps) => {
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
    <motion.div
      className="container relative mt-4 flex h-16 justify-between rounded-xl border border-[#171717] bg-card"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5, type: "spring", bounce: 0.3 }}
    >
      <div
        className="absolute bottom-0 top-0 z-20 rounded-l-xl bg-black/30 backdrop-blur-sm"
        style={{ left: 0, width: `${startPercent}%` }}
      />
      <div
        className="absolute bottom-0 top-0 z-20 rounded-r-xl bg-black/30 backdrop-blur-sm"
        style={{ left: `${endPercent}%`, right: 0 }}
      />

      <TrimmerControl
        duration={duration}
        onTrimStart={onTrimStart}
        onTrimEnd={onTrimEnd}
        onTrimComplete={onTrimComplete}
      />

      <SeekControl
        ref={seekRef}
        duration={duration}
        onInput={onSeekInput}
        onMouseDown={onSeekMouseDown}
        onMouseUp={onSeekMouseUp}
      />

      <div className="flex justify-between overflow-clip rounded-xl">
        <div className="flex justify-between">
          <Frames />
        </div>
      </div>
    </motion.div>
  )
}
