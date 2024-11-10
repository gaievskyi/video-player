import debounce from 'lodash.debounce'
import { useState } from 'react'
import { useEffect } from 'react'
import { formatTime } from '~/components/video-controls/trimmer-container'


export const useResponsiveRuler = (duration: number) => {
  const [rulerConfig, setRulerConfig] = useState({
    interval: 1,
    showLabels: true,
    labelInterval: 1,
    compact: false,
  })

  useEffect(() => {
    const updateRulerConfig = () => {
      const width = window.innerWidth

      // Calculate optimal intervals based on duration and screen width
      const getOptimalInterval = () => {
        if (duration <= 30) return { base: 2, label: 2 }
        if (duration <= 60) return { base: 5, label: 5 }
        if (duration <= 300) return { base: 15, label: 30 } // 5 minutes
        if (duration <= 900) return { base: 30, label: 60 } // 15 minutes
        if (duration <= 3600) return { base: 60, label: 300 } // 1 hour
        return { base: 300, label: 600 } // > 1 hour
      }

      const intervals = getOptimalInterval()

      if (width < 640) {
        // Mobile
        setRulerConfig({
          interval: intervals.base * 2,
          showLabels: true,
          labelInterval: intervals.label * 2,
          compact: true,
        })
      } else if (width < 1024) {
        // Tablet
        setRulerConfig({
          interval: intervals.base,
          showLabels: true,
          labelInterval: intervals.label,
          compact: duration > 900, // Compact for videos > 15 mins
        })
      } else {
        // Desktop
        setRulerConfig({
          interval: intervals.base,
          showLabels: true,
          labelInterval: intervals.label,
          compact: duration > 1800, // Compact for videos > 30 mins
        })
      }
    }

    updateRulerConfig()
    const debouncedUpdate = debounce(updateRulerConfig, 250)
    window.addEventListener("resize", debouncedUpdate)
    return () => {
      window.removeEventListener("resize", debouncedUpdate)
      debouncedUpdate.cancel()
    }
  }, [duration])

  return rulerConfig
}

export const TimeRuler = ({ duration }: { duration: number }) => {
  const { interval, showLabels, labelInterval, compact } =
    useResponsiveRuler(duration)

  const markers = []

  // Generate markers except the last one
  for (let i = 0; i < duration; i += interval) {
    const percent = (i / duration) * 100
    const isLabelMarker = i % labelInterval === 0
    const isHalfwayMarker = i % (labelInterval / 2) === 0
    const isFirstMarker = i === 0

    // Skip if too close to the end
    if (duration - i < interval / 2) continue

    markers.push(
      <div
        key={i}
        className="absolute flex flex-col items-center"
        style={{
          left: `${percent}%`,
          transform: isFirstMarker ? 'translateX(0)' : 'translateX(-50%)'
        }}
      >
        <div
          className={`h-2 transition-all duration-200 ${
            isLabelMarker || isFirstMarker
              ? "w-[1.5px] bg-zinc-600"
              : isHalfwayMarker
                ? "w-[1px] bg-zinc-700"
                : "w-[0.5px] bg-zinc-800"
          }`}
        />
        {showLabels && (isLabelMarker || isFirstMarker) && (
          <span className="mt-1 text-[10px] text-zinc-400 transition-opacity duration-200">
            {formatTime(i, compact)}
          </span>
        )}
      </div>
    )
  }

  // Add end marker separately
  markers.push(
    <div
      key="end"
      className="absolute flex flex-col items-center"
      style={{
        left: '100%',
        transform: 'translateX(-100%)'
      }}
    >
      <div className="h-2 w-[1.5px] bg-zinc-600 transition-all duration-200" />
      {showLabels && (
        <span className="mt-1 text-[10px] text-zinc-400 transition-opacity duration-200">
          {formatTime(duration, compact)}
        </span>
      )}
    </div>
  )

  return (
    <div className="absolute -top-6 w-full select-none">
      <div className="relative h-8">{markers}</div>
    </div>
  )
}