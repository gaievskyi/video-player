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
import { VideoControls } from "./video-controls"

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
  const seekBarRer = useRef<HTMLInputElement>(null)
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

  const syncSliderWithVideoValue: ReactEventHandler<HTMLVideoElement> = () => {
    if (!seekBarRer.current || !videoRef.current) return
    const value =
      (100 / videoRef.current.duration) * videoRef.current.currentTime
    seekBarRer.current.value = String(value)
  }

  const syncVideoWithSliderValue: FormEventHandler<HTMLInputElement> = () => {
    if (!seekBarRer.current || !videoRef.current) return
    const time =
      videoRef.current.duration * (Number(seekBarRer.current.value) / 100)
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
    // if (e.code === "")
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
      <VideoControls isPlaying={isPlaying} />
      <div className="relative flex h-16 w-full justify-between overflow-clip rounded-xl border-[1px]">
        <input
          min="0"
          max="100"
          step="1"
          type="range"
          ref={seekBarRer}
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
