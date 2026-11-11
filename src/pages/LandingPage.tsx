import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BrandMark } from '../components/BrandMark'
import { Button } from '../components/Button'

const OBJECTS = ['Wallets', 'Keys', 'Earbuds', 'Bags', 'Watches', 'Books', 'Glasses', 'ID cards']

export function LandingPage() {
  return (
    <div className="relative min-h-dvh bg-slate-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <nav className="mb-10 flex items-center justify-between border-b border-slate-800 pb-4">
          <BrandMark size="md" />
          <a href="#how-it-works" className="text-sm text-slate-400 no-underline hover:text-slate-200">
            How it works
          </a>
        </nav>

        <section className="flex flex-1 flex-col justify-center pb-8 pt-2 text-left">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            Lost object finder
          </p>
          <h1 className="mt-3 max-w-xl font-display text-3xl font-bold leading-tight text-slate-50 sm:text-4xl">
            Point your camera at the area where you think you dropped it.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-300">
            Add a photo of the item, scan nearby, and we’ll highlight things that look similar. You
            decide if it’s yours — we only show possible matches.
          </p>

          <div className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
            <Link to="/upload" className="no-underline sm:flex-1">
              <Button fullWidth className="text-base">
                Find my lost item
                <ArrowRight size={18} aria-hidden />
              </Button>
            </Link>
            <a href="#how-it-works" className="no-underline sm:flex-1">
              <Button fullWidth variant="secondary">
                How it works
              </Button>
            </a>
          </div>

          <figure className="mt-10 max-w-xl overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
            <img
              src="/samples/wallet.jpg"
              alt="Example reference photo of a dark wallet on a wooden surface"
              className="aspect-[16/10] w-full object-cover"
            />
            <figcaption className="border-t border-slate-800 px-3 py-2 text-xs text-slate-500">
              Example: crop a clear photo of the item, then scan the room or street.
            </figcaption>
          </figure>
        </section>

        <section id="how-it-works" className="mt-2 space-y-6 border-t border-slate-800 pt-10 text-left">
          <h2 className="font-display text-2xl font-bold text-slate-50">How it works</h2>
          <ol className="space-y-4">
            {[
              'Add one to three photos of the item (or a product image from online).',
              'Crop so the photo shows mainly that object.',
              'Scan slowly. When something looks close enough, we ask you to confirm.',
            ].map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-slate-300">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-900 font-display text-sm font-bold text-amber-500">
                  {i + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>

          <div>
            <p className="mb-3 text-sm font-medium text-slate-200">Useful for</p>
            <ul className="flex flex-wrap gap-2">
              {OBJECTS.map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs leading-relaxed text-slate-500">
            Similar items can look alike on camera. Always check with your own eyes before picking
            something up.
          </p>
        </section>
      </div>
    </div>
  )
}
