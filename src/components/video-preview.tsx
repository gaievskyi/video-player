import { motion } from "framer-motion"
import { useQueryStates } from "nuqs"
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
import { parseAsTime } from "~/lib/time-query-parser"
import { formatTime } from "~/lib/utils"
import { TrimmerContainer } from "./video-controls/trimmer-container"
import { VideoContainer } from "./video-controls/video-container"

import { VideoPreviewHeader } from "./video-preview-header"

export const VideoPreview = ({
  src,
  ...props
}: ComponentProps<"video"> & {
  src: string
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const seekRef = useRef<HTMLInputElement>(null)

  const [{ start, end }, setVideoState] = useQueryStates(
    {
      start: parseAsTime.withDefault(0),
      end: parseAsTime.withDefault(0),
    },
    {
      clearOnDefault: true,
    },
  )

  const [isPlaying, setIsPlaying, toggleIsPlaying] = useToggle(true)

  const [duration, setDuration] = useState(0)

  const animationFrameRef = useRef<number>()

  const SEEK_INCREMENT = 5

  const [seekDirection, setSeekDirection] = useState<"left" | "right" | null>(
    null,
  )

  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(true)

  const [isVideoReady, setIsVideoReady] = useState(false)

  const onLoadedMetadata = () => {
    if (!videoRef.current || !Number.isFinite(videoRef.current.duration)) return
    setDuration(videoRef.current.duration)
    setIsVideoReady(true)

    // Only set end time if it's not already set
    if (end === 0) {
      setVideoState({ end: videoRef.current.duration })
    }

    // Ensure initial position is valid
    if (Number.isFinite(start)) {
      videoRef.current.currentTime = start
    }

    // Autoplay the video
    videoRef.current.play().catch(console.error)
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
      const percentValue = (100 / video.duration) * video.currentTime

      if (video.currentTime >= start && video.currentTime <= end) {
        seek.value = percentValue.toFixed(2)
        seek.setAttribute("current-time", formatTime(video.currentTime))
        const thumbPosition = (seek.clientWidth * percentValue) / 100
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

    const percentValue = Number(seek.value)
    const timeValue = (video.duration * percentValue) / 100

    if (timeValue < start) {
      video.currentTime = start
      seek.value = ((start / video.duration) * 100).toString()
    } else if (timeValue > end) {
      video.currentTime = end
      seek.value = ((end / video.duration) * 100).toString()
    } else {
      video.currentTime = timeValue
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
    const video = videoRef.current
    const startX = "touches" in e ? e.touches[0].clientX : e.clientX
    const initialTime = isEnd ? end : start
    const initialPercent = (initialTime / video.duration) * 100

    const onDrag = (moveEvent: MouseEvent | TouchEvent) => {
      if (!videoRef.current) return
      const currentX =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientX
          : moveEvent.clientX
      const delta = currentX - startX
      const deltaPercent = (delta / video.clientWidth) * 100
      const newPercent = initialPercent + deltaPercent
      const newTime = (newPercent * video.duration) / 100

      if (isEnd) {
        if (newPercent <= 100 && newTime >= start + 1) {
          setVideoState({ end: newTime })
        }
      } else {
        if (newPercent >= 0 && newTime <= end - 1) {
          setVideoState({ start: newTime })
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
      if (!videoRef.current) return
      const video = videoRef.current

      if (video.currentTime >= end) {
        video.currentTime = start
      } else if (video.currentTime < start) {
        video.currentTime = start
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

    if (video.currentTime < start || video.currentTime > end) {
      video.currentTime = start
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
      animate={{
        opacity: isVideoReady ? 1 : 0,
        y: isVideoReady ? 0 : 30,
        filter: isVideoReady ? "blur(0px)" : "blur(10px)",
      }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.35 }}
      className="flex h-[100svh] w-full flex-col px-4 sm:gap-6"
    >
      <div className="hidden sm:block">
        <VideoPreviewHeader duration={duration} src={src} />
      </div>

      <div className="relative min-h-0 w-full">
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
          duration={duration}
          volume={volume}
          onVolumeChange={(newVolume) => {
            setVolume(newVolume)
            if (videoRef.current) {
              videoRef.current.volume = newVolume
            }
            setIsMuted(newVolume === 0)
          }}
          onMuteToggle={toggleMute}
          props={{ ...props, autoPlay: true }}
        />
      </div>

      <div className="w-full py-6 sm:py-0">
        <TrimmerContainer
          duration={duration}
          seekRef={seekRef}
          onTrimStart={(e) => onTrim(e, false)}
          onTrimEnd={(e) => onTrim(e, true)}
          onTrimComplete={trimVideo}
          onSeekInput={syncVideoWithSeekValue}
          onSeekMouseDown={onMouseDown}
          onSeekMouseUp={onMouseUp}
        />
      </div>
    </motion.div>
  )
}
