import { useState } from 'react'
import useScrollReveal from '../hooks/useScrollReveal'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const faqCategories = [
  {
    category: 'General', icon: '💡',
    items: [
      { q:'What is Helping Hands?', a:'Helping Hands is a community platform connecting donors, volunteers, NGOs, and animal welfare organizations to create real local impact.' },
      { q:'Is Helping Hands free?', a:'Yes! The platform is completely free for donors, volunteers, and recipients. NGOs also register for free.' },
      { q:'How do I get started?', a:'Create a free account, browse donations or campaigns near you, and start contributing!' },
    ]
  },
  {
    category: 'Donations', icon: '📦',
    items: [
      { q:'What can I donate?', a:'Clothes, food (sealed/perishable), books, toys, household goods, electronics in working condition, and more.' },
      { q:'How is my donation tracked?', a:'Every donation has a status (Pending → Accepted → Picked Up → Delivered). You receive notifications at each stage.' },
      { q:'Can I donate money to an NGO?', a:'Yes! Visit the NGOs section and choose Donate to NGO. Select the NGO and enter your amount.' },
      { q:'Is my financial donation tax-deductible?', a:'Verified NGOs issue 80G certificates. Download them from your profile after donation.' },
    ]
  },
  {
    category: 'Animal Welfare', icon: '🐾',
    items: [
      { q:'How do I report an injured animal?', a:'Go to Animal Welfare → Rescue & Shelter. Fill the report form with a description and your location.' },
      { q:'How fast does rescue happen?', a:'Within 30–60 minutes in covered cities. Response varies by location and volunteer availability.' },
      { q:'How do I adopt a pet?', a:'Browse Adopt a Pet, find an animal, click Adopt, and the shelter will contact you for the meet-and-greet.' },
      { q:'Can I donate food for animals?', a:'Yes! Donate animal food through the Item Donation section or sponsor a feeding station.' },
    ]
  },
  {
    category: 'NGOs', icon: '🏢',
    items: [
      { q:'How does NGO verification work?', a:'Submit registration documents. Our team manually verifies and typically approves within 3–5 days.' },
      { q:'Can NGOs post campaigns?', a:'Yes! Registered and verified NGOs can create campaigns, post animals, and manage donations.' },
      { q:'How do NGOs receive donations?', a:'Monetary donations are transferred via verified payment gateways. Item donations are coordinated directly.' },
    ]
  },
  {
    category: 'Volunteering', icon: '🙌',
    items: [
      { q:'Do I need skills to volunteer?', a:'No special skills needed for most campaigns. Organizers guide participants on the day.' },
      { q:'Can I create my own campaign?', a:'Yes! Any registered user can create and manage volunteer campaigns.' },
      { q:'How do I track my volunteer hours?', a:'Your profile dashboard automatically logs campaign participations and hours.' },
    ]
  },
  {
    category: 'Security & Privacy', icon: '🔐',
    items: [
      { q:'Is my data safe?', a:'We use JWT authentication, bcrypt password hashing, and HTTPS encryption. Your data is never sold.' },
      { q:'How is payment secured?', a:'All financial transactions go through PCI-compliant payment gateways.' },
      { q:'Can I delete my account?', a:'Yes. Contact support@helpinghands.org and your account will be fully deleted within 30 days.' },
    ]
  },
]

function Accordion({ items, isDark }) {
  const [open, setOpen] = useState(null)
  const borderBase = isDark ? 'border-white/8' : 'border-[#E0E7FF]'
  const borderOpen = isDark ? 'border-[#13221B]/50' : 'border-[#13221B]/40'
  const btnText    = isDark ? 'text-white hover:bg-white/[0.02]' : 'text-[#1E1B4B] hover:bg-[#EEF2FF]'
  const answerText = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className={`border rounded-xl overflow-hidden transition-all duration-300 ${open===i ? borderOpen : borderBase}`}>
          <button
            onClick={() => setOpen(open===i ? null : i)}
            className={`w-full flex justify-between items-center px-5 py-4 text-left text-sm font-semibold transition-colors ${btnText}`}
          >
            {item.q} <span className={`text-[#13221B] text-xl ml-4 ${open===i ? 'rotate-45' : ''} transition-transform shrink-0`}>+</span>
          </button>
          <div className={`accordion-body ${open===i ? 'open' : ''}`}>
            <p className={`px-5 pb-4 text-sm leading-relaxed ${answerText}`}>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FAQ() {
  useScrollReveal()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [activeCategory, setActiveCategory] = useState('All')

  const rawCategories = faqCategories.map(c => c.category)
  const allCategories = ['All', ...rawCategories]
  const displayed = (activeCategory === 'All') 
    ? faqCategories 
    : faqCategories.filter(c => c.category === activeCategory)

  const heroText  = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText   = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const mutedText = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const filterBar = isDark ? 'bg-[#0F0F2A] border-white/5' : 'bg-white border-[#E0E7FF]'
  const filterBtn = (active) => active
    ? 'bg-[#13221B] border-[#13221B] text-white'
    : isDark ? 'border-white/10 text-[#8888AA] hover:border-[#13221B]/30 hover:text-white' : 'border-[#C7D2FE] text-[#13221B] hover:border-[#13221B] hover:text-[#13221B]'
  const sectionBg = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'
  const sectionA  = isDark ? 'bg-[#0F0F2A]' : 'bg-white'
  const divLine   = isDark ? 'bg-white/5' : 'bg-[#E0E7FF]'

  return (
    <div className="page-enter">
      <section className="page-hero-bg pt-32 pb-16 text-center relative overflow-hidden">
        <div className="max-w-[700px] mx-auto px-4 relative z-10">
          <div className="section-label mb-4">Help Center</div>
          <h1 className={`font-['Poppins'] font-black text-5xl mb-4 ${heroText}`}>
            Frequently Asked <span className="gradient-text">Questions</span>
          </h1>
          <p className={`text-lg ${subText}`}>Find quick answers about donations, animal welfare, NGOs, volunteering, and platform security.</p>
        </div>
      </section>

      {/* Category filter */}
      <section className={`py-6 border-b sticky top-16 z-40 backdrop-blur-xl ${filterBar}`}>
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 flex flex-wrap gap-2 justify-center">
          {allCategories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${filterBtn(activeCategory === cat)}`}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* FAQ Content */}
      <section className={`py-16 ${sectionBg}`}>
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-10">
            {displayed.map((cat, ci) => (
              <div key={ci} className="reveal">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl">{cat.icon}</span>
                  <h2 className={`font-['Poppins'] font-bold text-xl ${heroText}`}>{cat.category}</h2>
                  <div className={`h-px flex-1 ${divLine}`} />
                </div>
                <Accordion items={cat.items} isDark={isDark} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-14 ${sectionA}`}>
        <div className="max-w-[500px] mx-auto px-4 text-center reveal">
          <h2 className={`font-['Poppins'] font-bold text-2xl mb-2 ${heroText}`}>
            Still Have Questions?
          </h2>
          <p className={`text-sm mb-5 ${mutedText}`}>
            Our support team is ready to help you 7 days a week.
          </p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white font-bold text-sm hover:-translate-y-1 transition-all">
            Contact Support →
          </Link>
        </div>
      </section>
    </div>
  )
}
