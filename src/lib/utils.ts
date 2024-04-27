export const isDevelopment = process.env.NODE_ENV === "development"
export const isProduction = process.env.NODE_ENV === "production"

export { twMerge as cn } from "tailwind-merge"

export const lerp = (start: number, end: number, amt: number) =>
  (1 - amt) * start + amt * end

export const videoFileRegex = /\.(mp4|mov)$/i
