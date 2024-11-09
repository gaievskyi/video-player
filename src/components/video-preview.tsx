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
import { PlayIcon, VolumeIcon, VolumeMutedIcon } from "./icons"
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

  const SEEK_INCREMENT = 5

  const [seekDirection, setSeekDirection] = useState<"left" | "right" | null>(
    null,
  )

  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(true)
  const [isVolumeHovered, setIsVolumeHovered] = useState(false)

  const onLoadedMetadata = () => {
    if (!videoRef.current || !Number.isFinite(videoRef.current.duration)) return
    setDuration(videoRef.current.duration)

    // Ensure initial position is valid
    const videoStart = (videoRef.current.duration * start) / 100
    if (Number.isFinite(videoStart)) {
      videoRef.current.currentTime = videoStart
    }
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

    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault()
      if (!videoRef.current || !seekRef.current || !videoRef.current.duration)
        return

      setSeekDirection(e.key === "ArrowLeft" ? "left" : "right")

      const video = videoRef.current
      const seek = seekRef.current
      const increment = e.key === "ArrowLeft" ? -SEEK_INCREMENT : SEEK_INCREMENT

      const newTime = Math.max(
        (video.duration * start) / 100,
        Math.min((video.duration * end) / 100, video.currentTime + increment),
      )

      if (!Number.isFinite(newTime)) return

      video.currentTime = newTime

      const newValue = (100 / video.duration) * newTime
      seek.value = newValue.toFixed(2)
      seek.setAttribute("current-time", formatTime(newTime))
      const thumbPosition = (seek.clientWidth * newValue) / 100
      seek.style.setProperty("--transform-x", `${thumbPosition}px`)
    }
  })

  useEventListener(
    "timeupdate",
    () => {
      if (!videoRef.current || !videoRef.current.duration) return
      const video = videoRef.current
      const videoStart = (video.duration * start) / 100
      const videoEnd = (video.duration * end) / 100

      if (
        !Number.isFinite(videoStart) ||
        !Number.isFinite(videoEnd) ||
        !Number.isFinite(video.duration)
      ) {
        return
      }

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
    if (!videoRef.current || !videoRef.current.duration) return
    const video = videoRef.current
    const videoStart = (video.duration * start) / 100

    if (
      !Number.isFinite(videoStart) ||
      !Number.isFinite(video.duration) ||
      !Number.isFinite(end)
    ) {
      return
    }

    if (
      video.currentTime < videoStart ||
      video.currentTime > (video.duration * end) / 100
    ) {
      video.currentTime = videoStart
    }
  }, [start, end])

  useEffect(() => {
    if (seekDirection) {
      const timeout = setTimeout(() => setSeekDirection(null), 200)
      return () => clearTimeout(timeout)
    }
  }, [seekDirection])

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const areHandlesClose = end - start < 15

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
    if (newVolume === 0) {
      setIsMuted(true)
    } else {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    if (isMuted) {
      videoRef.current.volume = volume
      setIsMuted(false)
    } else {
      videoRef.current.volume = 0
      setIsMuted(true)
    }
  }

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
              loop
              muted={isMuted}
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
                  className="absolute inset-0 m-auto grid h-16 w-16 cursor-pointer place-items-center rounded-full bg-black/50 pl-0.5 shadow-[0_0px_25px_3px_rgba(0,0,0,0.2)] outline-none backdrop-blur-sm hover:scale-105"
                >
                  <PlayIcon />
                </motion.button>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {seekDirection && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`absolute top-1/2 -translate-y-1/2 ${
                    seekDirection === "left" ? "left-4" : "right-4"
                  } rounded-full bg-white/20 p-3 backdrop-blur-sm`}
                >
                  {seekDirection === "left" ? (
                    <svg
                      className="h-8 w-8"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.4 16.9C12.2 16.9 12 16.8 11.9 16.7L7.7 12.5C7.5 12.3 7.5 12 7.7 11.8L11.9 7.6C12.1 7.4 12.4 7.4 12.6 7.6C12.8 7.8 12.8 8.1 12.6 8.3L8.9 12L12.6 15.7C12.8 15.9 12.8 16.2 12.6 16.4C12.6 16.8 12.5 16.9 12.4 16.9Z"
                        fill="currentColor"
                      />
                      <path
                        d="M16.3 16.9C16.1 16.9 15.9 16.8 15.8 16.7L11.6 12.5C11.4 12.3 11.4 12 11.6 11.8L15.8 7.6C16 7.4 16.3 7.4 16.5 7.6C16.7 7.8 16.7 8.1 16.5 8.3L12.8 12L16.5 15.7C16.7 15.9 16.7 16.2 16.5 16.4C16.4 16.8 16.3 16.9 16.3 16.9Z"
                        fill="currentColor"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-8 w-8"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.6 16.9C11.4 16.9 11.2 16.8 11.1 16.7C10.9 16.5 10.9 16.2 11.1 16L14.8 12.3L11.1 8.6C10.9 8.4 10.9 8.1 11.1 7.9C11.3 7.7 11.6 7.7 11.8 7.9L16 12.1C16.2 12.3 16.2 12.6 16 12.8L11.8 17C11.8 16.8 11.7 16.9 11.6 16.9Z"
                        fill="currentColor"
                      />
                      <path
                        d="M7.7 16.9C7.5 16.9 7.3 16.8 7.2 16.7C7 16.5 7 16.2 7.2 16L10.9 12.3L7.2 8.6C7 8.4 7 8.1 7.2 7.9C7.4 7.7 7.7 7.7 7.9 7.9L12.1 12.1C12.3 12.3 12.3 12.6 12.1 12.8L7.9 17C7.9 16.8 7.8 16.9 7.7 16.9Z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-black/80 shadow-sm">
                    {SEEK_INCREMENT}s
                  </span>
                </motion.div>
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
            onMouseDown={(e) => onTrim(e, true)}
            onTouchStart={(e) => onTrim(e, true)}
            onMouseUp={trimVideo}
            onTouchEnd={trimVideo}
            ref={trimEndRef}
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
      <div
        className="absolute bottom-32 right-4 z-30 flex items-center gap-2 rounded-full bg-black/20 p-1 backdrop-blur-sm"
        onMouseEnter={() => setIsVolumeHovered(true)}
        onMouseLeave={() => setIsVolumeHovered(false)}
      >
        <button
          onClick={toggleMute}
          className="grid h-8 w-8 place-items-center rounded-full text-white hover:bg-white/10"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeMutedIcon /> : <VolumeIcon />}
        </button>
        <div
          className={`overflow-hidden transition-all ${
            isVolumeHovered ? "w-24" : "w-0"
          }`}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="volume-slider h-1 w-20 mb-3 cursor-pointer appearance-none rounded-full bg-white/30"
          />
        </div>
      </div>
    </motion.div>
  )
}
