import { useEffect, useState } from 'react'
import { centsToInput, parseBRL } from '../../domain/money'

type Props = { value: number; onChange: (cents: number) => void; label?: string; ariaLabel?: string }

/** Campo monetário em R$: aceita "1.234,56", vazio = 0, inválido mostra erro e não propaga. */
export function MoneyInput({ value, onChange, label, ariaLabel }: Props) {
  const [text, setText] = useState(centsToInput(value))
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!error && parseBRL(text) !== value) setText(centsToInput(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const input = (
    <input
      className={`input${error ? ' invalid' : ''}`}
      inputMode="decimal"
      placeholder="0,00"
      aria-label={label ? undefined : ariaLabel}
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        const c = parseBRL(e.target.value)
        if (c === null) setError(true)
        else {
          setError(false)
          onChange(c)
        }
      }}
    />
  )
  return label ? (
    <label className="field">
      <span>{label}</span>
      {input}
      {error && <div className="error-text">Valor inválido</div>}
    </label>
  ) : (
    <div>
      {input}
      {error && <div className="error-text">Valor inválido</div>}
    </div>
  )
}
