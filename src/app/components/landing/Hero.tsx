import { motion } from 'motion/react'
import { Sparkles, Download } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { ExtensionMockup } from './ExtensionMockup'

const DOWNLOAD_URL = '/tab-graveyard.zip'

export function Hero() {
  return (
    <section className="relative pt-28 pb-20 px-6 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.5) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />
      {/* Radial fade so grid fades toward edges */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,transparent_30%,#0f0f10_100%)]" />

      {/* Accent glows */}
      <div className="absolute top-[15%] right-[20%] w-[420px] h-[420px] bg-landing-accent/[0.07] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[280px] h-[280px] bg-indigo-500/[0.04] rounded-full blur-[80px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left — text */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Badge
              variant="outline"
              className="border-landing-border-light text-landing-white-dim bg-landing-surface/60 backdrop-blur-sm px-3 py-1 text-xs font-medium gap-1.5 mb-6"
            >
              <Sparkles size={11} className="text-landing-accent" strokeWidth={2} />
              Now with AI-Powered Search
            </Badge>
          </motion.div>

          <motion.h1
            className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.2] text-landing-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            Never lose a{' '}
            <span className="bg-gradient-to-r from-landing-accent to-landing-accent-light bg-clip-text text-transparent">
              closed tab
            </span>{' '}
            again
          </motion.h1>

          <motion.p
            className="text-[15px] text-landing-muted mt-4 max-w-md leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Tab Graveyard automatically saves every tab you close.
            Search, restore, and sync your browsing history across all your devices.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
          >
            <Button
              asChild
              className="bg-landing-accent hover:bg-landing-accent-light text-white rounded-lg px-6 h-10 text-sm font-semibold shadow-lg shadow-landing-accent/20 gap-2"
            >
              <a href={DOWNLOAD_URL} download>
                <Download size={15} strokeWidth={2} />
                Download Extension
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-landing-border-light text-landing-white-dim hover:bg-landing-surface hover:text-landing-white rounded-lg px-6 h-10 text-sm font-medium bg-transparent"
            >
              <a href="#install-guide">Installation guide</a>
            </Button>
          </motion.div>

          <motion.div
            className="flex items-center gap-4 mt-6 text-xs text-landing-muted/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-green-500" />
              Free forever
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-green-500" />
              No account required
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-landing-accent" />
              Pro available
            </span>
          </motion.div>
        </div>

        {/* Right — mockup */}
        <motion.div
          className="flex justify-center lg:justify-end"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <ExtensionMockup />
        </motion.div>
      </div>
    </section>
  )
}
