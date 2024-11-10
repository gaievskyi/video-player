import { useSyncExternalStore, useEffect, useState } from "react"

type NetworkStatus = {
  isOnline: boolean
  isReconnecting: boolean
  showOnlineStatus: boolean
}

// Keep track of the last known network state outside of the component
let lastKnownNetworkState = navigator.onLine
let isInitialLoad = true

function subscribe(callback: () => void) {
  window.addEventListener("online", callback)
  window.addEventListener("offline", callback)
  return () => {
    window.removeEventListener("online", callback)
    window.removeEventListener("offline", callback)
  }
}

function getSnapshot() {
  return navigator.onLine
}

function getServerSnapshot() {
  return true
}

export function useNetworkStatus(): NetworkStatus {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [showOnlineStatus, setShowOnlineStatus] = useState(false)

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>
    let onlineTimer: ReturnType<typeof setTimeout>
    // Only show reconnecting if there was an actual network state change
    const hasNetworkStateChanged = lastKnownNetworkState !== isOnline

    if (!isOnline) {
      setIsReconnecting(false)
      setShowOnlineStatus(false)
      lastKnownNetworkState = false
    } else if (hasNetworkStateChanged && !isInitialLoad) {
      // Show reconnecting only on actual network recovery
      setIsReconnecting(true)
      lastKnownNetworkState = true
      reconnectTimer = setTimeout(() => {
        setIsReconnecting(false)
        setShowOnlineStatus(true)
        onlineTimer = setTimeout(() => {
          setShowOnlineStatus(false)
        }, 5000)
      }, 1500)
    } else if (isInitialLoad) {
      // On initial load, just update the last known state
      lastKnownNetworkState = isOnline
      isInitialLoad = false
    }

    return () => {
      clearTimeout(reconnectTimer)
      clearTimeout(onlineTimer)
    }
  }, [isOnline])

  return {
    isOnline,
    isReconnecting,
    showOnlineStatus
  }
}