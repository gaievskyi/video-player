import { useState, useRef } from "react"
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
  const sliderRef = useRef<HTMLDivElement>(null)

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

  const calculateVolumeFromTouch = (clientY: number) => {
    if (!sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const height = rect.height
    const relativeY = clientY - rect.top
    const newVolume = 1 - Math.max(0, Math.min(1, relativeY / height))

    onVolumeChange(newVolume)
    setPreviousVolume(newVolume)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault() // Prevent scrolling
    setIsDragging(true)
    calculateVolumeFromTouch(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    e.preventDefault() // Prevent scrolling
    calculateVolumeFromTouch(e.touches[0].clientY)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const shouldShowSlider = (isHovered || isDragging) && !isMuted

  return (
    <div
      className="absolute bottom-10 -right-5 z-10 flex flex-col-reverse items-center rounded-full p-1 sm:flex-row lg:right-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !isDragging && setIsHovered(false)}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={sliderRef}
        className={`relative overflow-hidden transition-all ${
          shouldShowSlider
            ? "h-24 w-[20px] sm:h-auto sm:w-24"
            : "h-0 w-[20px] sm:h-auto sm:w-0"
        }`}
      >
        {/* Mobile touch area */}
        <div
          className="absolute inset-0 sm:hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="absolute bottom-0 left-1/2 w-1 -translate-x-1/2 rounded-full bg-white/30"
            style={{
              height: '100%',
            }}
          />
          <div
            className="absolute bottom-0 left-1/2 w-1 -translate-x-1/2 rounded-full bg-white"
            style={{
              height: `${volume * 100}%`,
            }}
          />
          <div
            className="absolute left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-white"
            style={{
              bottom: `calc(${volume * 100}% - 6px)`,
            }}
          />
        </div>

        {/* Desktop range input */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          className="volume-slider hidden sm:block"
          title={`Volume: ${Math.round(volume * 100)}%`}
        />
      </div>
      <div
        role="button"
        onClick={handleMuteToggle}
        className="grid h-7 mobile-button w-7 place-items-center rounded-full text-white mb-2 sm:mb-0"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0 ? <VolumeMutedIcon /> : <VolumeIcon />}
      </div>
    </div>
  )
}
