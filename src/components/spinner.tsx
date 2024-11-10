import { cn } from "~/lib/utils"

export function Spinner({
  className,
  particleClassName,
}: {
  className?: string
  particleClassName?: string
}) {
  const bars = Array.from({ length: 12 }).map((_, index) => {
    const rotation = index * 30
    const delay = `-${(index * 1) / 12}s`
    return (
      <div
        key={index}
        className={cn(
          "absolute h-[16%] w-[4%] animate-fade rounded-full bg-black opacity-0 dark:bg-white",
          particleClassName,
        )}
        style={{
          transform: `rotate(${rotation}deg) translate(0, -130%)`,
          animationDelay: delay,
        }}
      />
    )
  })

  return (
    <div
      className={cn(
        "relative mx-auto grid size-14 place-items-center rounded-lg p-2.5",
        className,
      )}
    >
      {bars}
    </div>
  )
}
