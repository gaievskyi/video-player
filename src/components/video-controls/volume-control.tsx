import { useState } from "react"
import { VolumeIcon, VolumeMutedIcon } from "../icons"

type VolumeControlProps = {
  volume: number
  isMuted: boolean
  onVolumeChange: (volume: number) => void
  onMuteToggle: () => void
}

export const VolumeControl = ({
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle,
}: VolumeControlProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(volume)

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    onVolumeChange(newVolume)
    setPreviousVolume(newVolume)
  }

  const handleMuteToggle = () => {
    if (!isMuted && volume === 0) {
      onVolumeChange(previousVolume || 0.5)
    }
    onMuteToggle()
  }

  const handleMouseDown = () => setIsDragging(true)
  const handleMouseUp = () => setIsDragging(false)

  const shouldShowSlider = (isHovered || isDragging) && !isMuted

  return (
    <div
      className="absolute bottom-10 right-2 z-10 flex items-center rounded-full bg-black/60 p-1 backdrop-blur-sm lg:right-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !isDragging && setIsHovered(false)}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleMuteToggle}
        className="grid h-8 w-8 place-items-center rounded-full text-white hover:bg-white/10"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0 ? <VolumeMutedIcon /> : <VolumeIcon />}
      </button>
      <div
        className={`overflow-hidden transition-all ${
          shouldShowSlider ? "w-24" : "w-0"
        }`}
      >
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className="volume-slider w-20 appearance-none rounded-full bg-white/30 transition-all hover:bg-white/50"
          title={`Volume: ${Math.round(volume * 100)}%`}
        />
      </div>
    </div>
  )
}
