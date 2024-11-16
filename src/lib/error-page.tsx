type ErrorPageProps = {
  error?: Error
  reset?: () => void
}

export const ErrorPage = ({ error, reset }: ErrorPageProps) => (
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
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-gray-400">
        {error?.message || "An unexpected error occurred"}
      </p>
    </div>
    <div className="flex gap-2">
      {reset && (
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
        >
          Try again
        </button>
      )}
      <button
        onClick={() => window.history.back()}
        className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/20"
      >
        Go back
      </button>
    </div>
  </div>
)