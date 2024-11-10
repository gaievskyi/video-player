import { useEffect, useState } from "react"
import { registerSW } from "virtual:pwa-register"
import { motion, AnimatePresence } from "framer-motion"
import { useNetworkStatus } from "~/hooks/use-network-status"

export function PWAUpdater() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const { isOnline, isReconnecting, showOnlineStatus } = useNetworkStatus()

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true)
      },
      onOfflineReady() {
        setOfflineReady(true)
        setTimeout(() => setOfflineReady(false), 3000)
      }
    })

    return () => {
      updateSW()
    }
  }, [])

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  const shouldShow = needRefresh || offlineReady || !isOnline || isReconnecting || showOnlineStatus

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          key={`${isOnline}-${isReconnecting}-${showOnlineStatus}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-50 flex justify-end"
        >
          <div className="flex items-center gap-3 rounded-full bg-black/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                  !isOnline
                    ? 'bg-yellow-500 animate-pulse'
                    : isReconnecting
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-green-500'
                }`}
              />
              {!isOnline && <span>Offline mode</span>}
              {isOnline && isReconnecting && (
                <div className="flex items-center gap-2">
                  <span>Reconnecting</span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    ...
                  </motion.span>
                </div>
              )}
              {isOnline && !isReconnecting && showOnlineStatus && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <span>Online</span>
                </motion.div>
              )}
              {isOnline && !isReconnecting && !showOnlineStatus && offlineReady && (
                <span>Ready to work offline</span>
              )}
              {isOnline && !isReconnecting && !showOnlineStatus && needRefresh && (
                <>
                  <span>New version available</span>
                  <button
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium hover:bg-white/20"
                    onClick={() => location.reload()}
                  >
                    Update
                  </button>
                  <button
                    className="rounded-full bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                    onClick={close}
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}