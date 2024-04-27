type VideoTimelineProps = { frames: Array<string> }

const Indicator = () => (
  <div className="absolute left-16 top-0 h-full w-1 rounded-full bg-white" />
)

export const VideoTimeline = ({ frames }: VideoTimelineProps) => {
  return (
    <div className="relative flex h-16 w-full justify-between overflow-clip rounded-xl border-[1px]">
      {frames.map((frame, index) => (
        <img
          key={index + " frame"}
          src={frame}
          alt="Frame"
          className="max-w-[50px] object-cover"
        />
      ))}
      <Indicator />
    </div>
  )
}
