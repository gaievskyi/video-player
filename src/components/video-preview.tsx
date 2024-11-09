import { AnimatePresence, motion } from "framer-motion"
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type FormEventHandler,
  type MouseEventHandler,
  type ReactEventHandler,
} from "react"
import { useDebounced } from "~/hooks/use-debounced"
import { useEventListener } from "~/hooks/use-event-listener"
import { useToggle } from "~/hooks/use-toggle"
import { formatTime } from "~/lib/utils"
import { Frames } from "./frames"
import { PlayIcon } from "./icons"
import { VideoPreviewHeader } from "./video-preview-header"

export const VideoPreview = ({ src, ...props }: ComponentProps<"video">) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const seekRef = useRef<HTMLInputElement>(null)
  const trimmerRef = useRef<HTMLDivElement>(null)
  const trimStartRef = useRef<HTMLDivElement>(null)
  const trimEndRef = useRef<HTMLDivElement>(null)

  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(100)

  const [isPlaying, setIsPlaying, toggleIsPlaying] = useToggle(true)

  const [duration, setDuration] = useState(0)

  const animationFrameRef = useRef<number>()

  const onLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)
  }

  const togglePlay = (): void => {
    if (isPlaying) {
      videoRef.current?.pause()
    } else {
      videoRef.current?.play()
    }
    toggleIsPlaying()
  }

  const play = (): void => {
    videoRef.current?.play()
    setIsPlaying(true)
  }

  const syncSeekWithVideoValue: ReactEventHandler = () => {
    if (!seekRef.current || !videoRef.current) return
    const seek = seekRef.current
    const video = videoRef.current

    const updateSeek = () => {
      const value = (100 / video.duration) * video.currentTime

      if (value >= start && value <= end) {
        seek.value = value.toFixed(2)
        seek.setAttribute("current-time", formatTime(video.currentTime))
        const thumbPosition = (seek.clientWidth * value) / 100
        seek.style.setProperty("--transform-x", `${thumbPosition}px`)
      }
    }

    const animate = () => {
      updateSeek()
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }

    if (isPlaying) {
      cancelAnimationFrame(animationFrameRef.current!)
      animationFrameRef.current = requestAnimationFrame(animate)
    } else {
      updateSeek()
    }
  }

  const syncVideoWithSeekValue: FormEventHandler = () => {
    if (!seekRef.current || !videoRef.current) return
    const seek = seekRef.current
    const video = videoRef.current

    const seekValue = Number(seek.value)
    if (seekValue < start) {
      seek.value = start.toString()
      video.currentTime = (video.duration * start) / 100
    } else if (seekValue > end) {
      seek.value = end.toString()
      video.currentTime = (video.duration * end) / 100
    } else {
      video.currentTime = video.duration * (seekValue / 100)
    }
  }

  const onMouseDown: MouseEventHandler = () => {
    videoRef.current?.pause()
    setIsPlaying(false)
  }

  const onMouseUp: MouseEventHandler = useDebounced(() => {
    play()
  }, 350)

  const trimVideo = (): void => {
    if (!videoRef.current) return
    const videoStart = (videoRef.current.duration * start) / 100
    videoRef.current.currentTime = videoStart
    play()
  }

  const onTrim = (
    e: React.MouseEvent | React.TouchEvent,
    isEnd: boolean,
  ): void => {
    if (!videoRef.current) return
    e.preventDefault()
    const trimmer = videoRef.current
    const startX = "touches" in e ? e.touches[0].clientX : e.clientX
    const initialLeft = isEnd ? end : start

    const onDrag = (moveEvent: MouseEvent | TouchEvent) => {
      if (!videoRef.current) return
      const currentX =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientX
          : moveEvent.clientX
      const delta = currentX - startX
      const newPos = initialLeft + (delta / trimmer.clientWidth) * 100

      if (isEnd) {
        if (newPos <= 100 && newPos >= start + 5) {
          setEnd(newPos)
        }
      } else {
        if (newPos >= 0 && newPos <= end - 5) {
          setStart(newPos)
        }
      }
    }

    const onDragEnd = () => {
      document.removeEventListener("mousemove", onDrag)
      document.removeEventListener("mouseup", onDragEnd)
      document.removeEventListener("touchmove", onDrag)
      document.removeEventListener("touchend", onDragEnd)
    }

    document.addEventListener("mousemove", onDrag)
    document.addEventListener("mouseup", onDragEnd)
    document.addEventListener("touchmove", onDrag)
    document.addEventListener("touchend", onDragEnd)
  }

  useEventListener("keydown", (e) => {
    if (e.key === " " || e.code === "Space") {
      e.preventDefault()
      togglePlay()
    }
  })

  useEventListener(
    "timeupdate",
    () => {
      if (!videoRef.current) return
      const video = videoRef.current
      const videoStart = (video.duration * start) / 100
      const videoEnd = (video.duration * end) / 100

      if (video.currentTime >= videoEnd) {
        video.currentTime = videoStart
      } else if (video.currentTime < videoStart) {
        video.currentTime = videoStart
      }
    },
    videoRef,
    {
      passive: true,
    },
  )

  useEffect(() => {
    if (!videoRef.current) return
    const video = videoRef.current
    const videoStart = (video.duration * start) / 100

    if (
      video.currentTime < videoStart ||
      video.currentTime > (video.duration * end) / 100
    ) {
      video.currentTime = videoStart
    }
  }, [start, end])

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(7px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{
        filter: "blur(7px)",
        opacity: 0,
        y: 200,
        scale: 0.5,
        transition: {
          ease: "easeInOut",
          duration: 0.2,
        },
      }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
      className="flex flex-col gap-12"
    >
      <VideoPreviewHeader />
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
            className="relative"
          >
            <video
              ref={videoRef}
              onClick={togglePlay}
              onTimeUpdate={syncSeekWithVideoValue}
              onLoadedMetadata={onLoadedMetadata}
              className="peer w-full cursor-pointer rounded-[1.2rem] border border-[#171717] lg:rounded-[1.8rem]"
              playsInline
              autoPlay
              muted
              loop
              {...props}
            >
              <source src={src} />
              Your browser doesn't support <code>HTML5 video</code>
            </video>
            <AnimatePresence>
              {!isPlaying && (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2, type: "spring", bounce: 0.3 }}
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePlay()
                  }}
                  className="absolute inset-0 m-auto grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-black/50 pl-1 shadow-[0_0px_25px_3px_rgba(0,0,0,0.2)] outline-none backdrop-blur-sm hover:scale-105"
                >
                  <PlayIcon />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        className="container relative flex h-16 justify-between rounded-xl bg-card"
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

        <div
          ref={trimmerRef}
          id="trimmer"
          className="absolute inset-y-0 cursor-grab border-y-4 border-[#e6e6e6]"
          style={{ left: `${start}%`, width: `${end - start}%` }}
        >
          <div
            onMouseDown={(e) => onTrim(e, false)}
            onTouchStart={(e) => onTrim(e, false)}
            onMouseUp={trimVideo}
            onTouchEnd={trimVideo}
            ref={trimStartRef}
            id="trim-start"
            className="group absolute -left-1 -top-1 bottom-[-4px] z-20 w-3 cursor-ew-resize touch-none bg-[#e6e6e6]"
          >
            <div className="absolute -left-1 h-full w-1 rounded-l-3xl bg-[#e6e6e6]" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-black/80 shadow-sm">
              {formatTime((duration * start) / 100)}
            </span>
            <div className="pointer-events-none absolute left-[2px] top-5 block h-6 w-[2px] rounded-full bg-black/20 transition-all group-active:scale-y-[1.1] group-active:bg-black" />
          </div>
          <div
            onMouseDown={(e) => onTrim(e, true)}
            onTouchStart={(e) => onTrim(e, true)}
            onMouseUp={trimVideo}
            onTouchEnd={trimVideo}
            ref={trimEndRef}
            id="trim-end"
            className="group absolute -right-1 -top-1 bottom-[-4px] z-20 w-3 cursor-ew-resize touch-none bg-[#e6e6e6]"
          >
            <div className="absolute -right-1 h-full w-1 rounded-r-3xl bg-[#e6e6e6]" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-black/80 shadow-sm">
              {formatTime((duration * end) / 100)}
            </span>
            <div className="pointer-events-none absolute right-[2px] top-5 block h-6 w-[2px] rounded-full bg-black/20 transition-all group-active:scale-y-[1.1] group-active:bg-black" />
          </div>
        </div>
        <input
          id="seek"
          min="0"
          max="100"
          step="0.01"
          defaultValue={start.toString()}
          type="range"
          ref={seekRef}
          onInput={syncVideoWithSeekValue}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          className="seek absolute z-10"
        />
        <div className="flex justify-between overflow-clip rounded-xl">
          <div className="flex justify-between">
            <Frames />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
