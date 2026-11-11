import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from './Button'

/** Small toast when a new service-worker version is ready (autoUpdate + manual refresh). */
export function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Periodically check for updates while the tab is open
      if (registration) {
        window.setInterval(() => {
          void registration.update()
        }, 60 * 60 * 1000)
      }
    },
  })

  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(needRefresh)
  }, [needRefresh])

  if (!visible) return null

  return (
    <div
      role="status"
      className="fixed inset-x-3 z-[100] flex items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-slate-100 shadow-lg sm:inset-x-auto sm:right-4 sm:max-w-sm"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <p>New version available. Refresh to update.</p>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="ghost"
          className="px-3 py-2"
          onClick={() => {
            setNeedRefresh(false)
            setVisible(false)
          }}
        >
          Later
        </Button>
        <Button
          className="px-3 py-2"
          onClick={() => {
            void updateServiceWorker(true)
          }}
        >
          Refresh
        </Button>
      </div>
    </div>
  )
}
