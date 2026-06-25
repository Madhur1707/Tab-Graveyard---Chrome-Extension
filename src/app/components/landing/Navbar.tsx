import { useState, useEffect } from 'react'
import { cn } from '@/app/components/ui/utils'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-landing-bg/80 backdrop-blur-xl border-b border-landing-border'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <img
            src="/favicon.svg"
            alt="Tab Graveyard"
            className="w-7 h-7 group-hover:scale-110 transition-transform"
          />
          <span className="text-landing-white text-sm font-semibold tracking-tight">
            Tab Graveyard
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          <a href="#features" className="text-xs text-landing-muted hover:text-landing-white transition-colors">
            Features
          </a>
          <a href="#install-guide" className="text-xs text-landing-muted hover:text-landing-white transition-colors">
            Install
          </a>
          <a href="#pricing" className="text-xs text-landing-muted hover:text-landing-white transition-colors">
            Pricing
          </a>
        </nav>

        {/* Get started link (not a download button) */}
        <div className="hidden md:block">
          <a
            href="#install-guide"
            className="text-xs text-landing-accent hover:text-landing-accent-light font-medium transition-colors"
          >
            Get Started &rarr;
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-landing-muted hover:text-landing-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <div className="space-y-1.5">
            <div className={cn('w-5 h-0.5 bg-current transition-all', mobileOpen && 'rotate-45 translate-y-2')} />
            <div className={cn('w-5 h-0.5 bg-current transition-all', mobileOpen && 'opacity-0')} />
            <div className={cn('w-5 h-0.5 bg-current transition-all', mobileOpen && '-rotate-45 -translate-y-2')} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-landing-bg/95 backdrop-blur-xl border-b border-landing-border px-6 pb-6 pt-2">
          <nav className="flex flex-col gap-4">
            <a href="#features" className="text-sm text-landing-muted hover:text-landing-white transition-colors" onClick={() => setMobileOpen(false)}>
              Features
            </a>
            <a href="#install-guide" className="text-sm text-landing-muted hover:text-landing-white transition-colors" onClick={() => setMobileOpen(false)}>
              Install
            </a>
            <a href="#pricing" className="text-sm text-landing-muted hover:text-landing-white transition-colors" onClick={() => setMobileOpen(false)}>
              Pricing
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
