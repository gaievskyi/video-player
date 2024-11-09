import { useEffect, useState } from "react"

export const CodecSupportIndicator = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null)

  useEffect(() => {
    setIsSupported(typeof window.VideoEncoder !== "undefined")
  }, [])

  if (isSupported === null) return null

  return (
    <div
      className={`fixed w-fit left-1/2 top-4 z-50 -translate-x-1/2 rounded-full px-3 py-1 text-sm font-medium shadow-lg ${
        isSupported
          ? "bg-green-500/20 text-green-500"
          : "bg-red-500/20 text-red-500"
      }`}
    >
      WebCodecs API is {isSupported ? "supported" : "not supported"}
    </div>
  )
}