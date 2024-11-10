import { motion } from "framer-motion"
import debounce from "lodash/debounce"
import { useQueryStates } from "nuqs"
import { useEffect, useState } from "react"
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

const formatTime = (seconds: number, compact: boolean = false): string => {
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

const useResponsiveRuler = (duration: number) => {
  const [rulerConfig, setRulerConfig] = useState({
    interval: 1,
    showLabels: true,
    labelInterval: 1,
    compact: false,
  })

  useEffect(() => {
    const updateRulerConfig = () => {
      const width = window.innerWidth

      // Calculate optimal intervals based on duration and screen width
      const getOptimalInterval = () => {
        if (duration <= 30) return { base: 2, label: 2 }
        if (duration <= 60) return { base: 5, label: 5 }
        if (duration <= 300) return { base: 15, label: 30 } // 5 minutes
        if (duration <= 900) return { base: 30, label: 60 } // 15 minutes
        if (duration <= 3600) return { base: 60, label: 300 } // 1 hour
        return { base: 300, label: 600 } // > 1 hour
      }

      const intervals = getOptimalInterval()

      if (width < 640) {
        // Mobile
        setRulerConfig({
          interval: intervals.base * 2,
          showLabels: true,
          labelInterval: intervals.label * 2,
          compact: true,
        })
      } else if (width < 1024) {
        // Tablet
        setRulerConfig({
          interval: intervals.base,
          showLabels: true,
          labelInterval: intervals.label,
          compact: duration > 900, // Compact for videos > 15 mins
        })
      } else {
        // Desktop
        setRulerConfig({
          interval: intervals.base,
          showLabels: true,
          labelInterval: intervals.label,
          compact: duration > 1800, // Compact for videos > 30 mins
        })
      }
    }

    updateRulerConfig()
    const debouncedUpdate = debounce(updateRulerConfig, 250)
    window.addEventListener("resize", debouncedUpdate)
    return () => {
      window.removeEventListener("resize", debouncedUpdate)
      debouncedUpdate.cancel()
    }
  }, [duration])

  return rulerConfig
}

const TimeRuler = ({ duration }: { duration: number }) => {
  const { interval, showLabels, labelInterval, compact } =
    useResponsiveRuler(duration)

  const markers = []
  for (let i = 0; i <= duration; i += interval) {
    const percent = (i / duration) * 100
    const isLabelMarker = i % labelInterval === 0
    const isHalfwayMarker = i % (labelInterval / 2) === 0

    markers.push(
      <div
        key={i}
        className="absolute flex flex-col items-center"
        style={{ left: `${percent}%` }}
      >
        <div
          className={`h-2 transition-all duration-200 ${
            isLabelMarker
              ? "w-[1.5px] bg-zinc-600"
              : isHalfwayMarker
                ? "w-[1px] bg-zinc-700"
                : "w-[0.5px] bg-zinc-800"
          }`}
        />
        {showLabels && isLabelMarker && (
          <span className="mt-1 text-[10px] text-zinc-400 transition-opacity duration-200">
            {formatTime(i, compact)}
          </span>
        )}
      </div>,
    )
  }

  return (
    <div className="absolute -top-6 w-full select-none">
      <div className="relative h-8">{markers}</div>
    </div>
  )
}

const TrimLabels = ({ start, end }: { start: number; end: number }) => {
  return (
    <>
      <div className="absolute -top-7 left-0 z-30 flex -translate-x-1/2 flex-col items-center">
        <div className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {formatTime(start)} {/* Always show detailed time for trim points */}
        </div>
      </div>
      <div className="absolute -top-7 right-0 z-30 flex translate-x-1/2 flex-col items-center">
        <div className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {formatTime(end)} {/* Always show detailed time for trim points */}
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
