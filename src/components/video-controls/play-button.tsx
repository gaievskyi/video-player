import { motion } from "framer-motion"
import type { ComponentProps } from 'react'
import { PlayIcon } from "../icons"

type PlayButtonProps = ComponentProps<"button">


export const PlayButton = ({ onClick }: PlayButtonProps) => {
  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.2, type: "spring", bounce: 0.3 }}
      tabIndex={-1}
      onClick={onClick}
      className="absolute inset-0 m-auto grid h-16 w-16 cursor-pointer place-items-center rounded-full bg-black/50 pl-0.5 shadow-[0_0px_25px_3px_rgba(0,0,0,0.2)] outline-none backdrop-blur-sm hover:scale-105"
    >
      <PlayIcon />
    </motion.button>
  )
}