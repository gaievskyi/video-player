import { useEffect, useState } from "react"

export const CodecSupportIndicator = () => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null)

  useEffect(() => {
    setIsSupported(typeof window.VideoEncoder !== "undefined")
  }, [])

  if (isSupported === null) return null

  return (
    <div
      className={`fixed left-1/2 top-4 z-50 flex w-fit -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium shadow-lg ${
        isSupported
          ? "bg-green-500/20 text-green-500"
          : "bg-red-500/20 text-red-500"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path
          fillRule="evenodd"
          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z"
          clipRule="evenodd"
        />
      </svg>
      WebCodecs API is {isSupported ? "supported" : "not supported"}
    </div>
  )
}
