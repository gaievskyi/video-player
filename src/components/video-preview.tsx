import {
  useRef,
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
  // const startRef = useRef<HTMLInputElement>(null)
  // const endRef = useRef<HTMLInputElement>(null)

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
        <p>Your browser doesn't support HTML5 video.</p>
      </video>

      <button
        tabIndex={-1}
        onClick={togglePlay}
        className="invisible absolute m-auto grid aspect-square cursor-pointer place-items-center rounded-full p-3 shadow-[0_0px_25px_3px_rgba(0,0,0,0.2)] outline-none hover:visible peer-hover:visible"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <div className="relative flex h-16 justify-between rounded-xl bg-card">
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
          className="seek peer absolute z-30 after:absolute after:-top-8 after:left-[var(--label-position)] after:-translate-x-1/2 after:rounded-full after:bg-white after:px-2 after:text-xs after:font-medium after:tabular-nums after:text-black after:content-[attr(current-time)]"
        />
        <Frames />
      </div>
    </>
  )
}
