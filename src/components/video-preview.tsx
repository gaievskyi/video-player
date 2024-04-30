import {
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
import { cn, formatTime } from "~/lib/utils"
import { Frames } from "./frames"
import { PauseIcon, PlayIcon } from "./icons"
import { VideoPreviewHeader } from "./video-preview-header"

export type VideoProps = ComponentProps<"video">

export const VideoPreview = ({ src, ...props }: VideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const seekRef = useRef<HTMLInputElement>(null)
  const trimmerRef = useRef<HTMLDivElement>(null)
  const trimStartRef = useRef<HTMLDivElement>(null)
  const trimEndRef = useRef<HTMLDivElement>(null)

  const [start, setStart] = useState(0)
  const [end, setEnd] = useState(100)

  const [isPlaying, setIsPlaying, toggleIsPlaying] = useToggle(true)

  const togglePlay = (): void => {
    isPlaying ? videoRef.current?.pause() : videoRef.current?.play()
    toggleIsPlaying()
  }

  const play = (): void => {
    videoRef.current?.play()
    setIsPlaying(true)
  }

  const syncSeekWithVideoValue: ReactEventHandler<HTMLVideoElement> = () => {
    const updateSeek = () => {
      if (!seekRef.current || !videoRef.current) return
      const seek = seekRef.current
      const video = videoRef.current
      const value = (100 / video.duration) * video.currentTime
      seek.value = value.toFixed(2)
      seek.setAttribute("current-time", formatTime(video.currentTime))
      const thumbPosition = (seek.clientWidth * value) / 100
      seek.style.setProperty("--label-position", `${thumbPosition}px`)
    }

    const animateSeek = () => {
      updateSeek()
      if (isPlaying) {
        requestAnimationFrame(animateSeek)
      }
    }

    if (isPlaying) {
      requestAnimationFrame(animateSeek)
    }
  }

  const syncVideoWithSeekValue: FormEventHandler<HTMLInputElement> = () => {
    if (!seekRef.current || !videoRef.current) return
    const seek = seekRef.current
    const video = videoRef.current
    const time = video.duration * (Number(seek.value) / 100)
    video.currentTime = time
  }

  const onMouseDown: MouseEventHandler<HTMLInputElement> = () => {
    videoRef.current?.pause()
    setIsPlaying(false)
  }

  const onMouseUp: MouseEventHandler<HTMLInputElement> = useDebounced(() => {
    play()
  }, 350)

  const trimVideo = (): void => {
    if (!videoRef.current) return
    const videoStart = (videoRef.current.duration * start) / 100
    videoRef.current.currentTime = videoStart
    play()
  }

  const onTrim = (e: React.MouseEvent, isEnd: boolean): void => {
    if (!videoRef.current) return
    e.preventDefault()
    const trimmer = videoRef.current
    const startX = e.clientX
    const initialLeft = isEnd ? end : start

    const onDrag = (moveEvent: MouseEvent) => {
      if (!videoRef.current) return
      const delta = moveEvent.clientX - startX
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
    }

    document.addEventListener("mousemove", onDrag)
    document.addEventListener("mouseup", onDragEnd)
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
      if (!videoRef.current || !seekRef.current) return
      const video = videoRef.current
      const seek = seekRef.current
      const videoStart = (video.duration * start) / 100
      if (seek.valueAsNumber >= end - 3) {
        video.currentTime = videoStart
        play()
      } else if (video.currentTime < videoStart) {
        video.currentTime = videoStart
        play()
      }
    },
    videoRef,
    {
      passive: true,
    },
  )

  return (
    <>
      <VideoPreviewHeader />
      <video
        ref={videoRef}
        onClick={togglePlay}
        onTimeUpdate={syncSeekWithVideoValue}
        className="peer relative w-full cursor-pointer rounded-[2cqw]"
        playsInline
        autoPlay
        muted
        loop
        {...props}
      >
        <source src={src} />
        Your browser doesn't support <code>HTML5 video</code>
      </video>

      <button
        tabIndex={-1}
        onClick={togglePlay}
        className={cn(
          "invisible absolute m-auto grid aspect-square cursor-pointer place-items-center rounded-full bg-black/50 p-3 shadow-[0_0px_25px_3px_rgba(0,0,0,0.2)] outline-none hover:visible peer-hover:visible",
          !isPlaying ? "visible" : "invisible",
        )}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <div className="container relative flex h-16 justify-between rounded-xl bg-card">
        <div
          ref={trimmerRef}
          id="trimmer"
          className="absolute bottom-0 h-[64px] cursor-grab border-b-4 border-t-4 border-white shadow"
          style={{ left: `${start}%`, width: `${end - start}%` }}
        >
          <div
            onMouseDown={(e) => onTrim(e, false)}
            onMouseUp={trimVideo}
            ref={trimStartRef}
            id="trim-start"
            className="absolute -bottom-1 -top-1 z-20 w-5 cursor-ew-resize rounded-[0.75rem_0_0_0.75rem] border-b-0 border-r-0 border-t-0 bg-white"
            style={{ left: "-16px" }}
          >
            <div className="pointer-events-none absolute left-[8px] top-4 block h-8 w-1 rounded-[2px] bg-black/30" />
          </div>
          <div
            onMouseDown={(e) => onTrim(e, true)}
            onMouseUp={trimVideo}
            ref={trimEndRef}
            id="trim-end"
            className="absolute -bottom-1 -top-1 z-20 w-5 cursor-ew-resize rounded-[0_0.75rem_0.75rem_0] border-b-0 border-l-0 border-t-0 bg-white"
            style={{ right: "-16px" }}
          >
            <div className="pointer-events-none absolute left-[8px] top-4 block h-8 w-1 rounded-[2px] bg-black/30" />
          </div>
        </div>
        <input
          id="seek"
          min="0"
          max="100"
          step="0.01"
          defaultValue="0"
          type="range"
          ref={seekRef}
          onInput={syncVideoWithSeekValue}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          className="seek absolute z-10"
        />
        <div className="flex justify-between overflow-clip rounded-xl">
          <div className="flex justify-between ">
            <Frames />
          </div>
        </div>
      </div>
    </>
  )
}
