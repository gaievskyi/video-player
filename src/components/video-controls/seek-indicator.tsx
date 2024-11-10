import { motion } from "framer-motion"

type SeekIndicatorProps = {
  direction: "left" | "right"
  seekIncrement: number
}

export const SeekIndicator = ({
  direction,
  seekIncrement,
}: SeekIndicatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`absolute top-1/2 -translate-y-1/2 ${
        direction === "left" ? "left-4" : "right-4"
      } rounded-full bg-white/20 p-3 backdrop-blur-sm`}
    >
      {direction === "left" ? (
        <svg
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.4 16.9C12.2 16.9 12 16.8 11.9 16.7L7.7 12.5C7.5 12.3 7.5 12 7.7 11.8L11.9 7.6C12.1 7.4 12.4 7.4 12.6 7.6C12.8 7.8 12.8 8.1 12.6 8.3L8.9 12L12.6 15.7C12.8 15.9 12.8 16.2 12.6 16.4C12.6 16.8 12.5 16.9 12.4 16.9Z"
            fill="currentColor"
          />
          <path
            d="M16.3 16.9C16.1 16.9 15.9 16.8 15.8 16.7L11.6 12.5C11.4 12.3 11.4 12 11.6 11.8L15.8 7.6C16 7.4 16.3 7.4 16.5 7.6C16.7 7.8 16.7 8.1 16.5 8.3L12.8 12L16.5 15.7C16.7 15.9 16.7 16.2 16.5 16.4C16.4 16.8 16.3 16.9 16.3 16.9Z"
            fill="currentColor"
          />
        </svg>
      ) : (
        <svg
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.6 16.9C11.4 16.9 11.2 16.8 11.1 16.7C10.9 16.5 10.9 16.2 11.1 16L14.8 12.3L11.1 8.6C10.9 8.4 10.9 8.1 11.1 7.9C11.3 7.7 11.6 7.7 11.8 7.9L16 12.1C16.2 12.3 16.2 12.6 16 12.8L11.8 17C11.8 16.8 11.7 16.9 11.6 16.9Z"
            fill="currentColor"
          />
          <path
            d="M7.7 16.9C7.5 16.9 7.3 16.8 7.2 16.7C7 16.5 7 16.2 7.2 16L10.9 12.3L7.2 8.6C7 8.4 7 8.1 7.2 7.9C7.4 7.7 7.7 7.7 7.9 7.9L12.1 12.1C12.3 12.3 12.3 12.6 12.1 12.8L7.9 17C7.9 16.8 7.8 16.9 7.7 16.9Z"
            fill="currentColor"
          />
        </svg>
      )}
      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-black/80 shadow-sm">
        {seekIncrement}s
      </span>
    </motion.div>
  )
}
