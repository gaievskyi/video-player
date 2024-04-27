import { PauseIcon, PlayIcon } from "./icons"

type VideoControlsProps = {
  isPlaying: boolean
}

export const VideoControls = ({ isPlaying }: VideoControlsProps) => {
  return (
    <div className="peer invisible absolute m-auto grid aspect-square cursor-pointer place-items-center rounded-full p-3 backdrop-blur-xl hover:visible peer-hover:visible">
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </div>
  )
}
