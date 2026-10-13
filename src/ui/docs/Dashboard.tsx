import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { repo } from '../../db/repo'
import { todayISO } from '../../domain/dates'
import { formatBRL } from '../../domain/money'
import { dashboardStats } from '../../domain/stats'
import { Logo } from '../Logo'
import { useLoad } from '../util'
import { DocRow } from './DocRow'

export function Dashboard() {
  const { data: docs = [], loading } = useLoad(() => repo.listDocs())
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const s = dashboardStats(docs, todayISO())
  return (
    <div className="page">
      <div className="row" style={{ alignItems: 'center', marginBottom: 12 }}>
        <Logo size={56} />
        <div><h1 style={{ margin: 0 }}>Só Retro</h1><span className="muted">Peças e Serviços</span></div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); nav(`/docs?type=all&q=${encodeURIComponent(q)}`) }}>
        <input className="input" type="search" placeholder="Buscar documento ou cliente" aria-label="Buscar documento ou cliente" value={q} onChange={(e) => setQ(e.target.value)} />
      </form>

      <div className="grid2" style={{ margin: '12px 0' }}>
        <Link to="/docs" className="card stat" style={{ textDecoration: 'none', marginBottom: 0 }}><b>{s.quotesCount}</b><span className="muted">Orçamentos</span></Link>
        <Link to="/docs?status=sent" className="card stat" style={{ textDecoration: 'none', marginBottom: 0 }}><b>{s.pendingCount}</b><span className="muted">Pendentes</span></Link>
        <Link to="/docs?status=approved" className="card stat" style={{ textDecoration: 'none', marginBottom: 0 }}><b>{s.approvedCount}</b><span className="muted">Aprovados</span></Link>
        <Link to="/receipts" className="card stat" style={{ textDecoration: 'none', marginBottom: 0 }}><b>{s.receiptsCount}</b><span className="muted">Recibos emitidos</span></Link>
      </div>
      <div className="card stat"><span className="muted">Total orçado</span><b>{formatBRL(s.totalQuotedCents)}</b></div>

      <div className="stack" style={{ marginBottom: 12 }}>
        <Link className="btn btn-primary btn-block" to="/new/service">Novo orçamento de serviços</Link>
        <div className="grid2">
          <Link className="btn btn-dark" to="/new/parts">Orçamento de peças</Link>
          <Link className="btn btn-dark" to="/new/receipt">Novo recibo</Link>
        </div>
      </div>

      <div className="section-title"><h2 style={{ margin: 0 }}>Recentes</h2></div>
      <div className="card">
        {loading && <p className="muted">Carregando…</p>}
        {!loading && docs.length === 0 && <p className="muted">Nenhum documento ainda. Toque em “Novo orçamento” para começar.</p>}
        {docs.slice(0, 5).map((d) => <DocRow key={d.id} d={d} />)}
        {docs.length > 5 && <Link to="/docs?type=all" className="muted">Ver todos os documentos</Link>}
      </div>
    </div>
  )
}
