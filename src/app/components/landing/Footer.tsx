export function Footer() {
  return (
    <footer className="border-t border-landing-border/60 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="Tab Graveyard" className="w-6 h-6" />
          <span className="text-landing-white text-sm font-semibold tracking-tight">
            Tab Graveyard
          </span>
        </div>

        <nav className="flex items-center gap-5">
          <a href="#features" className="text-xs text-landing-muted hover:text-landing-white transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-xs text-landing-muted hover:text-landing-white transition-colors">
            Pricing
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-landing-muted hover:text-landing-white transition-colors"
          >
            GitHub
          </a>
          <a
            href="mailto:support@tabgraveyard.com"
            className="text-xs text-landing-muted hover:text-landing-white transition-colors"
          >
            Contact
          </a>
        </nav>

        <p className="text-xs text-landing-muted/40">
          &copy; {new Date().getFullYear()} Tab Graveyard
        </p>
      </div>
    </footer>
  )
}
