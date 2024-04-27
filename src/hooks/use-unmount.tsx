import { useEffect, useRef } from "react"

export const useUnmount = (func: () => void) => {
  const funcRef = useRef(func)

  funcRef.current = func

  useEffect(
    () => () => {
      funcRef.current()
    },
    [],
  )
}
