import { motion } from "framer-motion"

import { useQueryStates } from "nuqs"
import { TimeRuler } from "~/components/video-controls/time-ruler"
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

export const formatTime = (
  seconds: number,
  compact: boolean = false,
): string => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (compact) {
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}h`
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  const ms = Math.floor((seconds % 1) * 100)
  return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
}

const TrimLabels = ({ start, end }: { start: number; end: number }) => {
  return (
    <>
      <div
        className="absolute -top-7 left-0 z-30 flex flex-col items-center"
        style={{ transform: "translateX(0)" }}
      >
        <div className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {formatTime(start)}
        </div>
      </div>
      <div
        className="absolute -top-7 right-0 z-30 flex flex-col items-center"
        style={{ transform: "translateX(0)" }}
      >
        <div className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {formatTime(end)}
        </div>
      </div>
    </>
  )
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
      className="container relative mt-8 flex h-16 justify-between rounded-xl border border-[#171717] bg-card sm:mt-10 lg:mt-12"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5, type: "spring", bounce: 0.3 }}
    >
      <div className="absolute inset-x-0 -top-8 sm:-top-10 lg:-top-12">
        <TimeRuler duration={duration} />
      </div>

      <div
        className="absolute bottom-0 top-0 z-20 rounded-l-xl bg-black/30 backdrop-blur-sm"
        style={{
          left: 0,
          width: `${startPercent}%`,
        }}
      />
      <div
        className="absolute bottom-0 top-0 z-20 rounded-r-xl bg-black/30 backdrop-blur-sm"
        style={{
          left: `${endPercent}%`,
          right: 0,
        }}
      />

      <TrimmerControl
        duration={duration}
        onTrimStart={onTrimStart}
        onTrimEnd={onTrimEnd}
        onTrimComplete={onTrimComplete}
      >
        <TrimLabels start={start} end={end} />
      </TrimmerControl>

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
