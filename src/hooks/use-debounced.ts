import { useEffect, useMemo, useRef } from "react"

import debounce from "lodash.debounce"
import { useUnmount } from "./use-unmount"

type DebounceOptions = {
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

type ControlFunctions = {
  cancel: () => void
  flush: () => void
  isPending: () => boolean
}

export type DebouncedState<T extends (...args: unknown[]) => ReturnType<T>> = ((
  ...args: Parameters<T>
) => ReturnType<T> | undefined) &
  ControlFunctions

export function useDebounced<T extends (...args: unknown[]) => ReturnType<T>>(
  func: T,
  delay = 300,
  options?: DebounceOptions,
): DebouncedState<T> {
  const debouncedFunc = useRef<ReturnType<typeof debounce> | null>(null)

  useUnmount(() => {
    if (debouncedFunc.current) {
      debouncedFunc.current.cancel()
    }
  })

  const debounced = useMemo(() => {
    const debouncedFuncInstance = debounce(func, delay, options)

    const wrappedFunc: DebouncedState<T> = (...args: Parameters<T>) => {
      return debouncedFuncInstance(...args)
    }

    wrappedFunc.cancel = () => {
      debouncedFuncInstance.cancel()
    }

    wrappedFunc.isPending = () => {
      if (!debouncedFunc.current) return false
      // eslint-disable-next-line react-compiler/react-compiler
      // @eslint-disable-next-line react-hooks/rules-of-hooks
      return !!debouncedFunc.current
    }

    wrappedFunc.flush = () => {
      return debouncedFuncInstance.flush()
    }

    return wrappedFunc
  }, [func, delay, options])

  // Update the debounced function ref whenever func, wait, or options change
  useEffect(() => {
    debouncedFunc.current = debounce(func, delay, options)
  }, [func, delay, options])

  return debounced
}
