import { createParser } from "nuqs"

const TIME_REGEX = /^(\d+m)?(\d+(\.\d+)?s)?$/

function parseTimeToSeconds(timeStr: string): number | null {
  if (!TIME_REGEX.test(timeStr)) return null

  const minutes = timeStr.match(/(\d+)m/)?.[1]
  const seconds = timeStr.match(/(\d+(\.\d+)?)s/)?.[1]

  const totalSeconds =
    (minutes ? parseInt(minutes) * 60 : 0) + (seconds ? parseFloat(seconds) : 0)

  return totalSeconds
}

function formatSecondsToTime(seconds: number): string {
  if (!seconds) return "0s"

  // Round to 3 decimal places for millisecond precision
  const roundedSeconds = Math.round(seconds * 1000) / 1000

  const mins = Math.floor(roundedSeconds / 60)
  const secs = roundedSeconds % 60

  // For display, we'll show decimals only if they're non-zero
  const secsFormatted =
    secs === Math.floor(secs) ? Math.floor(secs).toString() : secs.toFixed(2)

  return `${mins ? mins + "m" : ""}${secsFormatted || (!mins ? "0" : "")}s`
}

export const parseAsTime = createParser({
  parse(queryValue) {
    if (!queryValue) return 0
    const seconds = parseTimeToSeconds(queryValue)
    return seconds !== null ? seconds : 0
  },
  serialize(seconds) {
    return formatSecondsToTime(seconds)
  },
})
