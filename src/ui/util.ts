import { useCallback, useEffect, useState } from 'react'

/** Carrega dados assíncronos; `reload()` refaz a carga. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []): { data: T | undefined; loading: boolean; error?: string; reload: () => void } {
  const [data, setData] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    setLoading(true)
    fn()
      .then((d) => alive && (setData(d), setError(undefined)))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, loading, error, reload }
}

export const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e))
