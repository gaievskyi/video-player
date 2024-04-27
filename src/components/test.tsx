import React, { useEffect, useRef, useState } from "react"
import "tailwindcss/tailwind.css"

const lerp = (start: number, end: number, amt: number) =>
  (1 - amt) * start + amt * end

const SliderComponent: React.FC = () => {
  const rangeRef = useRef<HTMLInputElement>(null)
  const counterRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  const [rangeValue, setRangeValue] = useState(50) // Default value of the slider
  const [rangeWidth, setRangeWidth] = useState(0)

  useEffect(() => {
    if (rangeRef.current) {
      setRangeWidth(rangeRef.current.offsetWidth)
    }
  }, [])

  useEffect(() => {
    const updateValues = () => {
      const min = parseInt(rangeRef.current?.min || "0")
      const max = parseInt(rangeRef.current?.max || "100")
      const range = (rangeValue - min) / (max - min)

      if (counterRef.current && lineRef.current) {
        const newPosition = lerp(
          parseFloat(
            counterRef.current.style.getPropertyValue("--position") || "0",
          ),
          rangeWidth * range,
          0.1,
        )
        const newSize = lerp(
          parseFloat(lineRef.current.style.getPropertyValue("--size") || "0"),
          range,
          0.1,
        )

        counterRef.current.textContent = rangeValue.toString()
        counterRef.current.style.setProperty("--position", `${newPosition}`)
        lineRef.current.style.setProperty("--size", `${newSize}`)
      }
    }

    const interval = setInterval(() => {
      requestAnimationFrame(updateValues)
    }, 1000 / 60)

    return () => clearInterval(interval)
  }, [rangeValue, rangeWidth])

  return (
    <div className="font-roboto flex h-screen flex-col items-center justify-center">
      <h1 className="mb-24 text-center font-normal">Slider Component</h1>
      <div className="box max-h-192 my-10vh mx-auto h-full w-full max-w-3xl">
        <div className="wrapper mx-30px">
          <div
            className="fir relative w-full rounded bg-gray-200"
            ref={rangeRef}
          >
            <div
              className="fir-line absolute left-0 top-1/2 h-0 scale-x-[var(--size)] transform border-t-2 border-blue-500"
              ref={lineRef}
            ></div>
            <div
              className="fir-counter absolute -top-[60px] left-1/2 -translate-x-1/2 transform rounded-full bg-blue-200 text-center text-sm text-blue-600"
              style={{ lineHeight: "50px", fontSize: "15px" }}
              ref={counterRef}
            ></div>
            <input
              type="range"
              className="fir-range inline-block h-12 w-full opacity-0"
              min="0"
              max="100"
              value={rangeValue}
              onChange={(e) => setRangeValue(parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SliderComponent
