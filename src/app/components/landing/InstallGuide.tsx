import { motion } from 'motion/react'
import { Download, FolderArchive, Puzzle, ToggleRight, MousePointerClick, Ghost, ChevronDown } from 'lucide-react'
import { SectionWrapper } from './SectionWrapper'
import { Button } from '@/app/components/ui/button'

const DOWNLOAD_URL = '/tab-graveyard.zip'

const steps = [
  {
    icon: Download,
    title: 'Download the ZIP',
    description: 'Click the button below to download the Tab Graveyard extension package.',
    detail: 'You\'ll get a .zip file — save it anywhere on your computer.',
    color: '#6366f1',
  },
  {
    icon: FolderArchive,
    title: 'Unzip the folder',
    description: 'Extract the downloaded ZIP file to a permanent location.',
    detail: 'Right-click the ZIP → "Extract All" (Windows) or double-click (Mac). Don\'t delete this folder after installing.',
    color: '#818cf8',
  },
  {
    icon: Puzzle,
    title: 'Open Chrome Extensions',
    description: 'Navigate to your Chrome extensions page.',
    detail: 'Type chrome://extensions in your address bar and press Enter. Or go to Menu → Extensions → Manage Extensions.',
    code: 'chrome://extensions',
    color: '#6366f1',
  },
  {
    icon: ToggleRight,
    title: 'Enable Developer Mode',
    description: 'Toggle on Developer Mode in the top-right corner.',
    detail: 'This allows Chrome to load extensions that aren\'t from the Web Store. You\'ll see new buttons appear.',
    color: '#818cf8',
  },
  {
    icon: MousePointerClick,
    title: 'Load the extension',
    description: 'Click "Load unpacked" and select the extracted folder.',
    detail: 'Select the folder that contains the manifest.json file. Tab Graveyard will appear in your extensions list.',
    color: '#6366f1',
  },
  {
    icon: Ghost,
    title: 'Start using Tab Graveyard',
    description: 'Click the Tab Graveyard icon in your toolbar to open the side panel.',
    detail: 'Close any tab and it will automatically appear in your graveyard. Search, restore, and never lose a tab again!',
    color: '#818cf8',
  },
]

function StepConnector() {
  return (
    <div className="flex justify-center py-1">
      <ChevronDown size={16} className="text-landing-accent/25" strokeWidth={1.5} />
    </div>
  )
}

export function InstallGuide() {
  return (
    <SectionWrapper id="install-guide" className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-medium text-landing-accent uppercase tracking-widest mb-3">Installation</p>
          <h2 className="text-2xl md:text-3xl font-semibold text-landing-white tracking-tight">
            Get started in minutes
          </h2>
          <p className="text-sm text-landing-muted mt-2 max-w-lg mx-auto">
            Tab Graveyard isn't on the Chrome Web Store yet. Follow these steps to install it manually — it only takes a minute.
          </p>
        </div>

        {/* Steps */}
        <div>
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              <div className="group relative flex gap-5 rounded-xl border border-landing-border/60 bg-landing-surface/30 hover:bg-landing-surface/60 hover:border-landing-border-light p-5 transition-all">
                {/* Step number + icon */}
                <div className="shrink-0">
                  <div
                    className="w-[46px] h-[46px] rounded-xl flex items-center justify-center relative"
                    style={{ background: step.color + '12', border: `1px solid ${step.color}25` }}
                  >
                    <step.icon size={20} style={{ color: step.color }} strokeWidth={1.75} />
                    <span
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: step.color, color: '#fff' }}
                    >
                      {i + 1}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-sm font-semibold text-landing-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-landing-muted leading-relaxed">
                    {step.description}
                  </p>
                  <p className="text-xs text-landing-muted/60 leading-relaxed mt-1.5">
                    {step.detail}
                  </p>
                  {step.code && (
                    <code className="inline-block mt-2 px-3 py-1.5 rounded-md bg-landing-bg border border-landing-border text-xs text-landing-accent font-mono select-all">
                      {step.code}
                    </code>
                  )}
                </div>
              </div>

              {/* Connector chevron between steps */}
              {i < steps.length - 1 && <StepConnector />}
            </motion.div>
          ))}
        </div>

        {/* Download CTA */}
        <motion.div
          className="mt-10 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="rounded-xl border border-landing-accent/20 bg-landing-accent/[0.04] p-6">
            <p className="text-sm text-landing-white font-medium mb-1">Ready to get started?</p>
            <p className="text-xs text-landing-muted mb-4">Download the extension and follow the steps above.</p>
            <Button
              asChild
              className="bg-landing-accent hover:bg-landing-accent-light text-white rounded-lg px-6 h-10 text-sm font-semibold shadow-lg shadow-landing-accent/20 gap-2"
            >
              <a href={DOWNLOAD_URL} download>
                <Download size={15} strokeWidth={2} />
                Download Tab Graveyard (.zip)
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
