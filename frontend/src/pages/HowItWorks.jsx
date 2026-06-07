import { Link } from 'react-router-dom'
import useScrollReveal from '../hooks/useScrollReveal'
import { ArrowRight, Shield, Zap, MapPin, Package, PawPrint, Users } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

function Step({ num, title, desc, isDark }) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center font-black text-white text-lg shrink-0 shadow-[0_0_20px_rgba(108,99,255,0.35)]">
        {num}
      </div>
      <div className="pt-2">
        <h4 className={`font-['Poppins'] font-semibold text-base mb-1 ${isDark ? 'text-white' : 'text-[#1E1B4B]'}`}>{title}</h4>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'}`}>{desc}</p>
      </div>
    </div>
  )
}

function FAQAccordion({ items, isDark }) {
  const [open, setOpen] = useState(null)
  const borderBase = isDark ? 'border-white/8' : 'border-[#E0E7FF]'
  const borderOpen = isDark ? 'border-[#13221B]/50' : 'border-[#13221B]/40'
  const btnText    = isDark ? 'text-white hover:bg-white/[0.02]' : 'text-[#1E1B4B] hover:bg-[#EEF2FF]'
  const answerText = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${open===i ? borderOpen : borderBase}`}>
          <button
            onClick={() => setOpen(open===i ? null : i)}
            className={`w-full flex justify-between items-center px-5 py-4 text-left text-sm font-semibold transition-colors ${btnText}`}
          >
            {item.q}
            <span className={`text-[#13221B] text-xl transition-transform ml-4 ${open===i ? 'rotate-45' : ''}`}>+</span>
          </button>
          <div className={`accordion-body ${open===i ? 'open' : ''}`}>
            <p className={`px-5 pb-4 text-sm leading-relaxed ${answerText}`}>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HowItWorks() {
  useScrollReveal()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const heroText  = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText   = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const mutedText = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const sectionA  = isDark ? 'bg-[#0F0F2A]' : 'bg-[#F8FAFF]'
  const sectionB  = isDark ? 'bg-[#07071A]' : 'bg-white'
  const cardBg    = isDark ? 'bg-[#16163A] border-white/8 hover:border-[#13221B]/30' : 'bg-white border-[#E0E7FF] hover:border-[#13221B]/30 shadow-sm hover:shadow-md'
  const iconBg    = isDark ? 'bg-[#13221B]/12 border-[#13221B]/20 text-[#2E7D59]' : 'bg-[#EEF2FF] border-[#C7D2FE] text-[#13221B]'
  const flowCardBg = isDark ? 'bg-[#16163A] border-white/8' : 'bg-white border-[#E0E7FF] shadow-md'

  const flows = [
    {
      title: 'Donating Items', color: 'from-[#13221B] to-[#2E7D59]', icon: <Package size={20} className="text-white" />, iconBig: <Package size={80} className="text-indigo-500 mx-auto" />,
      steps: [
        { num:'1', title: 'List Your Items', desc: 'Fill out a quick form with item category, condition, quantity, and location.' },
        { num:'2', title: 'Get Matched', desc: 'Our system matches your donation with verified recipients or NGOs nearby.' },
        { num:'3', title: 'Arrange Transfer', desc: 'Choose pickup or drop-off. Coordinate directly with the recipient.' },
        { num:'4', title: 'Track & Confirm', desc: 'Receive confirmation and see the real impact of your donation.' },
      ]
    },
    {
      title: 'Animal Welfare', color: 'from-[#3D6A53] to-[#FF8FA3]', icon: <PawPrint size={20} className="text-white" />, iconBig: <PawPrint size={80} className="text-pink-500 mx-auto" />,
      steps: [
        { num:'1', title: 'Report or Browse', desc: 'Report a distressed animal or browse animals needing help near you.' },
        { num:'2', title: 'Connect with Rescue', desc: 'NGOs and verified rescuers are notified instantly.' },
        { num:'3', title: 'Support or Adopt', desc: 'Contribute to rescue funds, foster, or complete an adoption.' },
        { num:'4', title: 'Follow Up', desc: 'Get updates on the animal you helped rescue or adopt.' },
      ]
    },
    {
      title: 'Volunteering', color: 'from-[#43E97B] to-[#38F9D7]', icon: <Users size={20} className="text-white" />, iconBig: <Users size={80} className="text-green-500 mx-auto" />,
      steps: [
        { num:'1', title: 'Browse Campaigns', desc: 'Search campaigns by location, type, or date to find the right fit.' },
        { num:'2', title: 'Join or Create', desc: 'Join an existing campaign or start your own community initiative.' },
        { num:'3', title: 'Coordinate', desc: 'Connect with organizers, get event details, and confirm participation.' },
        { num:'4', title: 'Make Impact', desc: 'Volunteer, record your hours, and earn your impact badge.' },
      ]
    },
  ]

  const features = [
    { icon: <Shield size={22}/>, title: 'Verified Users & NGOs', desc: 'Every NGO and major user goes through verification before being listed.' },
    { icon: <MapPin size={22}/>, title: 'Real-Time Location', desc: 'Hyperlocal matching connects you with the nearest donors, rescuers, and volunteers.' },
    { icon: <Zap size={22}/>, title: 'Instant Notifications', desc: 'Get alerted the moment a match is found or a campaign needs help.' },
  ]

  const faqs = [
    { q: 'Do I need to create an account?', a: 'Yes, a free account is required to donate, volunteer, or rescue animals. Registration takes under 2 minutes.' },
    { q: 'How fast does matching happen?', a: 'Most donations and rescue requests are matched within 30 minutes in major cities.' },
    { q: 'Can NGOs create their own campaigns?', a: 'Yes! Registered NGOs can create and manage campaigns, post animals, and accept donations directly.' },
    { q: 'Is there an app?', a: 'Currently web-only. A mobile app is on our roadmap. The website is fully responsive for mobile use.' },
  ]

  return (
    <div className="page-enter">
      <section className="page-hero-bg pt-32 pb-16 text-center relative overflow-hidden">
        <div className="max-w-[800px] mx-auto px-4 relative z-10">
          <div className="section-label mb-4">Simple & Secure</div>
          <h1 className={`font-['Poppins'] font-black text-5xl sm:text-6xl mb-4 ${heroText}`}>
            How Helping Hands <span className="gradient-text">Works</span>
          </h1>
          <p className={`text-lg max-w-lg mx-auto ${subText}`}>Making community giving simple, secure, and local — for everyone.</p>
        </div>
      </section>

      {/* Three flows */}
      <section className={`py-24 ${sectionB}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-16">
            {flows.map((flow, fi) => (
              <div key={fi} className={`grid lg:grid-cols-2 gap-10 items-center ${fi % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className={fi % 2 === 1 ? 'reveal-right' : 'reveal-left'}>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${flow.color} text-white text-sm font-bold mb-5 opacity-90`}>
                    {flow.icon} {flow.title}
                  </div>
                  <div className="flex flex-col gap-6">
                    {flow.steps.map((s, i) => <Step key={i} {...s} isDark={isDark} />)}
                  </div>
                </div>
 
                <div className={`${fi % 2 === 1 ? 'reveal-left' : 'reveal-right'} border rounded-3xl p-8 text-center flex flex-col items-center justify-center ${flowCardBg}`}>
                  <div className="mb-4">{flow.iconBig}</div>
                  <h3 className={`font-['Poppins'] font-bold text-xl mb-2 ${heroText}`}>{flow.title}</h3>
                  <p className={`text-sm ${mutedText}`}>
                    A streamlined process to get help where it's needed most, fast.
                  </p>
                  <Link
                    to={fi===0 ? '/donate' : fi===1 ? '/animals' : '/volunteer'}
                    className={`mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r ${flow.color} text-white font-semibold text-sm hover:-translate-y-0.5 transition-all`}
                  >
                    Get Started <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={`py-16 ${sectionA}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-6 reveal">
            {features.map((f, i) => (
              <div key={i} className={`border rounded-2xl p-6 text-center hover:-translate-y-1 transition-all ${cardBg}`}>
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mx-auto mb-4 ${iconBg}`}>{f.icon}</div>
                <h4 className={`font-['Poppins'] font-semibold text-base mb-2 ${heroText}`}>{f.title}</h4>
                <p className={`text-sm ${mutedText}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#13221B] to-[#3D6A53]" />
        <div className="relative z-10 text-center max-w-[600px] mx-auto px-4 reveal">
          <h2 className="font-['Poppins'] font-black text-4xl text-white mb-4">
            Ready to Get Started?
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link to="/donate" className="px-6 py-3 rounded-full bg-white text-[#13221B] font-bold text-sm hover:-translate-y-1 hover:shadow-xl transition-all">
              Donate Now
            </Link>
            <Link to="/animals" className="px-6 py-3 rounded-full bg-white text-[#13221B] font-bold text-sm hover:-translate-y-1 hover:shadow-xl transition-all">
              Help Animals
            </Link>
            <Link to="/volunteer" className="px-6 py-3 rounded-full border-2 border-white/60 text-white font-bold text-sm hover:bg-white/10 hover:-translate-y-1 transition-all">
              Become a Volunteer
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={`py-20 ${sectionB}`}>
        <div className="max-w-[700px] mx-auto px-4 sm:px-6">
          <h2 className={`font-['Poppins'] font-black text-3xl text-center mb-8 ${heroText}`}>
            Quick <span className="gradient-text">Questions</span>
          </h2>
          <div className="reveal"><FAQAccordion items={faqs} isDark={isDark} /></div>
        </div>
      </section>
    </div>
  )
}
