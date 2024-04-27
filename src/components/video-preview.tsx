import {
  useRef,
  type ComponentProps,
  type FormEventHandler,
  type MouseEventHandler,
} from "react"
import { useDebounced } from "~/hooks/use-debounced"
import { useEventListener } from "~/hooks/use-event-listener"
import { useToggle } from "~/hooks/use-toggle"
import { PauseIcon, PlayIcon } from "./icons"

export type VideoProps = ComponentProps<"video"> & {
  fileName: string
  frames: Array<string>
}

export const VideoPreview = ({
  src,
  fileName,
  frames,
  ...props
}: VideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const seekBarRef = useRef<HTMLInputElement>(null)
  const [isPlaying, setIsPlaying, toggleIsPlaying] = useToggle(true)

  const togglePlay = () => {
    isPlaying ? videoRef.current?.pause() : videoRef.current?.play()
    toggleIsPlaying()
  }

  const play = () => {
    videoRef.current?.play()
    setIsPlaying(true)
  }

  const debouncedPlay = useDebounced(play, 1000)

  const syncSliderWithVideoValue = () => {
    if (!seekBarRef.current || !videoRef.current) return

    const updateSlider = () => {
      if (seekBarRef.current && videoRef.current) {
        const value =
          (100 / videoRef.current.duration) * videoRef.current.currentTime
        seekBarRef.current.value = value.toFixed(2)
      }
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
    if (!seekBarRef.current || !videoRef.current) return
    const time =
      videoRef.current.duration * (Number(seekBarRef.current.value) / 100)
    videoRef.current.currentTime = time
  }

  const onMouseDown: MouseEventHandler<HTMLInputElement> = () => {
    videoRef.current?.pause()
    setIsPlaying(false)
  }

  useEventListener("keydown", (e) => {
    if (e.key === " " || e.code === "Space") {
      togglePlay()
    }
  })

  return (
    <>
      <p className="w-[200px] truncate text-center">{fileName}</p>
      <video
        onTimeUpdate={syncSliderWithVideoValue}
        ref={videoRef}
        onClick={togglePlay}
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
        className="peer invisible absolute m-auto grid aspect-square cursor-pointer place-items-center rounded-full p-3 backdrop-blur-xl hover:visible peer-hover:visible"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div className="relative flex h-16 w-full justify-between overflow-clip rounded-xl">
        <input
          min="0"
          max="100"
          step="0.01"
          type="range"
          ref={seekBarRef}
          onInput={syncVideoWithSliderValue}
          onMouseDown={onMouseDown}
          onChange={debouncedPlay}
          className="absolute z-10 h-full w-full"
        />
        {frames.map((frame, index) => (
          <img
            draggable="false"
            key={index + " frame"}
            src={frame}
            alt="Frame"
            className="pointer-events-none max-w-[25px] select-none object-cover"
          />
        ))}
      </div>
    </>
  )
}
