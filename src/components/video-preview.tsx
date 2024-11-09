import { motion } from "framer-motion"
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
import { TrimmerContainer } from "./video-controls/trimmer-container"
import { VideoContainer } from "./video-controls/video-container"
import { VolumeControl } from "./video-controls/volume-control"
import { VideoPreviewHeader } from "./video-preview-header"

export const VideoPreview = ({
  src,
  ...props
}: ComponentProps<"video"> & {
  src: string
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const seekRef = useRef<HTMLInputElement>(null)

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
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{
        filter: "blur(10px)",
        opacity: 0,
        y: 90,
        scale: 0.2,
        transition: {
          ease: "easeInOut",
          duration: 0.2,
        },
      }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.35 }}
      className="flex max-h-[100svh] w-full flex-col gap-6 px-4"
    >
      <VideoPreviewHeader
        duration={duration}
        start={start}
        end={end}
        src={src}
      />

      <VideoContainer
        videoRef={videoRef}
        isPlaying={isPlaying}
        isMuted={isMuted}
        seekDirection={seekDirection}
        seekIncrement={SEEK_INCREMENT}
        onVideoClick={togglePlay}
        onPlayClick={(e) => {
          e.stopPropagation()
          togglePlay()
        }}
        onTimeUpdate={syncSeekWithVideoValue}
        onLoadedMetadata={onLoadedMetadata}
        src={src}
        props={props}
      />

      <TrimmerContainer
        start={start}
        end={end}
        duration={duration}
        seekRef={seekRef}
        onTrimStart={(e) => onTrim(e, false)}
        onTrimEnd={(e) => onTrim(e, true)}
        onTrimComplete={trimVideo}
        onSeekInput={syncVideoWithSeekValue}
        onSeekMouseDown={onMouseDown}
        onSeekMouseUp={onMouseUp}
      />

      <VolumeControl
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={(newVolume) => {
          setVolume(newVolume)
          if (videoRef.current) {
            videoRef.current.volume = newVolume
          }
          setIsMuted(newVolume === 0)
        }}
        onMuteToggle={toggleMute}
      />
    </motion.div>
  )
}
