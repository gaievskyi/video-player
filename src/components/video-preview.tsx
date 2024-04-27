import { useRef, type ComponentProps } from "react"
import { useEventListener } from "~/hooks/use-event-listener"
import { useToggle } from "~/hooks/use-toggle"
import { VideoControls } from "./video-controls"

export type VideoProps = ComponentProps<"video"> & {
  fileName: string
}

export const VideoPreview = ({ fileName, ...props }: VideoProps) => {
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

  return (
    <>
      <p>{fileName}</p>
      <video
        ref={videoRef}
        onClick={togglePlay}
        className="peer relative w-full cursor-pointer rounded-[2cqw]"
        playsInline
        autoPlay
        muted
        loop
        {...props}
      />
      <VideoControls isPlaying={isPlaying} />
    </>
  )
}
