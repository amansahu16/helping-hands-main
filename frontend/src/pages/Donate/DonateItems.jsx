import { Link } from 'react-router-dom'
import useScrollReveal from '../../hooks/useScrollReveal'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import bgImg from '../images/donate_item.jpg'
import imgClothes from '../images/donate_clothes.png'
import imgFood from '../images/donate_food.png'
import imgGoods from '../images/donate_goods.png'
import FeatureCard from '../../components/FeatureCard'

function FAQAccordion({ items, isDark }) {
  const [open, setOpen] = useState(null)

  const accordionBorder = (i) => open === i
    ? 'border-[#13221B]/50 shadow-[0_0_15px_rgba(108,99,255,0.1)]'
    : isDark ? 'border-white/8' : 'border-[#E0E7FF]'
  const accordionBtnText = isDark ? 'text-white hover:bg-white/[0.03]' : 'text-[#1E1B4B] hover:bg-[#EEF2FF]'
  const answerText = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${accordionBorder(i)}`}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className={`w-full flex justify-between items-center px-5 py-4 text-left text-sm font-semibold transition-colors ${accordionBtnText}`}
          >
            {item.q}
            <span className={`text-[#13221B] text-xl ml-4 ${open === i ? 'rotate-45' : ''} transition-transform`}>+</span>
          </button>
          <div className={`accordion-body ${open === i ? 'open' : ''}`}>
            <p className={`px-5 pb-4 text-sm leading-relaxed ${answerText}`}>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function DonateItems() {
  useScrollReveal()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const categories = [
    { img: imgClothes, title: 'Clothes & Accessories', desc: 'Jackets, shoes, bags, blankets, and any wearable items in decent condition.' },
    { img: imgFood, title: 'Food & Groceries', desc: 'Non-perishable foods, sealed packages, or fresh produce arranged quickly.' },
    { img: imgGoods, title: 'Household & Goods', desc: 'Books, toys, kitchen items, electronics, and other useful everyday items.' },
  ]

  const steps = [
    { num: '1', title: 'Select Items', desc: 'Choose what you want to donate and fill in details like category and condition.' },
    { num: '2', title: 'Enter Location', desc: 'Add your location for real-time matching with nearby recipients or collection centers.' },
    { num: '3', title: 'Connect & Transfer', desc: 'Arrange pickup or drop-off with the matched recipient or NGO partner.' },
  ]

  const testimonials = [
    { name: 'Kavita R.', role: 'Donor', text: 'I donated 3 bags of clothes and they were picked up the same day. It felt amazing to see it all go to a local shelter!', initial: 'K' },
    { name: 'Sanjay M.', role: 'Recipient via NGO', text: 'We received food donations within 2 hours of a request through Helping Hands. Truly life-saving during floods.', initial: 'S' },
  ]

  const faqs = [
    { q: 'What items can I donate?', a: 'Clothes, food (sealed), books, toys, kitchen items, electronics in working condition, and more.' },
    { q: "What can't be donated?", a: 'Expired food, damaged/unsafe items, hazardous materials, or items requiring special handling.' },
    { q: 'How is pickup arranged?', a: 'After listing, you can schedule a pickup with the recipient or arrange a drop-off at a nearby collection point.' },
    { q: 'Is there a fee for donating?', a: 'No. The platform is completely free for donors.' },
  ]

  // Theme-aware styles
  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const mutedText = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const sectionBg = isDark ? 'bg-[#0F0F2A]' : 'bg-[#F8FAFF]'
  const sectionBgAlt = isDark ? 'bg-[#07071A]' : 'bg-white'
  const cardBg = isDark
    ? 'bg-[#16163A] border-white/8 hover:border-[#13221B]/30 hover:shadow-[0_16px_40px_rgba(108,99,255,0.1)]'
    : 'bg-white border-[#E0E7FF] hover:border-[#13221B]/35 shadow-sm hover:shadow-lg'

  return (
    <div className="page-enter">
      <section
        className="page-hero-bg pt-32 pb-16 text-center relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(var(--hero-overlay-start), var(--hero-overlay-end)), url(${bgImg})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-[700px] mx-auto px-4 relative z-10">
          <div className="section-label mb-4">Give Back</div>
          <h1 className={`font-['Poppins'] font-black text-5xl sm:text-6xl mb-4 ${heroText}`}>
            Donate Items,<br />
            <span className="gradient-text">Change Lives</span>
          </h1>
          <p className={`text-lg mb-6 ${subText}`}>Give what you don't need. Help those who do. It's that simple.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link to="/donate/form" className="px-6 py-3 rounded-full bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white font-bold text-sm hover:-translate-y-0.5 shadow-[0_0_24px_rgba(108,99,255,0.4)] transition-all">
              Start Donating
            </Link>
            <Link to="/donate/listings" className={`px-6 py-3 rounded-full border font-bold text-sm hover:-translate-y-0.5 transition-all ${isDark ? 'border-white/20 text-white hover:bg-white/5' : 'border-[#C7D2FE] text-[#13221B] hover:bg-[#EEF2FF]'
              }`}>
              Browse Items
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className={`py-20 ${sectionBg}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 reveal">
            <h2 className={`font-['Poppins'] font-black text-4xl mb-3 ${heroText}`}>
              What <span className="gradient-text">You Can Donate</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {categories.map((c, i) => (
              <FeatureCard
                key={i}
                title={c.title}
                desc={c.desc}
                //link="/donate/form"
                image={c.img}
                revealDelay={`${i * 0.1}s`}
                showAction={false}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={`py-16 ${sectionBgAlt}`}>
        <div className="max-w-[800px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 reveal">
            <h2 className={`font-['Poppins'] font-bold text-3xl ${heroText}`}>
              How <span className="gradient-text">Donation Works</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 reveal">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center font-black text-white text-2xl mx-auto mb-4 shadow-[0_0_20px_rgba(108,99,255,0.35)]">
                  {s.num}
                </div>
                <h4 className={`font-['Poppins'] font-semibold text-sm mb-1 ${heroText}`}>{s.title}</h4>
                <p className={`text-xs leading-relaxed ${mutedText}`}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 reveal">
            <Link to="/donate/form" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white font-bold text-sm hover:-translate-y-0.5 shadow-[0_0_24px_rgba(108,99,255,0.4)] transition-all">
              Start Your Donation <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>



      {/* FAQ */}
      <section className={`py-16 ${sectionBgAlt}`}>
        <div className="max-w-[700px] mx-auto px-4 sm:px-6">
          <h2 className={`font-['Poppins'] font-bold text-3xl text-center mb-8 ${heroText}`}>FAQ</h2>
          <div className="reveal">
            <FAQAccordion items={faqs} isDark={isDark} />
          </div>
        </div>
      </section>
    </div>
  )
}
