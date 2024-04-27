import { useRef, type FormEventHandler, type MouseEventHandler } from "react"

type VideoTimelineProps = { frames: Array<string> }

const Indicator = () => (
  <div className="absolute left-16 top-0 h-full w-1 rounded-full bg-white" />
)

export const VideoTimeline = ({ frames }: VideoTimelineProps) => {
  const seekBarRer = useRef<HTMLInputElement>(null)

  const onInput: FormEventHandler<HTMLInputElement> = () => {
    if (!seekBarRer.current) return
    const [video] = document.getElementsByTagName("video")
    const time = video.duration * (Number(seekBarRer.current.value) / 100)
    video.currentTime = time
  }

  const onMouseDown: MouseEventHandler<HTMLInputElement> = () => {
    const [video] = document.getElementsByTagName("video")
    video.pause()
  }
  return (
    <div className="relative flex h-16 w-full justify-between overflow-clip rounded-xl border-[1px]">
      {/* {frames.map((frame, index) => (
        <img
          draggable="false"
          key={index + " frame"}
          src={frame}
          alt="Frame"
          className="max-w-[50px] object-cover"
        />
      ))} */}
      <input
        type="range"
        value="0"
        ref={seekBarRer}
        onInput={onInput}
        onMouseDown={onMouseDown}
        className="h-full w-full"
      />
      <Indicator />
    </div>
  )
}
