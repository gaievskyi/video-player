import { useRef, type ComponentProps, type ReactEventHandler } from "react"
import { useEventListener } from "~/hooks/use-event-listener"
import { useToggle } from "~/hooks/use-toggle"
import { VideoControls } from "./video-controls"

export type VideoProps = ComponentProps<"video"> & {
  fileName: string
}

export const VideoPreview = ({ src, fileName, ...props }: VideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, _, toggleIsPlaying] = useToggle(true)

  const togglePlay = () => {
    isPlaying ? videoRef.current?.pause() : videoRef.current?.play()
    toggleIsPlaying()
  }

  useEventListener("keydown", (e) => {
    if (e.key == " " || e.code == "Space") {
      togglePlay()
    }
  })

  const onTimeUpdate: ReactEventHandler<HTMLVideoElement> = () => {
    if (!videoRef.current) return
    const seekBar = document.getElementById("seek-bar") as HTMLInputElement
    const value =
      (100 / videoRef.current.duration) * videoRef.current.currentTime
    seekBar.value = String(value)
  }

  return (
    <>
      <p className="w-[200px] truncate text-center">{fileName}</p>
      <video
        onTimeUpdate={onTimeUpdate}
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
    </>
  )
}
