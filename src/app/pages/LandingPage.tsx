import { Navbar } from '@/app/components/landing/Navbar'
import { Hero } from '@/app/components/landing/Hero'
import { InstallGuide } from '@/app/components/landing/InstallGuide'
import { Features } from '@/app/components/landing/Features'
import { Pricing } from '@/app/components/landing/Pricing'
import { Footer } from '@/app/components/landing/Footer'

function Divider() {
  return (
    <div className="max-w-5xl mx-auto px-6">
      <div className="h-px bg-gradient-to-r from-transparent via-landing-border to-transparent" />
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-landing-bg font-[Inter,system-ui,-apple-system,sans-serif] text-landing-white antialiased scroll-smooth">
      <Navbar />
      <main>
        <Hero />
        <Divider />
        <InstallGuide />
        <Divider />
        <Features />
        <Divider />
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}
