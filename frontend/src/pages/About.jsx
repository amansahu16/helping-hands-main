import { useState, useEffect } from 'react'
import useScrollReveal from '../hooks/useScrollReveal'
import { Link } from 'react-router-dom'
import { ArrowRight, Heart, Users, Award, Globe } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

export default function About() {
  useScrollReveal()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const mutedText = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const sectionA = isDark ? 'bg-[#0F0F2A]' : 'bg-[#F8FAFF]'
  const sectionB = isDark ? 'bg-[#07071A]' : 'bg-white'
  const cardBg = isDark ? 'bg-[#16163A] border-white/8 hover:border-[#13221B]/30' : 'bg-white border-[#E0E7FF] hover:border-[#13221B]/30 shadow-sm hover:shadow-md'
  const iconBg = isDark ? 'bg-[#13221B]/12 border-[#13221B]/20 text-[#2E7D59]' : 'bg-[#EEF2FF] border-[#C7D2FE] text-[#13221B]'

  const [stats, setStats] = useState({
    ngos: 0,
    donations: 0,
    animals: 0,
    volunteers: 0,
    rescued: 0,
    adopted: 0,
    fed: 0,
    shelters: 0
  })

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: mainData } = await api.get('/public/stats')
        const { data: animalData } = await api.get('/public/animal-stats')

        if (mainData.success && mainData.data) {
          setStats(s => ({
            ...s,
            ngos: mainData.data.ngos || 0,
            donations: mainData.data.donations || 0,
            animals: mainData.data.animals || 0,
            volunteers: mainData.data.volunteers || 0,
            ...animalData
          }))
        }
      } catch (err) {
        console.error("Failed to fetch public stats:", err)
      }
    }
    fetchStats()
  }, [])

  const values = [
    { icon: <Heart size={22} />, title: 'Compassion', desc: 'Every decision is guided by empathy for humans and animals alike.' },
    { icon: <Award size={22} />, title: 'Transparency', desc: 'Full visibility into where donations go and how campaigns run.' },
    { icon: <Users size={22} />, title: 'Community', desc: 'Local, hyperlocal impact. Real people helping real neighbours.' },
    { icon: <Globe size={22} />, title: 'Scale', desc: 'From one city to all of India — growing the network of good.' },
  ]

  const achievements = [
    { label: 'NGOs Partnered', value: `${stats.ngos}`, icon: '🏢' },
    { label: 'Item Donations', value: `${stats.donations}`, icon: '📦' },
    { label: 'Animals Rescued', value: `${stats.rescued}`, icon: '🐾' },
    { label: 'Animals Adopted', value: `${stats.adopted}`, icon: '🐶' },
    { label: 'Animals Fed', value: `${stats.fed}`, icon: '🍲' },
    { label: 'Volunteers Registered', value: `${stats.volunteers}`, icon: '🤝' },
  ]

  return (
    <div className="page-enter">
      {/* Header */}
      <section className="page-hero-bg pt-32 pb-20 text-center relative overflow-hidden">
        <div className="glow-blob bg-[#13221B] w-[500px] h-[500px] -top-32 left-1/2 -translate-x-1/2 opacity-[0.08]" />
        <div className="max-w-[800px] mx-auto px-4 relative z-10">
          <div className="section-label mb-4">Our Story</div>
          <h1 className={`font-['Poppins'] font-black text-5xl sm:text-6xl mb-4 ${heroText}`}>
            About <span className="gradient-text">Helping Hands</span>
          </h1>
          <p className={`text-lg leading-relaxed ${subText}`}>
            Born from a simple idea: what if unused resources could find those who need them most — quickly, safely, and without barriers?
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className={`py-24 ${sectionA}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="reveal-left">
              <div className="section-label mb-4">Our Mission</div>
              <h2 className={`font-['Poppins'] font-black text-4xl mb-4 ${heroText}`}>
                Connecting <span className="gradient-text">Hearts</span>,<br />Transforming Communities
              </h2>
              <p className={`leading-relaxed mb-4 ${mutedText}`}>
                Helping Hands was built to bridge the gap between those who have and those who need — for both humans and animals. We created a platform where trust, transparency, and technology work together.
              </p>
              <p className={`leading-relaxed mb-6 ${mutedText}`}>
                Every day, thousands of kg of food go to waste, while people go hungry. Clothes sit unused while someone shivers. Animals suffer while potential rescuers don't know how to help. We're changing that — one connection at a time.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 reveal-right">
              {values.map((v, i) => (
                <div key={i} className={`border rounded-2xl p-5 hover:-translate-y-1 transition-all ${cardBg}`}>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${iconBg}`}>
                    {v.icon}
                  </div>
                  <h4 className={`font-['Poppins'] font-bold text-base mb-1 ${heroText}`}>{v.title}</h4>
                  <p className={`text-xs leading-relaxed ${mutedText}`}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={`py-20 ${sectionB}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 reveal">
            <h2 className={`font-['Poppins'] font-black text-4xl ${heroText}`}>
              Our <span className="gradient-text">Achievements</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 reveal">
            {achievements.map((a, i) => (
              <div key={i} className={`border rounded-2xl p-4 text-center hover:border-[#13221B]/25 transition-all ${cardBg}`}>
                <div className="text-2xl mb-2">{a.icon}</div>
                <div className="font-['Poppins'] font-black text-2xl gradient-text mb-1">{a.value}</div>
                <p className={`text-xs ${mutedText}`}>{a.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#13221B] to-[#3D6A53]" />
        <div className="relative z-10 text-center max-w-[600px] mx-auto px-4 reveal">
          <h2 className="font-['Poppins'] font-black text-4xl text-white mb-4">
            Be Part of Our Story
          </h2>
          <p className="text-white/80 mb-6">
            Join thousands of compassionate people making real change happen every day.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/volunteer" className="px-8 py-3 rounded-full bg-white text-[#13221B] font-bold text-sm hover:-translate-y-1 hover:shadow-xl transition-all">
              Become a Volunteer
            </Link>
            <Link to="/ngos/register" className="px-8 py-3 rounded-full border-2 border-white/50 text-white font-bold text-sm hover:bg-white/10 hover:-translate-y-1 transition-all">
              Register Your NGO
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
