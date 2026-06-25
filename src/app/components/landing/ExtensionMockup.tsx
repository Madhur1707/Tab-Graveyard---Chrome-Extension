import { motion } from 'motion/react'
import { Search, Settings, ExternalLink, Sparkles } from 'lucide-react'

const mockTabs = [
  { title: 'React Documentation - Getting Started', domain: 'react.dev', time: '2m ago', color: '#61dafb' },
  { title: 'GitHub - tab-graveyard/extension', domain: 'github.com', time: '15m ago', color: '#f97316' },
  { title: 'Stack Overflow - useEffect cleanup', domain: 'stackoverflow.com', time: '1h ago', color: '#f59e0b' },
  { title: 'Figma - Dashboard Design v2', domain: 'figma.com', time: '3h ago', color: '#a855f7' },
  { title: 'Vercel - Deployment Dashboard', domain: 'vercel.com', time: '5h ago', color: '#f1f1f3' },
]

function MockFavicon({ color, domain }: { color: string; domain: string }) {
  return (
    <div
      className="w-[24px] h-[24px] rounded flex items-center justify-center shrink-0 text-[9px] font-bold"
      style={{
        background: color + '18',
        border: `1px solid ${color}30`,
        color,
      }}
    >
      {domain.charAt(0).toUpperCase()}
    </div>
  )
}

export function ExtensionMockup() {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
    >
      <div className="w-[360px] rounded-xl border border-landing-border bg-landing-surface shadow-2xl shadow-black/40 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-landing-border">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="w-4 h-4" />
            <span className="text-landing-white text-xs font-semibold tracking-tight">Tab Graveyard</span>
          </div>
          <Settings size={11} className="text-landing-muted" strokeWidth={1.75} />
        </div>

        {/* Search bar */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 bg-landing-bg rounded-md px-2.5 py-1.5 border border-landing-border">
            <Search size={11} className="text-landing-muted" strokeWidth={2} />
            <span className="text-landing-muted text-xs">Search your closed tabs...</span>
          </div>
        </div>

        {/* Tab rows */}
        <div>
          {mockTabs.map((tab, i) => (
            <motion.div
              key={tab.domain}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.35 }}
            >
              <div className="flex items-center gap-2.5 px-3.5 h-[44px]">
                <MockFavicon color={tab.color} domain={tab.domain} />
                <div className="flex-1 min-w-0">
                  <div className="text-landing-white text-xs truncate leading-tight">{tab.title}</div>
                  <div className="text-landing-muted/60 text-[10px] mt-px">{tab.domain}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-landing-muted/40">{tab.time}</span>
                  <ExternalLink size={10} className="text-landing-accent/40" strokeWidth={2} />
                </div>
              </div>
              {i < mockTabs.length - 1 && (
                <div className="h-px bg-landing-border/60 mx-3.5" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-landing-border">
          <span className="text-landing-muted/60 text-[10px]">5 tabs saved</span>
          <span className="flex items-center gap-1 text-landing-accent text-[10px] font-semibold">
            <Sparkles size={10} strokeWidth={1.75} /> Pro
          </span>
        </div>
      </div>
    </motion.div>
  )
}
