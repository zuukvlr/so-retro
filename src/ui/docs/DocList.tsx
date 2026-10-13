import { useSearchParams } from 'react-router-dom'
import { repo } from '../../db/repo'
import { todayISO } from '../../domain/dates'
import { QUOTE_STATUS_LABEL, RECEIPT_STATUS_LABEL, TYPE_LABEL } from '../../domain/labels'
import { useLoad } from '../util'
import { DocRow, shownStatus } from './DocRow'

type TypeFilter = 'quotes' | 'all' | 'parts_quote' | 'service_quote' | 'receipt'

const STATUS_OPTIONS = { ...QUOTE_STATUS_LABEL, issued: RECEIPT_STATUS_LABEL.issued }

export function DocList({ defaultType }: { defaultType: TypeFilter }) {
  const [sp, setSp] = useSearchParams()
  const { data: docs = [], loading } = useLoad(() => repo.listDocs())
  const type = (sp.get('type') as TypeFilter | null) ?? defaultType
  const q = sp.get('q') ?? ''
  const status = sp.get('status') ?? ''
  const from = sp.get('from') ?? ''
  const to = sp.get('to') ?? ''
  const setParam = (k: string, v: string) => {
    const n = new URLSearchParams(sp)
    if (v) n.set(k, v)
    else n.delete(k)
    setSp(n, { replace: true })
  }
  const today = todayISO()
  const needle = q.trim().toLowerCase()
  const list = docs.filter((d) => {
    if (type === 'quotes' ? d.type === 'receipt' : type !== 'all' && d.type !== type) return false
    if (status && shownStatus(d, today) !== status) return false
    if (from && d.issuedAt < from) return false
    if (to && d.issuedAt > to) return false
    if (needle && !`${d.number} ${d.client.name}`.toLowerCase().includes(needle)) return false
    return true
  })
  const title = defaultType === 'receipt' ? 'Recibos' : 'Orçamentos'

  return (
    <div className="page">
      <h1>{title}</h1>
      <div className="card stack">
        <input className="input" type="search" placeholder="Buscar por cliente ou número" aria-label="Buscar" value={q} onChange={(e) => setParam('q', e.target.value)} />
        <div className="grid2">
          <select className="input" aria-label="Tipo" value={type} onChange={(e) => setParam('type', e.target.value)}>
            <option value="quotes">Todos os orçamentos</option>
            <option value="parts_quote">{TYPE_LABEL.parts_quote}</option>
            <option value="service_quote">{TYPE_LABEL.service_quote}</option>
            <option value="receipt">Recibos</option>
            <option value="all">Todos os documentos</option>
          </select>
          <select className="input" aria-label="Situação" value={status} onChange={(e) => setParam('status', e.target.value)}>
            <option value="">Qualquer situação</option>
            {Object.entries(STATUS_OPTIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div className="stack">
          <label className="field"><span>De</span><input className="input" type="date" value={from} onChange={(e) => setParam('from', e.target.value)} /></label>
          <label className="field"><span>Até</span><input className="input" type="date" value={to} onChange={(e) => setParam('to', e.target.value)} /></label>
        </div>
      </div>
      <div className="card">
        {loading && <p className="muted">Carregando…</p>}
        {!loading && list.length === 0 && <p className="muted">Nenhum documento encontrado.</p>}
        {list.map((d) => <DocRow key={d.id} d={d} />)}
      </div>
    </div>
  )
}
