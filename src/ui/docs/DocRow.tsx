import { Link } from 'react-router-dom'
import { formatDateBR, todayISO } from '../../domain/dates'
import { TYPE_LABEL, statusLabel } from '../../domain/labels'
import { formatBRL } from '../../domain/money'
import { effectiveStatus } from '../../domain/status'
import type { Doc } from '../../domain/types'

export const docValue = (d: Doc): number => (d.type === 'receipt' ? d.receivedCents : d.totals.totalCents)
export const shownStatus = (d: Doc, today: string = todayISO()): string => (d.type === 'receipt' ? d.status : effectiveStatus(d, today))

export function DocRow({ d }: { d: Doc }) {
  const st = shownStatus(d)
  return (
    <Link to={`/doc/${d.id}`} className="list-item">
      <span>
        <b>{d.number}</b>{d.version > 1 && <span className="muted"> v{d.version}</span>}
        <br />
        <span>{d.client.name || 'Sem cliente'}</span>
        <br />
        <span className="muted">{TYPE_LABEL[d.type]} · {formatDateBR(d.issuedAt)}</span>
      </span>
      <span style={{ textAlign: 'right' }}>
        <b>{formatBRL(docValue(d))}</b>
        <br />
        <span className={`badge ${st}`}>{statusLabel(d.type, st)}</span>
      </span>
    </Link>
  )
}
