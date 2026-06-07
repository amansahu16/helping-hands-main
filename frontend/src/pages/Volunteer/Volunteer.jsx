import { Link } from 'react-router-dom'
import useScrollReveal from '../../hooks/useScrollReveal'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import bgImg from '../images/Volunteer.jpg'
import imgJoin from '../images/volunteer_join.png'
import imgStart from '../images/volunteer_start.png'
import imgList from '../images/volunteer_list.png'
import FeatureCard from '../../components/FeatureCard'

export default function Volunteer() {
  useScrollReveal()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const features = [
    { img: imgJoin, title: 'Join Campaigns', desc: 'Browse and join local campaigns matching your skills and availability.', link: '/volunteer/join' },
    { img: imgStart, title: 'Start a Campaign', desc: 'Create your own community drive and invite volunteers from your area.', link: '/volunteer/start' },
  ]

  const steps = [
    { num: '1', title: 'Create Account', desc: 'Sign up free. Add your skills, location, and availability.' },
    { num: '2', title: 'Browse Campaigns', desc: 'Find campaigns near you filtered by type, date, or cause.' },
    { num: '3', title: 'Join or Create', desc: 'Join with one click or start your own community campaign.' },
    { num: '4', title: 'Make an Impact', desc: 'Show up, contribute, and earn your volunteer impact badge.' },
  ]

  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const textMuted = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const sectionBgA = isDark ? 'bg-[#0F0F2A]' : 'bg-white'
  const sectionBgB = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'
  const cardBg = isDark ? 'bg-[#16163A] border-white/8 hover:border-[#13221B]/30' : 'bg-white border-[#E0E7FF] hover:border-[#13221B]/45 shadow-sm hover:shadow-md'
  const stepIconBg = isDark ? 'bg-gradient-to-br from-[#43E97B] to-[#13221B] text-white shadow-[0_0_20px_rgba(67,233,123,0.3)]' : 'bg-gradient-to-br from-[#43E97B] to-[#13221B] text-white'

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
        <div className="glow-blob bg-[#43E97B] w-[400px] h-[400px] top-0 right-0 opacity-[0.06]" />
        <div className="max-w-[700px] mx-auto px-4 relative z-10">
          <div className="section-label mb-4">Give Your Time</div>
          <h1 className={`font-['Poppins'] font-black text-5xl sm:text-6xl mb-4 ${heroText}`}>
            Volunteer for <span className="gradient-text-blue">Change</span>
          </h1>
          <p className={`text-lg ${subText}`}>Join thousands of volunteers making a real difference for people and animals in their communities.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link to="/volunteer/join" className="px-6 py-3 rounded-full bg-gradient-to-r from-[#43E97B] to-[#38F9D7] text-[#07071A] font-bold text-sm hover:-translate-y-0.5 shadow-[0_0_24px_rgba(67,233,123,0.4)] transition-all">Join a Campaign</Link>
            <Link to="/volunteer/start" className={`px-6 py-3 rounded-full border font-bold text-sm hover:-translate-y-0.5 transition-all ${isDark ? 'border-white/20 text-white hover:bg-white/5' : 'border-[#C7D2FE] text-[#13221B] hover:bg-[#EEF2FF] shadow-sm'}`}>Start Your Own</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={`py-20 ${sectionBgA}`}>
        <div className="max-w-[800px] mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <FeatureCard
                key={i}
                title={f.title}
                desc={f.desc}
                link={f.link}
                image={f.img}
                revealDelay={`${i * 0.1}s`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={`py-16 ${sectionBgB}`}>
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <h2 className={`font-['Poppins'] font-black text-4xl text-center mb-10 ${heroText}`}>How to <span className="gradient-text">Volunteer</span></h2>
          <div className="grid sm:grid-cols-4 gap-5 reveal">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl mx-auto mb-4 ${stepIconBg}`}>{s.num}</div>
                <h4 className={`font-['Poppins'] font-semibold text-sm mb-1 ${heroText}`}>{s.title}</h4>
                <p className={`text-xs leading-relaxed ${textMuted}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
