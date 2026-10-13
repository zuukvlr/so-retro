import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

type ConfirmOpts = { confirmLabel?: string; danger?: boolean; title?: string }
type Ui = {
  ok: (msg: string) => void
  err: (msg: string) => void
  confirm: (msg: string, opts?: ConfirmOpts) => Promise<boolean>
}
const Ctx = createContext<Ui | null>(null)

export function useUi(): Ui {
  const c = useContext(Ctx)
  if (!c) throw new Error('useUi fora do UiProvider')
  return c
}

export function UiProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null)
  const [ask, setAsk] = useState<{ msg: string; opts: ConfirmOpts } | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback((msg: string, kind: 'ok' | 'err') => {
    setToast({ msg, kind })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), kind === 'err' ? 6000 : 3000)
  }, [])

  const confirm = useCallback(
    (msg: string, opts: ConfirmOpts = {}) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve
        setAsk({ msg, opts })
      }),
    [],
  )
  const answer = (v: boolean) => {
    resolver.current?.(v)
    resolver.current = null
    setAsk(null)
  }

  const value = useMemo<Ui>(() => ({ ok: (m) => show(m, 'ok'), err: (m) => show(m, 'err'), confirm }), [show, confirm])

  return (
    <Ctx.Provider value={value}>
      {children}
      {toast && (
        <div className={`toast ${toast.kind}`} role="status" aria-live="polite" onClick={() => setToast(null)}>
          {toast.msg}
        </div>
      )}
      {ask && (
        <div className="sheet-back" onClick={() => answer(false)}>
          <div className="sheet stack" role="alertdialog" aria-label={ask.opts.title ?? 'Confirmar'} onClick={(e) => e.stopPropagation()}>
            <h2>{ask.opts.title ?? 'Confirmar'}</h2>
            <p style={{ margin: 0 }}>{ask.msg}</p>
            <div className="row">
              <button className="btn" onClick={() => answer(false)}>Voltar</button>
              <button className={`btn ${ask.opts.danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => answer(true)}>
                {ask.opts.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
