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
import { formatTime } from "~/lib/utils"
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

  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(100)

  const [isPlaying, setIsPlaying, toggleIsPlaying] = useToggle(true)

  const togglePlay = (): void => {
    isPlaying ? videoRef.current?.pause() : videoRef.current?.play()
    toggleIsPlaying()
  }

  const play = (): void => {
    videoRef.current?.play()
    setIsPlaying(true)
  }

  const syncSliderWithVideoValue: ReactEventHandler<HTMLVideoElement> = () => {
    const updateSlider = () => {
      if (!seekRef.current || !videoRef.current) return
      const slider = seekRef.current
      const video = videoRef.current
      const value = (100 / video.duration) * video.currentTime
      slider.value = value.toFixed(2)
      slider.setAttribute("current-time", formatTime(video.currentTime))
      const thumbPosition = (slider.clientWidth * value) / 100
      slider.style.setProperty("--label-position", `${thumbPosition}px`)
    }

    const animateSlider = () => {
      updateSlider()
      if (isPlaying) {
        requestAnimationFrame(animateSlider)
      }
    }

    if (isPlaying) {
      requestAnimationFrame(animateSlider)
    }
  }

  const syncVideoWithSliderValue: FormEventHandler<HTMLInputElement> = () => {
    if (!seekRef.current || !videoRef.current) return
    const slider = seekRef.current
    const video = videoRef.current
    const time = video.duration * (Number(slider.value) / 100)
    video.currentTime = time
  }

  const onMouseDown: MouseEventHandler<HTMLInputElement> = () => {
    videoRef.current?.pause()
    setIsPlaying(false)
  }

  const onMouseUp: MouseEventHandler<HTMLInputElement> = useDebounced(() => {
    play()
  }, 350)

  useEventListener("keydown", (e) => {
    if (e.key === " " || e.code === "Space") {
      e.preventDefault()
      togglePlay()
    }
  })

  const dragTrimmer = (e: React.MouseEvent, isEnd: boolean): void => {
    if (!videoRef.current) return
    e.preventDefault()
    const trimmer = videoRef.current
    const startX = e.clientX
    const initialLeft = isEnd ? trimEnd : trimStart

    const onDrag = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      const newPos = initialLeft + (delta / trimmer.clientWidth) * 100

      if (isEnd) {
        if (newPos <= 100 && newPos >= trimStart + 5) {
          setTrimEnd(newPos)
        }
      } else {
        if (newPos >= 0 && newPos <= trimEnd - 5) {
          setTrimStart(newPos)
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

  return (
    <>
      <VideoPreviewHeader />
      <video
        ref={videoRef}
        onClick={togglePlay}
        onTimeUpdate={syncSliderWithVideoValue}
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
        className="invisible absolute m-auto grid aspect-square cursor-pointer place-items-center rounded-full p-3 shadow-[0_0px_25px_3px_rgba(0,0,0,0.2)] outline-none hover:visible peer-hover:visible"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <div className="relative flex h-16 justify-between rounded-xl bg-card">
        <div
          ref={trimmerRef}
          id="trimmer"
          className="absolute bottom-0 z-20 h-[64px] cursor-grab border-b-4 border-t-4 border-white shadow"
          style={{ left: `${trimStart}%`, width: `${trimEnd - trimStart}%` }}
        >
          <div
            onMouseDown={(e) => dragTrimmer(e, false)}
            ref={trimStartRef}
            id="trim-start"
            className="absolute -bottom-1 -top-1 w-5 cursor-ew-resize rounded-[0.75rem_0_0_0.75rem] border-b-0 border-r-0 border-t-0 bg-white"
            style={{ left: "-16px" }}
          >
            <div className="pointer-events-none absolute left-[8px] top-4 block h-8 w-1 rounded-[2px] bg-black/30" />
          </div>
          <div
            onMouseDown={(e) => dragTrimmer(e, true)}
            ref={trimEndRef}
            id="trim-end"
            className="absolute -bottom-1 -top-1 w-5 cursor-ew-resize rounded-[0_0.75rem_0.75rem_0] border-b-0 border-l-0 border-t-0 bg-white"
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
          onInput={syncVideoWithSliderValue}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          className="seek absolute z-10"
        />
        <Frames />
      </div>
    </>
  )
}
