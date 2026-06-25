import { motion } from 'motion/react'
import { Check, Sparkles } from 'lucide-react'
import { SectionWrapper } from './SectionWrapper'
import { Badge } from '../..//components/ui/badge'

const freeFeatures = [
  'Auto-save closed tabs',
  'Keyword search',
  '30-day local history',
  'Up to 500 tabs',
]

const proFeatures = [
  'Everything in Free',
  'Unlimited tab history',
  'Cross-device sync',
  'AI semantic search',
  'Priority support',
]

function FeatureItem({ text, accent }: { text: string; accent?: boolean }) {
  return (
    <li className="flex items-center gap-2.5">
      <div className="w-4 h-4 rounded-full bg-landing-accent/12 flex items-center justify-center shrink-0">
        {accent ? (
          <Sparkles size={9} className="text-landing-accent" strokeWidth={2.5} />
        ) : (
          <Check size={9} className="text-landing-accent" strokeWidth={2.5} />
        )}
      </div>
      <span className="text-sm text-landing-white-dim">{text}</span>
    </li>
  )
}

export function Pricing() {
  return (
    <SectionWrapper id="pricing" className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-medium text-landing-accent uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-landing-white tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-sm text-landing-muted mt-2">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Free plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="rounded-xl border border-landing-border bg-landing-surface/50 p-6 h-full flex flex-col">
              <div className="mb-6">
                <h3 className="text-base font-semibold text-landing-white">Free</h3>
                <p className="text-xs text-landing-muted mt-1">For casual tab savers</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-landing-white">$0</span>
                  <span className="text-sm text-landing-muted ml-1">/forever</span>
                </div>
              </div>

              <div className="h-px bg-landing-border mb-5" />

              <ul className="space-y-3 flex-1">
                {freeFeatures.map((f) => (
                  <FeatureItem key={f} text={f} />
                ))}
              </ul>

              <a
                href="#install-guide"
                className="block w-full mt-6 text-center text-xs text-landing-muted hover:text-landing-white transition-colors py-2"
              >
                Get started &rarr;
              </a>
            </div>
          </motion.div>

          {/* Pro plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="rounded-xl border border-landing-accent/30 bg-landing-surface/50 p-6 h-full flex flex-col relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-landing-accent/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative mb-6">
                <div className="flex items-center gap-2.5 mb-1">
                  <h3 className="text-base font-semibold text-landing-white">Pro</h3>
                  <Badge className="bg-landing-accent text-white border-transparent text-[10px] px-1.5 py-0">
                    Popular
                  </Badge>
                </div>
                <p className="text-xs text-landing-muted mt-1">For power users</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-landing-white">$3</span>
                  <span className="text-sm text-landing-muted ml-1">/month</span>
                </div>
              </div>

              <div className="h-px bg-landing-border mb-5" />

              <ul className="space-y-3 flex-1 relative">
                {proFeatures.map((f) => (
                  <FeatureItem key={f} text={f} accent={f === 'Everything in Free'} />
                ))}
              </ul>

              <a
                href="#install-guide"
                className="block w-full mt-6 text-center bg-landing-accent hover:bg-landing-accent-light text-white rounded-lg h-10 text-sm font-semibold shadow-lg shadow-landing-accent/20 relative leading-10 transition-colors"
              >
                Get started &rarr;
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </SectionWrapper>
  )
}
