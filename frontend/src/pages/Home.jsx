import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart, Package, PawPrint, Users, ArrowRight, ChevronDown,
  Shield, Zap, Globe, TrendingUp, Award, Play, Building
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import useScrollReveal from '../hooks/useScrollReveal'
import api from '../api/axios'
import bgImg from './images/home page.png'
import donateBg from './images/donate_item.jpg'
import animalBg from './images/feed-animals.png'
import volunteerBg from './images/Volunteer.jpg'
import FeatureCard from '../components/FeatureCard'

/* ─── Animated counter ──────────────────────────────────────── */
function Counter({ target, suffix = '', duration = 1000 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isIntersecting) return
    let active = true
    const start = performance.now()
    const startValue = count
    const step = (now) => {
      if (!active) return
      const prog = Math.min((now - start) / duration, 1)
      setCount(Math.floor(startValue + prog * (target - startValue)))
      if (prog < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
    return () => {
      active = false
    }
  }, [target, isIntersecting, duration])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ─── Accordion ─────────────────────────────────────────────── */
function FAQ({ items, isDark }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className={`border rounded-2xl overflow-hidden transition-all duration-300 ${open === i
            ? isDark ? 'border-[#13221B]/60 shadow-[0_0_20px_rgba(108,99,255,0.15)]' : 'border-[#13221B]/40 shadow-[0_4px_20px_rgba(99,102,241,0.12)]'
            : isDark ? 'border-white/8' : 'border-[#E0E7FF]'
            }`}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className={`w-full flex items-center justify-between px-6 py-4 text-left font-medium text-sm transition-colors ${isDark ? 'text-white hover:bg-white/[0.03]' : 'text-[#1E1B4B] hover:bg-[#EEF2FF]'
              }`}
          >
            {item.q}
            <ChevronDown
              size={18}
              className={`text-[#13221B] shrink-0 ml-4 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          <div className={`accordion-body ${open === i ? 'open' : ''}`}>
            <p className={`px-6 pb-5 text-sm leading-relaxed ${isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'}`}>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Testimonial card ──────────────────────────────────────── */
function TestimonialCard({ name, role, text, rating = 5, isDark }) {
  return (
    <div className={`relative border rounded-2xl p-6 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden ${isDark
      ? 'bg-gradient-to-br from-[#16201B] to-[#0E1512] border-[#2E7D59]/20 hover:border-[#43E97B]/40 shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(67,233,123,0.15)]'
      : 'bg-white border-[#2E7D59]/15 hover:border-[#13221B]/35 shadow-[0_4px_20px_rgba(19,34,27,0.04)] hover:shadow-[0_12px_32px_rgba(19,34,27,0.08)]'
      }`}>
      {/* Decorative quotes background */}
      <span className="absolute -top-3 -right-1 text-9xl font-serif text-[#3D6A53] opacity-[0.08] select-none pointer-events-none">”</span>

      <div className="flex gap-0.5 text-[#FFB347] text-xs mb-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <span key={idx}>{idx < rating ? '★' : '☆'}</span>
        ))}
      </div>

      <p className={`text-sm leading-relaxed italic mb-5 relative z-10 ${isDark ? 'text-[#BAC9BF]' : 'text-[#2E4237]'}`}>
        “{text}”
      </p>

      <div className="flex items-center gap-3 mt-auto relative z-10 pt-4 border-t border-[#2E7D59]/10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-[0_2px_8px_rgba(19,34,27,0.2)]">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#13221B]'}`}>{name}</p>
          <p className={`text-xs ${isDark ? 'text-[#7A8E81]' : 'text-[#5B6E62]'}`}>{role}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Particle background ───────────────────────────────────── */
function Particles({ isDark }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            background: isDark
              ? (i % 3 === 0 ? '#13221B' : i % 3 === 1 ? '#3D6A53' : '#43E97B')
              : (i % 3 === 0 ? 'rgba(108,99,255,0.4)' : i % 3 === 1 ? 'rgba(255,101,132,0.35)' : 'rgba(67,233,123,0.4)'),
            animationDuration: `${Math.random() * 15 + 10}s`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════════════ */
export default function Home() {
  useScrollReveal()
  const { user, role } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [stats, setStats] = useState({ donations: 0, animals: 0, ngos: 0, volunteers: 0 })
  const [dynTestimonials, setDynTestimonials] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [ngoRescuesAlertCount, setNgoRescuesAlertCount] = useState(0)

  useEffect(() => {
    const fetchStats = () => {
      api.get('/public/stats').then(({ data }) => {
        if (data?.data) setStats(data.data)
      }).catch(() => { })
    }

    fetchStats()
    const interval = setInterval(fetchStats, 3000)

    api.get('/public/leaderboard').then(({ data }) => {
      setLeaderboard(Array.isArray(data) ? data : [])
    }).catch(() => { })

    api.get('/public/testimonials')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data?.data || [])
        if (list.length > 0) {
          const shuffled = [...list].sort(() => 0.5 - Math.random())
          setDynTestimonials(shuffled.slice(0, 3).map(tm => ({
            name: tm.user?.name || 'Anonymous',
            role: 'Verified Volunteer',
            text: tm.content,
            rating: tm.rating || 5
          })))
        } else {
          const shuffled = [...fallbackTestimonials].sort(() => 0.5 - Math.random())
          setDynTestimonials(shuffled.slice(0, 3))
        }
      })
      .catch(() => {
        const shuffled = [...fallbackTestimonials].sort(() => 0.5 - Math.random())
        setDynTestimonials(shuffled.slice(0, 3))
      })

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (role === 'ngo' && user?.areaOfWork === 'Animal Welfare') {
      api.get('/ngos/me/rescue-requests')
        .then(({ data }) => {
          const openRescues = (data || []).filter(r => r.status === 'OPEN')
          setNgoRescuesAlertCount(openRescues.length)
        })
        .catch(() => { })
    }
  }, [role, user])

  const features = [
    {
      icon: <Package size={28} />,
      color: 'from-[#13221B] to-[#2E7D59]',
      bg: isDark ? 'rgba(108,99,255,0.12)' : 'rgba(108,99,255,0.08)',
      border: isDark ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.20)',
      title: 'Donate Items',
      desc: 'Give unused clothes, food, and goods to those in need — matched with nearby recipients instantly.',
      link: '/donate',
      image: donateBg,
    },
    {
      icon: <PawPrint size={28} />,
      color: 'from-[#3D6A53] to-[#FF8FA3]',
      bg: isDark ? 'rgba(255,101,132,0.10)' : 'rgba(255,101,132,0.07)',
      border: isDark ? 'rgba(255,101,132,0.25)' : 'rgba(255,101,132,0.18)',
      title: 'Animal Welfare',
      desc: 'Feed street animals, rescue injured pets, and connect rescuers with nearby shelters.',
      link: '/animals',
      image: animalBg,
    },
    {
      icon: <Users size={28} />,
      color: 'from-[#43E97B] to-[#38F9D7]',
      bg: isDark ? 'rgba(67,233,123,0.10)' : 'rgba(67,233,123,0.07)',
      border: isDark ? 'rgba(67,233,123,0.25)' : 'rgba(67,233,123,0.18)',
      title: 'Join Campaigns',
      desc: 'Find or create volunteer campaigns in your area for cleanups, relief drives, and social good.',
      link: '/volunteer',
      image: volunteerBg,
    },
  ]



  const benefits = [
    { icon: <Shield size={20} />, title: 'Verified NGOs', desc: 'Every NGO is manually verified before being listed on the platform.' },
    { icon: <Zap size={20} />, title: 'Real-Time Matching', desc: 'Location-based matching ensures help reaches the right people fast.' },
    { icon: <TrendingUp size={20} />, title: 'Track Impact', desc: 'See your donations, rescues, and campaign impact in real time.' },
    { icon: <Globe size={20} />, title: 'Community First', desc: 'Built for local communities with hyper-local animal and human welfare focus.' },
    { icon: <Award size={20} />, title: 'Trusted Platform', desc: 'Transparent donation flow with photo proof and status tracking.' },
    { icon: <Heart size={20} />, title: 'Free to Use', desc: 'No fees for donors or volunteers. 100% of your contribution reaches those in need.' },
  ]

  const fallbackTestimonials = [
    { name: 'Priya S.', role: 'Donor, Mumbai', text: 'I donated old clothes through Helping Hands and within 2 days they were delivered to a shelter. The tracking was amazing!' },
    { name: 'Rohan NGO', role: 'NGO Manager, Delhi', text: 'Our verified NGO listing brought us 40+ new volunteers and 200+ item donations in the first month. Outstanding platform!' },
    { name: 'Anjali M.', role: 'Volunteer, Pune', text: 'I rescued a stray dog using the rescue feature. The platform connected me with a nearby shelter within an hour. Incredible!' },
    { name: 'Dr. Aryan K.', role: 'Animal Welfare, Bangalore', text: 'The real-time location feature helped us feed 50 street dogs in our area regularly. Community impact at its finest.' },
    { name: 'Sunita J.', role: 'Adoptive Parent, Chennai', text: 'Found our fur baby through the adoption section. The process was smooth, transparent, and compassionate.' },
    { name: 'Vikram NGO', role: 'Campaign Organizer, Hyderabad', text: 'We ran a city-wide cleanup campaign and got 300 volunteers through the platform. Truly transformational!' },
  ]

  const faqs = [
    { q: 'Is Helping Hands free to use?', a: 'Yes! The platform is completely free for donors, volunteers, and recipients. NGOs may have optional premium features.' },
    { q: 'How are NGOs verified?', a: 'Every NGO undergoes manual verification with document checks including registration certificates and government IDs.' },
    { q: 'Can I donate food items?', a: 'Absolutely. We accept perishable and non-perishable food items. Pickup can be scheduled within hours of listing.' },
    { q: 'How does animal rescue work?', a: 'Report a distressed animal with a photo and location. Nearby volunteers and shelters are immediately notified.' },
    { q: 'Is my data safe?', a: 'We use industry-standard JWT authentication, encrypted passwords, and never sell user data to third parties.' },
    { q: 'Can I volunteer for multiple campaigns?', a: 'Yes! Join as many campaigns as you like. You can manage all participations from your dashboard.' },
  ]

  // Theme-aware classes
  const sectionA = isDark ? 'bg-[#0F0F2A]' : 'bg-[#F8FAFF]'
  const sectionB = isDark ? 'bg-[#07071A]' : 'bg-white'
  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const mutedText = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const cardBg = isDark
    ? 'bg-[#16163A] border-white/8 hover:border-[#13221B]/40'
    : 'bg-white border-[#E0E7FF] hover:border-[#13221B]/35 shadow-sm hover:shadow-lg'
  const glassCard = isDark ? 'glass' : 'bg-white border border-[#E0E7FF] shadow-md'

  return (
    <div className="page-enter">
      {role === 'ngo' && user?.areaOfWork === 'Animal Welfare' && ngoRescuesAlertCount > 0 && (
        <div className="bg-red-500 text-white py-3 px-4 text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 relative z-50 animate-pulse">
          <span>emergency alert: There are {ngoRescuesAlertCount} open animal rescue requests nearby!</span>
          <Link to="/ngos/dashboard" className="underline hover:text-red-100 ml-2 font-bold normal-case">Go to Dashboard →</Link>
        </div>
      )}

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex items-center pt-16 overflow-hidden page-hero-bg"
        style={{
          backgroundImage: `linear-gradient(var(--hero-overlay-start), var(--hero-overlay-end)), url(${bgImg})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll',
        }}
      >
        <Particles isDark={isDark} />
        {/* Glow blobs */}
        <div className={`glow-blob w-[500px] h-[500px] -top-32 -left-32 ${isDark ? 'bg-[#13221B]' : 'bg-[#818CF8]'}`} />
        <div className={`glow-blob w-[400px] h-[400px] top-1/2 -right-32 ${isDark ? 'bg-[#3D6A53]' : 'bg-[#F472B6]'}`} />
        <div className={`glow-blob w-[350px] h-[350px] bottom-0 left-1/3 ${isDark ? 'bg-[#43E97B]' : 'bg-[#34D399]'}`} />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10 py-2">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left */}
            <div className={`animate-fade-up p-8 sm:p-10 rounded-3xl backdrop-blur-md border ${isDark
              ? 'bg-black/10 border-white/5 shadow-2xl'
              : 'bg-white/5 border-white/40 shadow-xl shadow-indigo-900/5'
              } max-w-2xl`}>
              {/* Welcome greeting */}
              {user && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 animate-fade-up ${isDark ? 'bg-[#43E97B]/10 border border-[#43E97B]/30' : 'bg-green-50 border border-green-200'}`}>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center text-white text-xs font-bold">
                    {(user.name || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-sm font-semibold ${isDark ? 'text-[#43E97B]' : 'text-green-700'}`}>Welcome back, {user.name?.split(' ')[0] || 'Friend'}! </span>
                </div>
              )}

              <h1 className={`font-['Poppins'] font-black text-5xl sm:text-6xl lg:text-6xl leading-[1.1] mb-4 ${heroText}`}>
                Helping Hands Are More Powerful <br />
                <span className="gradient-text">Than Praying Lips</span>
              </h1>
              <p className={`text-lg leading-relaxed mb-8 max-w-lg ${subText}`}>
                Connect with donors, volunteers, and trusted NGOs to support people and animals in your community.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link to="/donate" className="flex items-center gap-2 px-6 py-3 rounded-full font-['Poppins'] font-semibold text-sm bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white shadow-[0_0_28px_rgba(108,99,255,0.4)] hover:shadow-[0_0_42px_rgba(108,99,255,0.6)] hover:-translate-y-1 transition-all">
                  <Heart size={17} className="fill-white" /> Start Donating
                </Link>
                <Link to="/about" className={`flex items-center gap-2 px-6 py-3 rounded-full font-['Poppins'] font-semibold text-sm hover:-translate-y-1 transition-all ${isDark
                  ? 'bg-white/[0.06] border border-white/15 text-white hover:bg-white/10 backdrop-blur-sm'
                  : 'bg-white border border-[#C7D2FE] text-[#4338CA] hover:bg-[#EEF2FF] shadow-sm'
                  }`}>
                  <Play size={15} /> Explore Platform
                </Link>
              </div>

            </div>

            {/* Right — visual card */}
            <div className="hidden lg:flex justify-center items-center relative animate-fade-right">

            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-xs animate-float ${mutedText}`}>
          <span>Scroll</span>
          <ChevronDown size={18} />
        </div>
      </section>

      {/* ══ STATS SECTION ════════════════════════════════════════ */}
      <section className="py-6 relative -mt-12 z-20 max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 ${isDark
          ? 'bg-gradient-to-r from-[#16201B] to-[#0E1512] border-[#2E7D59]/20 shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
          : 'bg-white border-[#2E7D59]/12 shadow-[0_8px_30px_rgba(19,34,27,0.06)]'
          }`}>
          {/* Stat 1: Volunteers */}
          <div className="flex items-center gap-3 p-2 justify-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-[#43E97B]/10 text-[#43E97B] border border-[#43E97B]/20' : 'bg-[#13221B]/5 text-[#13221B] border border-[#13221B]/10'
              }`}>
              <Users size={20} />
            </div>
            <div className="text-left">
              <div className={`font-['Poppins'] font-black text-xl md:text-2xl leading-none ${isDark ? 'text-white' : 'text-[#13221B]'}`}>
                <Counter target={stats.volunteers || 0} suffix="+" />
              </div>
              <p className={`text-[10px] font-bold tracking-wider uppercase mt-0.5 ${mutedText}`}>Volunteers</p>
            </div>
          </div>

          {/* Stat 2: NGOs */}
          <div className="flex items-center gap-3 p-2 justify-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-[#43E97B]/10 text-[#43E97B] border border-[#43E97B]/20' : 'bg-[#13221B]/5 text-[#13221B] border border-[#13221B]/10'
              }`}>
              <Building size={20} />
            </div>
            <div className="text-left">
              <div className={`font-['Poppins'] font-black text-xl md:text-2xl leading-none ${isDark ? 'text-white' : 'text-[#13221B]'}`}>
                <Counter target={stats.ngos || 0} suffix="+" />
              </div>
              <p className={`text-[10px] font-bold tracking-wider uppercase mt-0.5 ${mutedText}`}>Partner NGOs</p>
            </div>
          </div>

          {/* Stat 3: Animals Rescued */}
          <div className="flex items-center gap-3 p-2 justify-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-[#43E97B]/10 text-[#43E97B] border border-[#43E97B]/20' : 'bg-[#13221B]/5 text-[#13221B] border border-[#13221B]/10'
              }`}>
              <PawPrint size={20} />
            </div>
            <div className="text-left">
              <div className={`font-['Poppins'] font-black text-xl md:text-2xl leading-none ${isDark ? 'text-white' : 'text-[#13221B]'}`}>
                <Counter target={stats.animals || 0} suffix="+" />
              </div>
              <p className={`text-[10px] font-bold tracking-wider uppercase mt-0.5 ${mutedText}`}>Rescued</p>
            </div>
          </div>

          {/* Stat 4: Donations Made */}
          <div className="flex items-center gap-3 p-2 justify-center">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-[#43E97B]/10 text-[#43E97B] border border-[#43E97B]/20' : 'bg-[#13221B]/5 text-[#13221B] border border-[#13221B]/10'
              }`}>
              <Package size={20} />
            </div>
            <div className="text-left">
              <div className={`font-['Poppins'] font-black text-xl md:text-2xl leading-none ${isDark ? 'text-white' : 'text-[#13221B]'}`}>
                <Counter target={stats.donations || 0} suffix="+" />
              </div>
              <p className={`text-[10px] font-bold tracking-wider uppercase mt-0.5 ${mutedText}`}>Donations</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════ */}
      <section className={`py-24 relative ${sectionA}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 reveal">
            <div className="section-label mb-4">What We Offer</div>
            <h2 className={`font-['Poppins'] font-black text-4xl sm:text-5xl mb-4 ${heroText}`}>
              Three Ways to <span className="gradient-text">Help</span>
            </h2>
            <p className={`text-lg max-w-xl mx-auto ${mutedText}`}>Whether you have items to give, animals to save, or time to volunteer — we have a place for you.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FeatureCard
                key={i}
                title={f.title}
                desc={f.desc}
                link={f.link}
                image={f.image}
                icon={f.icon}
                revealDelay={`${i * 0.1}s`}
              />
            ))}
          </div>
        </div>
      </section>




      {/* ══ BENEFITS ═══════════════════════════════════════════════ */}
      <section className={`py-24 relative ${sectionB}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="reveal-left">
              <div className="section-label mb-4">Why Choose Us</div>
              <h2 className={`font-['Poppins'] font-black text-4xl sm:text-5xl mb-4 ${heroText}`}>
                Built for <span className="gradient-text-green">Real Impact</span>
              </h2>
              <p className={`text-lg leading-relaxed mb-8 ${mutedText}`}>
                Helping Hands is not just another charity platform. We connect the right people with the right resources at the right time — locally and transparently.
              </p>
              <Link to="/about" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#43E97B] to-[#38F9D7] text-[#07071A] text-sm font-bold hover:-translate-y-1 hover:shadow-[0_0_28px_rgba(67,233,123,0.4)] transition-all">
                Our Story <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 reveal-right">
              {benefits.map((b, i) => (
                <div
                  key={i}
                  className={`flex gap-3.5 p-4 border rounded-2xl hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(19,34,27,0.04)] transition-all duration-300 ${isDark
                    ? 'bg-[#16201B] border-[#2E7D59]/15 hover:border-[#43E97B]/30'
                    : 'bg-white border-[#E0E7FF] hover:border-[#13221B]/30'
                    }`}
                  style={{ transitionDelay: `${i * 0.05}s` }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark
                    ? 'bg-[#43E97B]/8 border border-[#43E97B]/15 text-[#43E97B]'
                    : 'bg-[#13221B]/5 border border-[#13221B]/10 text-[#13221B]'
                    }`}>
                    {b.icon}
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm mb-1 ${heroText}`}>{b.title}</h4>
                    <p className={`text-xs leading-relaxed ${mutedText}`}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ LEADERBOARD ═══════════════════════════════════════════ */}
      <section className={`py-24 ${sectionB}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-2 reveal-left">
              <div className="section-label mb-4">Community Heroes</div>
              <h2 className={`font-['Poppins'] font-black text-4xl sm:text-5xl mb-4 ${heroText}`}>
                Volunteer <span className="gradient-text">Leaderboard</span>
              </h2>
              <p className={`text-lg leading-relaxed mb-6 ${mutedText}`}>
                Meet our top change-makers. Points are earned dynamically for organizing and joining campaigns, donating items, reporting animal rescues, and adopting pets.
              </p>
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#16201B] border-[#2E7D59]/15' : 'bg-white border-[#E0E7FF] shadow-sm'}`}>
                <h4 className={`font-bold text-sm mb-3.5 flex items-center gap-2 ${heroText}`}>
                  <Award className="text-[#FFB347]" size={18} />
                  <span>How to Earn Points?</span>
                </h4>
                <ul className={`text-xs space-y-3 ${mutedText}`}>
                  <li className="flex justify-between items-center pb-2 border-b border-[#2E7D59]/5"><span>Campaign Organized</span> <span className="font-bold text-[#43E97B] bg-[#43E97B]/10 px-2 py-0.5 rounded-full">+10 pts</span></li>
                  <li className="flex justify-between items-center pb-2 border-b border-[#2E7D59]/5"><span>Pet Adoption Completed</span> <span className="font-bold text-[#43E97B] bg-[#43E97B]/10 px-2 py-0.5 rounded-full">+10 pts</span></li>
                  <li className="flex justify-between items-center pb-2 border-b border-[#2E7D59]/5"><span>Animal Rescue Reported</span> <span className="font-bold text-[#43E97B] bg-[#43E97B]/10 px-2 py-0.5 rounded-full">+8 pts</span></li>
                  <li className="flex justify-between items-center pb-2 border-b border-[#2E7D59]/5"><span>Campaign Joined & Approved</span> <span className="font-bold text-[#43E97B] bg-[#43E97B]/10 px-2 py-0.5 rounded-full">+5 pts</span></li>
                  <li className="flex justify-between items-center"><span>Donation Made</span> <span className="font-bold text-[#43E97B] bg-[#43E97B]/10 px-2 py-0.5 rounded-full">+5 pts</span></li>
                </ul>
              </div>
            </div>

            <div className="lg:col-span-3 reveal-right">
              <div className={`border rounded-3xl p-6 ${isDark
                ? 'bg-gradient-to-br from-[#16201B] to-[#0E1512] border-[#2E7D59]/20 shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
                : 'bg-white border-[#E0E7FF] shadow-[0_8px_30px_rgba(19,34,27,0.04)]'
                }`}>
                <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${heroText}`}>
                  <Award size={20} className="text-[#FFB347] animate-pulse" />
                  <span>Top 10 Volunteers</span>
                </h3>

                {leaderboard.length === 0 ? (
                  <p className={`text-sm text-center py-8 ${mutedText}`}>No points recorded yet. Be the first to join a campaign!</p>
                ) : (
                  <div className="divide-y divide-white/5 space-y-3">
                    {leaderboard.map((u, i) => {
                      const medal = i === 0 ? '1' : i === 1 ? '2' : i === 2 ? '3' : `${i + 1}`
                      const medalColor = i === 0 ? 'text-[#FFD700]' : i === 1 ? 'text-[#C0C0C0]' : i === 2 ? 'text-[#CD7F32]' : 'text-slate-400'
                      return (
                        <div key={u.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 font-['Poppins'] font-bold text-base text-center ${medalColor}`}>
                              {medal}
                            </div>

                            {u.photoUrl ? (
                              <img src={u.photoUrl} alt={u.name} className="w-10 h-10 rounded-full object-contain border border-[#13221B]/20" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center font-bold text-white text-sm">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div>
                              <p className={`font-semibold text-sm ${heroText}`}>{u.name}</p>
                              <p className="text-[11px] text-[#43E97B]">Active Member</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-['Poppins'] font-bold text-sm text-[#43E97B] bg-[#43E97B]/10 px-3 py-1 rounded-full">
                              {u.points} pts
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═══════════════════════════════════════════ */}
      <section className={`py-24 ${sectionA}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 reveal">
            <div className="section-label mb-4">Real Stories</div>
            <h2 className={`font-['Poppins'] font-black text-4xl sm:text-5xl mb-4 ${heroText}`}>
              What Our <span className="gradient-text">Community</span> Says
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dynTestimonials.map((tm, i) => (
              <div key={i} className="reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
                <TestimonialCard {...tm} isDark={isDark} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════════════ */}
      <section className={`py-24 ${sectionB}`}>
        <div className="max-w-[760px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 reveal">
            <div className="section-label mb-4">Got Questions?</div>
            <h2 className={`font-['Poppins'] font-black text-4xl mb-3 ${heroText}`}>
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
          </div>
          <div className="reveal">
            <FAQ items={faqs} isDark={isDark} />
          </div>
          <div className="text-center mt-8 reveal">
            <p className={`text-sm mb-3 ${mutedText}`}>Still have questions?</p>
            <Link to="/contact" className={`inline-flex items-center gap-2 font-semibold hover:underline transition-colors ${isDark ? 'text-[#2E7D59] hover:text-white' : 'text-[#13221B] hover:text-[#4338CA]'}`}>
              Contact Support <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
