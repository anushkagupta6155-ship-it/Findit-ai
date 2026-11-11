import { useEffect, useMemo, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { Button } from './Button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const mq = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone = 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return mq || iosStandalone
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

const IOS_HINT_KEY = 'findit-ios-install-hint-dismissed'

/**
 * Android: Install button when beforeinstallprompt fires.
 * iOS: one-time Share → Add to Home Screen hint.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  const standalone = useMemo(() => isStandalone(), [])

  useEffect(() => {
    if (standalone) {
      setInstalled(true)
      return
    }

    function onBip(e: Event) {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }

    function onInstalled() {
      setInstalled(true)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)

    if (isIos() && !localStorage.getItem(IOS_HINT_KEY)) {
      setIosHint(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [standalone])

  if (installed || standalone) return null

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === 'accepted') {
      setInstalled(true)
    }
    setDeferred(null)
  }

  function dismissIos() {
    localStorage.setItem(IOS_HINT_KEY, '1')
    setIosHint(false)
  }

  if (deferred) {
    return (
      <div
        className="fixed left-3 right-3 z-[90] sm:left-auto sm:right-4 sm:w-80"
        style={{ bottom: 'max(4.5rem, calc(env(safe-area-inset-bottom) + 3.5rem))' }}
      >
        <Button fullWidth onClick={() => void install()} aria-label="Install FindIt AI app">
          <Download size={18} aria-hidden />
          Install app
        </Button>
      </div>
    )
  }

  if (iosHint) {
    return (
      <div
        className="fixed left-3 right-3 z-[90] rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-200 sm:left-auto sm:right-4 sm:w-80"
        style={{ bottom: 'max(4.5rem, calc(env(safe-area-inset-bottom) + 3.5rem))' }}
        role="status"
      >
        <div className="flex items-start justify-between gap-2">
          <p>
            Install on iPhone: tap <Share size={14} className="inline align-text-bottom" aria-hidden />{' '}
            <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
          </p>
          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-100"
            aria-label="Dismiss install hint"
            onClick={dismissIos}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  return null
}
