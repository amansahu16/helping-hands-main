import { Link } from 'react-router-dom'
import useScrollReveal from '../../hooks/useScrollReveal'
import { useState, useEffect } from 'react'
import { ArrowRight, MapPin, PawPrint, Heart, Utensils, Hospital } from 'lucide-react'
import api from '../../api/axios'
import { useTheme } from '../../context/ThemeContext'
import bgImg from '../images/animal welfare.jpg'
import imgFeed from '../images/animal_feed.png'
import imgRescue from '../images/animal_rescue.png'
import imgAdopt from '../images/animal_adopt.png'
import FeatureCard from '../../components/FeatureCard'

function FAQAccordion({ items, isDark }) {
  const [open, setOpen] = useState(null)
  const faqBorder = (active) => active
    ? 'border-[#13221B]/50'
    : isDark ? 'border-white/8' : 'border-[#E0E7FF]'
  const textMuted = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const textPrimary = isDark ? 'text-white' : 'text-[#1E1B4B]'

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className={`border rounded-2xl overflow-hidden transition-all ${faqBorder(open===i)}`}>
          <button onClick={()=>setOpen(open===i?null:i)} className={`w-full flex justify-between items-center px-5 py-4 text-left text-sm font-medium ${textPrimary}`}>
            {item.q}
            <span className={`text-[#13221B] text-xl ml-4 ${open===i?'rotate-45':''} transition-transform`}>+</span>
          </button>
          <div className={`accordion-body ${open===i?'open':''}`}>
            <p className={`px-5 pb-4 text-sm leading-relaxed ${textMuted}`}>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AnimalWelfare() {
  useScrollReveal()
  const [animals, setAnimals] = useState([])
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [dynStats, setDynStats] = useState({ rescued: 380, adopted: 120, fed: 5000, shelters: 48 })

  useEffect(() => {
    api.get('/animals').then(({ data }) => setAnimals((data.data || data.animals || []).slice(0, 6)))
      .catch(() => {})

    api.get('/public/animal-stats').then(({ data }) => {
      if (data) {
        setDynStats({
          rescued: data.rescued || 0,
          adopted: data.adopted || 0,
          fed: data.fed || 0,
          shelters: data.shelters || 0,
        })
      }
    }).catch(() => {})
  }, [])

  const actions = [
    { img: imgFeed, title:'Feed Street Animals', desc:'Join feeding groups, sponsor stations, or report hungry animal locations.', link:'/animals/feed' },
    { img: imgRescue, title:'Rescue & Shelter', desc:'Report injured animals, locate shelters, and connect with rescue teams.', link:'/animals/rescue' },
    { img: imgAdopt, title:'Adopt a Pet', desc:'Browse adoptable animals, schedule meet-greets, and give a pet a forever home.', link:'/animals/adopt' },
  ]

  const steps = [
    { num:'1', title:'Spot & Report', desc:'See an animal in need? Report with a photo and your real-time location.' },
    { num:'2', title:'Rescue Dispatched', desc:'Nearby volunteers and NGOs get instantly notified.' },
    { num:'3', title:'Care & Shelter', desc:'The animal is rescued, treated, and given shelter.' },
    { num:'4', title:'Adoption or Foster', desc:'Once recovered, the animal is listed for adoption or foster care.' },
  ]

  const stats = [
    { icon: <PawPrint size={28} className="text-[#3D6A53]" />, val: `${dynStats.rescued.toLocaleString()}+`, label:'Animals Rescued' },
    { icon: <Heart size={28} className="text-[#FF8FA3]" />, val: `${dynStats.adopted.toLocaleString()}+`, label:'Animals Adopted' },
    { icon: <Utensils size={28} className="text-[#FFB347]" />, val: `${dynStats.fed.toLocaleString()}+`, label:'Animals Fed Daily' },
    { icon: <Hospital size={28} className="text-[#2E7D59]" />, val: `${dynStats.shelters.toLocaleString()}`, label:'Shelters Networked' },
  ]

  const testimonials = [
    { name:'Deepa A.', role:'Volunteer Rescuer', text:'I reported a stray with a broken leg through the app. Within an hour a vet reached the spot. The system works amazingly!', initial:'D' },
    { name:'Rohan NGO', role:'Animal NGO Manager', text:'We get rescue requests directly from community members. Our response time has improved by 80% since joining Helping Hands.', initial:'R' },
  ]

  const faqs = [
    { q:'What animals can be reported?', a:'Any stray, injured, or sick animal — dogs, cats, birds, or other community animals.' },
    { q:'How do I adopt through the platform?', a:'Browse adoptable animals, connect with the shelter or rescuer, and complete a simple adoption form.' },
    { q:'Can I donate money for animal welfare?', a:'Yes. You can donate to specific NGOs or the general animal welfare fund.' },
    { q:'What if I cannot help directly?', a:"You can spread awareness, share listings, or donate funds — every bit helps." },
  ]

  const statusColor = { AVAILABLE:'text-[#43E97B] bg-[#43E97B]/10', UNDER_TREATMENT:'text-[#FFB347] bg-[#FFB347]/10', RESCUED:'text-[#13221B] bg-[#13221B]/10' }

  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const textMuted = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const sectionBgA = isDark ? 'bg-[#0F0F2A]' : 'bg-white'
  const sectionBgB = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'
  const cardBg = isDark ? 'bg-[#16163A] border-white/8 hover:border-[#13221B]/30' : 'bg-white border-[#E0E7FF] hover:border-[#13221B]/45 shadow-sm hover:shadow-md'
  const stepCardBg = isDark ? 'bg-[#16163A] border-white/8' : 'bg-white border-[#E0E7FF] shadow-sm'
  const glassCard = isDark ? 'glass' : 'bg-white border border-[#E0E7FF] shadow-sm'

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
        <div className="glow-blob bg-[#3D6A53] w-[400px] h-[400px] top-0 left-0 opacity-[0.07]" />
        <div className="max-w-[700px] mx-auto px-4 relative z-10">
          <div className="section-label mb-4">Animal Welfare</div>
          <h1 className={`font-['Poppins'] font-black text-5xl sm:text-6xl mb-4 ${heroText}`}>
            Every Animal <span className="gradient-text">Deserves Care</span>
          </h1>
          <p className={`text-lg ${subText}`}>Feed, rescue, and adopt — your compassion can save a life today.</p>
        </div>
      </section>

      {/* 3 Actions */}
      <section className={`py-20 ${sectionBgA}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-6">
            {actions.map((a, i) => (
              <FeatureCard
                key={i}
                title={a.title}
                desc={a.desc}
                link={a.link}
                image={a.img}
                revealDelay={`${i * 0.1}s`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={`py-16 ${sectionBgB}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 reveal">
            {stats.map((s, i) => (
              <div key={i} className={`rounded-2xl p-5 text-center flex flex-col items-center justify-center ${glassCard}`}>
                <div className="mb-2">{s.icon}</div>
                <div className="font-['Poppins'] font-black text-3xl gradient-text mb-1">{s.val}</div>
                <p className={`text-xs ${textMuted}`}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={`py-20 ${sectionBgA}`}>
        <div className="max-w-[900px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 reveal">
            <h2 className={`font-['Poppins'] font-black text-4xl mb-4 ${heroText}`}>How to <span className="gradient-text">Help Animals</span></h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 reveal">
            {steps.map((s, i) => (
              <div key={i} className={`border rounded-2xl p-5 text-center ${stepCardBg}`}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3D6A53] to-[#13221B] flex items-center justify-center font-black text-white text-lg mx-auto mb-3">{s.num}</div>
                <h4 className={`font-['Poppins'] font-semibold text-sm mb-1 ${heroText}`}>{s.title}</h4>
                <p className={`text-xs leading-relaxed ${textMuted}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured animals if from API */}
      {animals.length > 0 && (
        <section className={`py-16 ${sectionBgB}`}>
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <h2 className={`font-['Poppins'] font-bold text-3xl text-center mb-8 ${heroText}`}>Animals Needing Help</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {animals.map((a, i) => (
                <div key={a.id||i} className={`border rounded-2xl overflow-hidden hover:-translate-y-1 transition-all ${cardBg}`}>
                  <div className={`h-40 flex items-center justify-center text-5xl bg-gradient-to-br ${isDark ? 'from-[#1E1E4A] to-[#0F0F2A]' : 'from-[#EEF2FF] to-[#F0F4FF]'}`}>
                    {a.type === 'DOG' ? '🐶' : a.type === 'CAT' ? '🐱' : '🐾'}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-semibold text-sm ${heroText}`}>{a.name || 'Unnamed Animal'}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[a.status] || 'text-[#7777AA] bg-white/5'}`}>{a.status}</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${textMuted}`}>{a.description?.slice(0, 80) || 'Needs care and attention.'}</p>
                    <div className={`flex items-center gap-1 text-xs mt-2 ${textMuted}`}>
                      <MapPin size={10} className="text-[#13221B]" /> {a.location || 'Unknown'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/animals/adopt" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#3D6A53]/40 text-[#3D6A53] hover:bg-[#3D6A53]/10 transition-all text-sm font-semibold">
                See All Animals <ArrowRight size={15}/>
              </Link>
            </div>
          </div>
        </section>
      )}





      {/* FAQ */}
      <section className={`py-16 ${sectionBgB}`}>
        <div className="max-w-[700px] mx-auto px-4 sm:px-6">
          <h2 className={`font-['Poppins'] font-bold text-3xl text-center mb-8 ${heroText}`}>Animal Welfare FAQ</h2>
          <div className="reveal"><FAQAccordion items={faqs} isDark={isDark} /></div>
        </div>
      </section>
    </div>
  )
}
