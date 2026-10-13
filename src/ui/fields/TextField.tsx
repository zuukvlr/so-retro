type Props = {
  label: string
  value: string | undefined
  onChange: (v: string) => void
  type?: 'text' | 'date' | 'email' | 'tel' | 'number'
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email'
  multiline?: boolean
  placeholder?: string
  error?: string
  autoComplete?: string
}

export function TextField({ label, value, onChange, type = 'text', inputMode, multiline, placeholder, error, autoComplete }: Props) {
  const common = {
    className: `input${error ? ' invalid' : ''}`,
    value: value ?? '',
    placeholder,
    autoComplete: autoComplete ?? 'off',
  }
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea {...common} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} type={type} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
      )}
      {error && <div className="error-text">{error}</div>}
    </label>
  )
}

export function SelectField<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}
