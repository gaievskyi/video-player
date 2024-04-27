import { useState } from "react"

export const useToggle = (initialValue: boolean) => {
  const [value, setValue] = useState(initialValue)

  const toggle = (): void => {
    setValue((prev) => !prev)
  }

  return [value, setValue, toggle] as const
}
