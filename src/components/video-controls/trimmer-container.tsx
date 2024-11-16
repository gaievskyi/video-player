import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

import { useQueryStates } from "nuqs"
import { ErrorAlert } from "~/components/error-alert"
import { Spinner } from "~/components/spinner"
import { TimeRuler } from "~/components/video-controls/time-ruler"
import { VideoProcessor } from "~/lib/process-video"
import { parseAsTime } from "~/lib/time-query-parser"
import { Frames } from "../frames"
import { SeekControl } from "./seek-control"
import { TrimmerControl } from "./trimmer-control"

type TrimmerContainerProps = {
  duration: number
  seekRef: React.RefObject<HTMLInputElement | null>
  onTrimStart: (e: React.MouseEvent | React.TouchEvent) => void
  onTrimEnd: (e: React.MouseEvent | React.TouchEvent) => void
  onTrimComplete: () => void
  onSeekInput: React.FormEventHandler
  onSeekMouseDown: React.MouseEventHandler
  onSeekMouseUp: React.MouseEventHandler
  isPlaying: boolean
  onPlayClick: () => void
  onExport: () => void
  isVideoTrimmed: boolean
  videoSrc: string
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

const PlayButton = ({
  isPlaying,
  onClick,
}: {
  isPlaying: boolean
  onClick: () => void
}) => {
  return (
    <button
      onClick={onClick}
      className="absolute -left-20 bottom-0 top-0 flex h-full w-14 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/15 active:bg-white/20"
      style={{
        backdropFilter: "blur(8px)",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform"
        style={{
          transform: isPlaying ? "scale(0.9)" : "scale(1)",
        }}
      >
        {isPlaying ? (
          <>
            <rect x="3" y="2" width="4" height="12" rx="1.5" fill="white" />
            <rect x="9" y="2" width="4" height="12" rx="1.5" fill="white" />
          </>
        ) : (
          <path
            d="M13.5 7.13397C14.1667 7.51887 14.1667 8.48113 13.5 8.86603L5.25 13.5311C4.58333 13.916 3.75 13.4349 3.75 12.665V3.33494C3.75 2.56505 4.58333 2.08397 5.25 2.46887L13.5 7.13397Z"
            fill="white"
          />
        )}
      </svg>
    </button>
  )
}

const ExportButton = ({
  isVisible,
  videoSrc,
  startTime,
  endTime,
}: {
  onClick: () => void
  isVisible: boolean
  videoSrc: string
  startTime: number
  endTime: number
}) => {
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  if (!isVisible) return null

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setIsSuccess(false)

      if (!VideoProcessor.checkSupport()) {
        throw new Error(
          "Your browser doesn't support video processing. Please try a modern browser like Chrome or Firefox.",
        )
      }

      const response = await fetch(videoSrc)
      const videoFile = await response.blob()

      const fileName = videoSrc.split("/").pop() || "video"
      const originalFormat =
        videoFile.type.split("/")[1]?.split(";")[0] || "mp4"

      let outputFormat = originalFormat
      if (!["mp4", "webm"].includes(outputFormat.toLowerCase())) {
        outputFormat = MediaRecorder.isTypeSupported("video/mp4;codecs=h264")
          ? "mp4"
          : "webm"
      }

      const processor = new VideoProcessor(startTime, endTime)
      const trimmedVideo = await processor.trimVideo(videoFile)

      const nameWithoutExt = fileName.split(".")[0]
      const finalBaseName = /^[0-9a-f-]{32,}$/i.test(nameWithoutExt)
        ? "video"
        : nameWithoutExt

      const url = URL.createObjectURL(trimmedVideo)
      const a = document.createElement("a")
      a.href = url
      a.download = `${finalBaseName}-trimmed.${outputFormat}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
      }, 2000)
    } catch (error) {
      console.error("Error saving video:", error)
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save video. Please try a different browser or video format.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="absolute -right-20 bottom-0 top-0">
      <motion.button
        ref={buttonRef}
        onClick={handleSave}
        disabled={isSaving}
        className="flex h-full w-14 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/15 active:bg-white/20 disabled:opacity-50"
        style={{
          backdropFilter: "blur(8px)",
        }}
      >
        <AnimatePresence mode="wait">
          {isSaving ? (
            <motion.div
              key="saving"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Spinner className="size-8" particleClassName="bg-white" />
            </motion.div>
          ) : isSuccess ? (
            <motion.svg
              key="success"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          ) : (
            <motion.svg
              key="export"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
      <ErrorAlert error={error} buttonRef={buttonRef} />
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
  isPlaying,
  onPlayClick,
  onExport,
  isVideoTrimmed,
  videoSrc,
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
      <PlayButton isPlaying={isPlaying} onClick={onPlayClick} />
      <ExportButton
        onClick={onExport}
        isVisible={isVideoTrimmed}
        videoSrc={videoSrc}
        startTime={start}
        endTime={end}
      />
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
      <Frames />
      <TimeIndicator duration={duration} />
    </motion.div>
  )
}
