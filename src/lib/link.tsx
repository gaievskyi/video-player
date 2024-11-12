import { memo, type ReactNode, useCallback, useState } from "react"
import { useRouter } from "./router"

type LinkProps = {
  href: string
  children: ReactNode
  prefetch?: boolean
  className?: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

export const Link = memo(function ({
  href,
  children,
  prefetch = true,
  className,
  onClick,
}: LinkProps) {
  const router = useRouter()
  const [isPrefetched, setIsPrefetched] = useState(false)

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      if (onClick) onClick(e)
      router.push(href)
    },
    [onClick, router, href],
  )

  const handleMouseEnter = useCallback(() => {
    if (prefetch && !isPrefetched) {
      router.prefetch(href)
      setIsPrefetched(true)
    }
  }, [prefetch, isPrefetched, router, href])

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={className}
    >
      {children}
    </a>
  )
})
