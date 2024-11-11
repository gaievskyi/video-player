import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

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
        className="absolute -left-4 -top-7 flex flex-col items-center"
        style={{ transform: "translateX(0)" }}
      >
        <div className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {formatTime(start)}
        </div>
      </div>
      <div
        className="absolute -right-4 -top-7 flex flex-col items-center"
        style={{ transform: "translateX(0)" }}
      >
        <div className="rounded bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {formatTime(end)}
        </div>
      </div>
    </>
  )
}

const TimeIndicator = ({ duration }: { duration: number }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    const time = percent * duration

    setPosition(x)
    setCurrentTime(time)
    setIsVisible(true)
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 isolate z-50 h-5"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsVisible(false)}
    >
      {isVisible && (
        <div
          className="absolute top-[-2.5rem] flex -translate-x-1/2 flex-col items-center"
          style={{ left: position }}
        >
          <div className="rounded bg-zinc-800/90 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {formatTime(currentTime)}
          </div>
          <div className="h-2 w-[2px] bg-zinc-800/90" />
        </div>
      )}
    </div>
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

  useEffect(() => {
    const container = document.querySelector(".trimmer-container")
    if (!container) return

    const preventContextMenu = (e: Event) => {
      e.preventDefault()
    }

    container.addEventListener("contextmenu", preventContextMenu)
    container.addEventListener("touchstart", preventContextMenu, {
      passive: false,
    })

    return () => {
      container.removeEventListener("contextmenu", preventContextMenu)
      container.removeEventListener("touchstart", preventContextMenu)
    }
  }, [])

  const handleTrimStart = (e: React.MouseEvent | React.TouchEvent) => {
    onTrimStart(e)
  }

  const handleTrimEnd = (e: React.MouseEvent | React.TouchEvent) => {
    onTrimEnd(e)
  }

  const handleTrimComplete = () => {
    onTrimComplete()
  }

  return (
    <motion.div
      className="trimmer-container container relative mt-8 flex h-14 touch-pan-y justify-between border border-[#171717] bg-card sm:mt-10 lg:mt-28 lg:h-16"
      onContextMenu={(e) => e.preventDefault()}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5, type: "spring", bounce: 0.3 }}
    >
      <div className="absolute inset-x-0 -top-[2.4rem] sm:-top-12">
        <TimeRuler duration={duration} />
      </div>
      <div
        className="absolute bottom-0 top-0 z-20 bg-black/30 backdrop-blur-sm"
        style={{
          left: 0,
          width: `${startPercent}%`,
        }}
      />
      <div
        className="absolute bottom-0 top-0 z-20 bg-black/30 backdrop-blur-sm"
        style={{
          left: `${endPercent}%`,
          right: 0,
        }}
      />
      <div
        className="absolute bottom-0 top-0 z-10 bg-white/10"
        style={{
          left: `${startPercent}%`,
          width: `${endPercent - startPercent}%`,
          transition: "border-color 75ms, background-color 75ms",
        }}
      />
      <TrimmerControl
        duration={duration}
        onTrimStart={handleTrimStart}
        onTrimEnd={handleTrimEnd}
        onTrimComplete={handleTrimComplete}
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
      <Frames isDirty={true} />
      <TimeIndicator duration={duration} />
    </motion.div>
  )
}
