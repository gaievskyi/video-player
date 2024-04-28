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
import { videoFileRegex } from "~/lib/utils"
import type { Frame } from "~/lib/video-to-frames"
import { PauseIcon, PlayIcon } from "./icons"

export type VideoProps = ComponentProps<"video"> & {
  fileName: string
  frames: Array<Frame>
}

export const VideoPreview = ({
  src,
  fileName,
  frames,
  ...props
}: VideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const seekRef = useRef<HTMLInputElement>(null)
  const startRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLInputElement>(null)

  const [isPlaying, setIsPlaying, toggleIsPlaying] = useToggle(true)

  const [extension] = fileName.match(videoFileRegex) ?? []
  const fileNameWithoutExtension = extension
    ? fileName.replace(extension, "")
    : fileName

  const togglePlay = (): void => {
    isPlaying ? videoRef.current?.pause() : videoRef.current?.play()
    toggleIsPlaying()
  }

  const play = useDebounced(() => {
    videoRef.current?.play()
    setIsPlaying(true)
  }, 350)

  const syncSliderWithVideoValue: ReactEventHandler<HTMLVideoElement> = () => {
    const updateSlider = () => {
      if (!seekRef.current || !videoRef.current) return
      const value =
        (100 / videoRef.current.duration) * videoRef.current.currentTime
      seekRef.current.value = value.toFixed(2)
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
    const time =
      videoRef.current.duration * (Number(seekRef.current.value) / 100)
    seekRef.current.setAttribute("current-time", time.toFixed(2))
    videoRef.current.currentTime = time
  }

  const onMouseDown: MouseEventHandler<HTMLInputElement> = () => {
    videoRef.current?.pause()
    setIsPlaying(false)
  }

  const onMouseUp: MouseEventHandler<HTMLInputElement> = () => {
    play()
  }

  useEventListener("keydown", (e) => {
    if (e.key === " " || e.code === "Space") {
      e.preventDefault()
      togglePlay()
    }
  })

  return (
    <>
      <div className="inline-flex text-center">
        <span className="max-w-[200px] truncate">
          {fileNameWithoutExtension}
        </span>
        <span>{extension}</span>
      </div>

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
          type="range"
          ref={seekRef}
          onInput={syncVideoWithSliderValue}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          className="seek peer absolute z-10 after:absolute after:top-0 after:content-[attr(current-time)]"
        />

        {frames.map((frame) => (
          <img
            draggable={false}
            key={frame.id}
            src={frame.src}
            alt="Frame"
            className="pointer-events-none max-w-[25px] select-none object-cover first-of-type:rounded-l-xl last-of-type:rounded-r-xl"
          />
        ))}
      </div>
    </>
  )
}
