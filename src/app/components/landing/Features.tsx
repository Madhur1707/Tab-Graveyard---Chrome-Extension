import { motion } from 'motion/react'
import { Ghost, Search, Clock, Infinity, Globe, Sparkles } from 'lucide-react'
import { SectionWrapper } from './SectionWrapper'
import { Badge } from '@/app/components/ui/badge'

const features = [
  {
    icon: Ghost,
    title: 'Auto-save closed tabs',
    description: 'Every tab you close is instantly captured with its title, URL, and favicon.',
    pro: false,
  },
  {
    icon: Search,
    title: 'Keyword search',
    description: 'Find any tab in seconds by searching titles and domains. Results as you type.',
    pro: false,
  },
  {
    icon: Clock,
    title: '30-day history',
    description: 'Access your last 30 days of closed tabs, stored locally on your device.',
    pro: false,
  },
  {
    icon: Infinity,
    title: 'Unlimited history',
    description: 'Keep your entire tab history forever. Never worry about losing older tabs.',
    pro: true,
  },
  {
    icon: Globe,
    title: 'Cross-device sync',
    description: 'Access your graveyard from any device. Your tabs follow you everywhere.',
    pro: true,
  },
  {
    icon: Sparkles,
    title: 'AI semantic search',
    description: 'Search by meaning, not just keywords. Find tabs even when you forgot the title.',
    pro: true,
  },
]

export function Features() {
  return (
    <SectionWrapper id="features" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-medium text-landing-accent uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-landing-white tracking-tight">
            Everything you need
          </h2>
          <p className="text-sm text-landing-muted mt-2">
            Powerful tab management with zero effort
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              <div className="group rounded-xl border border-landing-border bg-landing-surface/50 hover:bg-landing-surface hover:border-landing-border-light transition-all p-5 h-full">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-landing-accent/10 border border-landing-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <feature.icon size={18} className="text-landing-accent" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-medium text-landing-white">{feature.title}</h3>
                      {feature.pro && (
                        <Badge className="bg-landing-accent/10 text-landing-accent border-landing-accent/25 text-[10px] px-1.5 py-0">
                          Pro
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-landing-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
