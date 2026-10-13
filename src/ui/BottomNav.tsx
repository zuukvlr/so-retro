import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

const ITEMS = [
  { to: '/', label: 'Início', icon: 'home', end: true },
  { to: '/docs', label: 'Orçamentos', icon: 'doc' },
  { to: '/receipts', label: 'Recibos', icon: 'receipt' },
  { to: '/clients', label: 'Clientes', icon: 'users' },
  { to: '/settings', label: 'Config.', icon: 'gear' },
] as const

const NEW = [
  { to: '/new/parts', label: 'Orçamento de peças' },
  { to: '/new/service', label: 'Orçamento de serviços' },
  { to: '/new/receipt', label: 'Recibo' },
]

export function BottomNav() {
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  return (
    <>
      <nav className="bottom-nav" aria-label="Navegação principal">
        {ITEMS.map((i) => (
          <NavLink key={i.to} to={i.to} end={'end' in i} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon name={i.icon} />
            <span>{i.label}</span>
          </NavLink>
        ))}
      </nav>
      <button className="fab" aria-label="Novo documento" onClick={() => setOpen(true)}>+</button>
      {open && (
        <div className="sheet-back" onClick={() => setOpen(false)}>
          <div className="sheet stack" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Novo documento">
            <h2>Novo documento</h2>
            {NEW.map((n) => (
              <button
                key={n.to}
                className="btn btn-block"
                onClick={() => {
                  setOpen(false)
                  nav(n.to)
                }}
              >
                {n.label}
              </button>
            ))}
            <button className="btn btn-block" onClick={() => setOpen(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </>
  )
}
