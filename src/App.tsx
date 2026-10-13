import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { repo } from './db/repo'
import { requestPersistence } from './pwa/storage'
import { BottomNav } from './ui/BottomNav'
import { applyTheme } from './ui/theme'
import { ClientsPage } from './ui/clients/ClientsPage'
import { Dashboard } from './ui/docs/Dashboard'
import { DocDetail } from './ui/docs/DocDetail'
import { DocList } from './ui/docs/DocList'
import { QuoteForm } from './ui/quotes/QuoteForm'
import { ReceiptForm } from './ui/receipts/ReceiptForm'
import { SettingsPage } from './ui/settings/SettingsPage'
import { UiProvider } from './ui/UiProvider'
import { useLoad } from './ui/util'
import type { QuoteDoc, ReceiptDoc } from './domain/types'

function EditPage() {
  const { id = '' } = useParams()
  const { data, loading } = useLoad(() => repo.getDoc(id), [id])
  if (loading) return <div className="page muted">Carregando…</div>
  if (!data) return <Navigate to="/" replace />
  return data.type === 'receipt' ? <ReceiptForm key={id} existing={data as ReceiptDoc} /> : <QuoteForm key={id} existing={data as QuoteDoc} />
}

function useTheme() {
  useEffect(() => {
    repo.getSettings().then((s) => applyTheme(s.theme))
  }, [])
}

export default function App() {
  useTheme()
  useEffect(() => { void requestPersistence() }, [])
  return (
    <HashRouter>
      <UiProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/docs" element={<DocList defaultType="quotes" />} />
          <Route path="/receipts" element={<DocList defaultType="receipt" />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/new/parts" element={<QuoteForm key="parts" type="parts_quote" />} />
          <Route path="/new/service" element={<QuoteForm key="service" type="service_quote" />} />
          <Route path="/new/receipt" element={<ReceiptForm key="new-receipt" />} />
          <Route path="/doc/:id" element={<DocDetail />} />
          <Route path="/edit/:id" element={<EditPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </UiProvider>
    </HashRouter>
  )
}
