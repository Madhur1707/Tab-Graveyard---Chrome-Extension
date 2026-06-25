import { motion } from 'motion/react'
import { Download, Ghost, Search } from 'lucide-react'
import { SectionWrapper } from './SectionWrapper'

const steps = [
  {
    icon: Download,
    title: 'Install the extension',
    description: 'Add Tab Graveyard to Chrome in one click. No account needed to get started.',
  },
  {
    icon: Ghost,
    title: 'Close tabs freely',
    description: 'Every tab you close is automatically saved. No manual bookmarking, zero effort.',
  },
  {
    icon: Search,
    title: 'Search & restore',
    description: 'Find any closed tab instantly by keyword or with AI-powered semantic search.',
  },
]

export function HowItWorks() {
  return (
    <SectionWrapper id="how-it-works" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-medium text-landing-accent uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-landing-white tracking-tight">
            Three steps, zero friction
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="relative flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
            >
              {/* Step number */}
              <div className="w-10 h-10 rounded-full bg-landing-accent/10 border border-landing-accent/25 flex items-center justify-center mb-5">
                <span className="text-landing-accent font-semibold text-xs">{i + 1}</span>
              </div>

              {/* Icon */}
              <div className="w-11 h-11 rounded-lg bg-landing-surface border border-landing-border flex items-center justify-center mb-4">
                <step.icon size={20} className="text-landing-accent" strokeWidth={1.75} />
              </div>

              <h3 className="text-sm font-semibold text-landing-white mb-2">
                {step.title}
              </h3>
              <p className="text-landing-muted text-sm leading-relaxed max-w-[240px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
