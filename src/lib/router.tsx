import {
  createContext,
  memo,
  use,
  useCallback,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react"
import { useEventListener } from "~/hooks/use-event-listener"
import { ErrorBoundary } from "./error-boundary"
import { ErrorPage } from "./error-page"

type RouterContextType = {
  navigate: (path: string) => void
  goBack: () => void
  params: Record<string, string>
  path: string
  isReady: boolean
  push: (path: string) => void
  prefetch: (path: string) => void
}

export const RouterContext = createContext<RouterContextType>({
  navigate: () => {},
  goBack: () => {},
  params: {},
  path: "",
  isReady: false,
  push: () => {},
  prefetch: () => {},
})

export const useRouter = () => use(RouterContext)

type ErrorPageProps = {
  error?: Error
  reset?: () => void
}

type Route = {
  path: string
  element: ReactNode
  errorElement?: ReactNode | ((props: ErrorPageProps) => ReactNode)
}

type RouterProps = {
  routes: Route[]
  notFound?: ReactNode
  children?: ReactNode
}

type LinkProps = ComponentProps<"a"> & { prefetch?: boolean; href: string }

export const Link = memo(function Link({
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

const NotFoundPage = () => (
  <div className="flex h-[100svh] w-full flex-col items-center justify-center gap-4 text-center">
    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-gray-400">
        The page you're looking for doesn't exist or has been moved.
      </p>
    </div>
    <button
      onClick={() => window.history.back()}
      className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
    >
      Go back
    </button>
  </div>
)

const matchRoute = (routePath: string, currentPath: string) => {
  const routeParts = routePath.split("/")
  const currentParts = currentPath.split("/")

  if (routeParts.length !== currentParts.length) return null

  const params: Record<string, string> = {}

  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(":")) {
      params[routeParts[i].slice(1)] = decodeURIComponent(currentParts[i])
    } else if (routeParts[i] !== currentParts[i]) {
      return null
    }
  }

  return params
}

export const Router = ({
  routes,
  notFound = <NotFoundPage />,
  children,
}: RouterProps) => {
  const [path, setPath] = useState(window.location.pathname)
  const [isReady, setIsReady] = useState(false)

  const prefetchCache = useMemo(() => new Set<string>(), [])

  useEventListener("popstate", () => {
    setPath(window.location.pathname)
    setIsReady(true)
  })

  const navigate = useCallback((newPath: string) => {
    window.history.pushState({}, "", newPath)
    setPath(newPath)
  }, [])

  const goBack = useCallback(() => {
    window.history.back()
  }, [])

  const push = useCallback((path: string) => {
    window.history.pushState({}, "", path)
    setPath(path)
  }, [])

  const prefetch = useCallback(
    (path: string) => {
      if (prefetchCache.has(path)) return
      prefetchCache.add(path)
    },
    [prefetchCache],
  )

  const currentParams = useMemo(() => {
    for (const route of routes) {
      const params = matchRoute(route.path, path)
      if (params !== null) {
        return params
      }
    }
    return {}
  }, [routes, path])

  const value = useMemo(
    () => ({
      navigate,
      goBack,
      params: currentParams,
      path,
      isReady,
      push,
      prefetch,
    }),
    [navigate, goBack, currentParams, path, isReady, push, prefetch],
  )

  for (const route of routes) {
    const params = matchRoute(route.path, path)
    if (params !== null) {
      return (
        <RouterContext.Provider value={value}>
          {children}
          <ErrorBoundary
            fallback={
              route.errorElement ??
              ((props: ErrorPageProps) => <ErrorPage {...props} />)
            }
          >
            {route.element}
          </ErrorBoundary>
        </RouterContext.Provider>
      )
    }
  }

  return (
    <RouterContext value={value}>
      {children}
      <ErrorBoundary
        fallback={(props: ErrorPageProps) => <ErrorPage {...props} />}
      >
        {notFound}
      </ErrorBoundary>
    </RouterContext>
  )
}
