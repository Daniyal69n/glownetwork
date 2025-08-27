"use client"
import { useCallback, useState } from "react"

export type CelebrationState = {
  visible: boolean
  title?: string
  subtitle?: string
}

export function useCelebration() {
  const [state, setState] = useState<CelebrationState>({ visible: false })

  const celebrate = useCallback((title?: string, subtitle?: string) => {
    setState({ visible: true, title, subtitle })
  }, [])

  const hide = useCallback(() => {
    setState((s) => ({ ...s, visible: false }))
  }, [])

  return { ...state, celebrate, hide }
}


