/** Pede ao navegador para não apagar os dados do app (importante no Safari/iOS). */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist()
  } catch {
    /* ignorado */
  }
  return false
}

export async function isPersisted(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted) return await navigator.storage.persisted()
  } catch {
    /* ignorado */
  }
  return false
}

export const BACKUP_WARN_DAYS = 14

/** true quando nunca houve backup ou o último passou de N dias. */
export function backupIsStale(lastBackupAt: string | undefined, now: Date = new Date(), days = BACKUP_WARN_DAYS): boolean {
  if (!lastBackupAt) return true
  const t = Date.parse(lastBackupAt)
  if (Number.isNaN(t)) return true
  return now.getTime() - t > days * 86_400_000
}

export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true
}
