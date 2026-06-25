import { Link } from 'react-router-dom'
import useScrollReveal from '../../hooks/useScrollReveal'
import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import bgImg from '../images/feed-animals.png'

import { Calendar, MapPin, Users, CheckCircle, Loader2, PawPrint, Heart, Utensils } from 'lucide-react'

export default function FeedAnimals() {
  useScrollReveal()
  const { theme } = useTheme()
  const { user } = useAuth()
  const isDark = theme === 'dark'
  const [email, setEmail] = useState('')
  const [subbed, setSubbed] = useState(false)


  // ── Animal Welfare Campaigns ───────────────────────────────
  const [campaigns, setCampaigns] = useState([])
  const [campLoading, setCampLoading] = useState(true)
  const [joined, setJoined] = useState({})

  useEffect(() => {
    // Fetch animal welfare campaigns using server-side type filter
    api.get('/campaigns?type=ANIMAL_WELFARE&limit=100')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data.data || data.campaigns || [])
        // Keep only running or planned ones, and exclude ones that have ended
        const filtered = list.filter(c =>
          (c.status === 'ONGOING' || c.status === 'PLANNED') &&
          (!c.timeTo || new Date(c.timeTo) > new Date())
        )
        setCampaigns(filtered)
      })
      .catch(() => setCampaigns([]))
      .finally(() => setCampLoading(false))
  }, [])

  const handleJoin = async (id) => {
    if (!user) { alert('Please login to join a campaign.'); return }
    try {
      await api.post(`/campaigns/${id}/join`)
    } catch (_) { /* optimistic */ }
    setJoined(j => ({ ...j, [id]: true }))
  }

  const ways = [
    { icon: <Users size={32} className="text-[#3D6A53] mx-auto" />, title: 'Join a Feeding Group', desc: 'Connect with local volunteers who regularly feed street animals in your area.' },
    { icon: <Heart size={32} className="text-[#FF8FA3] mx-auto" />, title: 'Sponsor a Feeding Station', desc: 'Fund permanent feeding stations in high-density animal zones.' },
    { icon: <MapPin size={32} className="text-[#2E7D59] mx-auto" />, title: 'Report Hungry Animals', desc: 'Post locations of hungry or malnourished animals for feeders nearby.' },
  ]

  const tips = ['Feed at consistent times each day', 'Use species-appropriate food', 'Keep feeding spots clean', 'Note unusual behavior and report it', 'Never feed near traffic']

  const testimonials = [
    { name: 'Nidhi K.', role: 'Volunteer, Delhi', text: 'I joined a local feeding group through the app. We now feed 40+ dogs every morning as a community. Heartwarming!', initial: 'N' },
    { name: 'Suresh P.', role: 'Feeder, Pune', text: 'I sponsored a feeding station near my office. It\'s a small cost but makes a massive daily impact.', initial: 'S' },
  ]



  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const textMuted = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const sectionBgA = isDark ? 'bg-[#0F0F2A]' : 'bg-white'
  const sectionBgB = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'
  const cardBg = isDark ? 'bg-[#16163A] border-white/8 hover:border-[#13221B]/30' : 'bg-white border-[#E0E7FF] hover:border-[#13221B]/45 shadow-sm hover:shadow-md'
  const emojiCardBg = isDark ? 'bg-[#16163A] border-white/8' : 'bg-[#EEF2FF] border-[#C7D2FE] shadow-sm'
  const campCardBg = isDark ? 'bg-[#16163A] border-[#43E97B]/20' : 'bg-white border-[#C7D2FE] shadow-sm'
  const inputClass = isDark
    ? 'flex-1 px-4 py-2.5 rounded-full bg-white/[0.05] border border-white/10 text-white placeholder-[#555577] text-sm focus:outline-none focus:border-[#13221B] transition-all'
    : 'flex-1 px-4 py-2.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[#1E1B4B] placeholder-[#A5B4FC] text-sm focus:outline-none focus:border-[#13221B] transition-all'
  const faqBorder = (active) => active
    ? 'border-[#13221B]/50'
    : isDark ? 'border-white/8' : 'border-[#E0E7FF]'

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
          <div className="section-label mb-4">Street Animal Care</div>
          <h1 className={`font-['Poppins'] font-black text-5xl mb-4 ${heroText}`}>
            Feed Street <span className="gradient-text">Animals</span>
          </h1>
          <p className={`text-lg ${subText}`}>Small acts of feeding can transform the lives of millions of street animals. Start today.</p>
        </div>
      </section>

      {/* ── Active Animal Welfare Campaigns ─────────────────── */}
      <section className={`py-14 ${sectionBgB}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6 reveal">
            <div>
              <div className="section-label mb-2">Live Campaigns</div>
              <h2 className={`font-['Poppins'] font-black text-3xl ${heroText}`}>
                Join an Animal Welfare <span className="gradient-text">Drive</span>
              </h2>
              <p className={`text-sm mt-1 ${textMuted}`}>Active campaigns near you — join with one click.</p>
            </div>
            <Link
              to="/volunteer/join"
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${isDark ? 'border-white/10 text-[#BBBBD8] hover:border-[#43E97B]/40 hover:text-[#43E97B]' : 'border-[#C7D2FE] text-[#6366F1] hover:border-[#3D6A53] hover:text-[#3D6A53]'}`}
            >
              See All Campaigns →
            </Link>
          </div>

          {campLoading ? (
            <div className="flex items-center justify-center py-10 gap-3">
              <Loader2 size={24} className="animate-spin text-[#43E97B]" />
              <span className={`text-sm ${textMuted}`}>Loading campaigns…</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className={`border rounded-2xl p-8 text-center ${isDark ? 'bg-[#16163A] border-white/5' : 'bg-white border-[#E0E7FF]'}`}>
              <PawPrint size={40} className="mx-auto text-indigo-500 mb-3 animate-pulse" />
              <p className={`font-semibold text-sm ${heroText}`}>No active animal welfare campaigns right now</p>
              <p className={`text-xs mt-1 mb-4 ${textMuted}`}>Be the first to start a feeding drive in your area!</p>
              <Link
                to="/volunteer/start"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#3D6A53] to-[#13221B] text-white text-xs font-bold hover:-translate-y-0.5 transition-all"
              >
                Start an Animal Welfare Campaign
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 reveal">
              {campaigns.map((c, i) => {
                const spots = c.maxParticipants || c.maxVolunteers
                const filled = c.currentParticipants || c._count?.participants || c.volunteers || 0
                const pct = spots ? Math.min(100, Math.round((filled / spots) * 100)) : 0
                const statusColor = c.status === 'ONGOING'
                  ? 'text-[#43E97B] bg-[#43E97B]/10 border-[#43E97B]/25'
                  : 'text-[#FFB347] bg-[#FFB347]/10 border-[#FFB347]/25'
                return (
                  <div key={c.id || i} className={`border rounded-2xl p-5 hover:-translate-y-1 transition-all duration-300 flex flex-col ${campCardBg}`} style={{ transitionDelay: `${i * 0.07}s` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <PawPrint size={18} className="text-[#43E97B] shrink-0" />
                        <h3 className={`font-['Poppins'] font-bold text-sm leading-tight ${heroText}`}>{c.name || c.title}</h3>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusColor}`}>{c.status}</span>
                    </div>
                    <p className={`text-xs mb-2 ${textMuted}`}>Organized by: <span className="font-semibold">{c.organizerUser?.name || c.organizerNgo?.name || 'Anonymous'}</span></p>
                    <p className={`text-xs leading-relaxed mb-3 flex-1 ${textMuted}`}>{c.description}</p>
                    <div className={`flex flex-wrap gap-2 text-xs mb-3 ${textMuted}`}>
                      {(c.timeFrom || c.date) && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-[#43E97B]" />
                          {new Date(c.timeFrom || c.date).toLocaleDateString()}
                        </span>
                      )}
                      {c.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-[#43E97B]" />
                          {c.location}
                        </span>
                      )}
                      {(spots > 0) && (
                        <span className="flex items-center gap-1">
                          <Users size={11} className="text-[#43E97B]" />
                          {filled}/{spots}
                        </span>
                      )}
                    </div>
                    {spots > 0 && (
                      <div className={`w-full h-1.5 rounded-full mb-3 ${isDark ? 'bg-white/5' : 'bg-[#EEF2FF]'}`}>
                        <div className="h-full bg-gradient-to-r from-[#3D6A53] to-[#43E97B] rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                    {joined[c.id] ? (
                      <div className="flex items-center gap-2 text-[#43E97B] text-xs font-semibold">
                        <CheckCircle size={14} /> You're in! See you there
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoin(c.id)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#3D6A53] to-[#13221B] text-white text-xs font-bold hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(67,233,123,0.3)] transition-all"
                      >
                        Join This Drive
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="text-center mt-6 sm:hidden reveal">
            <Link
              to="/volunteer/join"
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl border text-sm font-semibold transition-all ${isDark ? 'border-white/10 text-[#BBBBD8]' : 'border-[#C7D2FE] text-[#6366F1]'}`}
            >
              See All Campaigns →
            </Link>
          </div>
        </div>
      </section>

      {/* Feature highlight */}
      <section className={`py-16 ${sectionBgA}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="reveal-left">
              <div className="section-label mb-4">Why It Matters</div>
              <h2 className={`font-['Poppins'] font-black text-4xl mb-4 ${heroText}`}>Feeding Programs <span className="gradient-text">Change Communities</span></h2>
              <p className={`leading-relaxed mb-4 text-sm ${textMuted}`}>Regular feeding improves animal health, reduces aggression, strengthens the human-animal bond, and creates safer, friendlier neighborhoods.</p>
              <div className="flex flex-col gap-2">
                {['Healthier, less aggressive street animals', 'Safer neighborhoods for everyone', 'Builds community bonds', 'Reduces disease spread'].map((b, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm ${subText}`}>
                    <span className="text-[#43E97B] font-bold">✓</span> {b}
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal-right grid grid-cols-2 gap-3">
              {[
                <PawPrint size={32} className="text-[#3D6A53] mx-auto" />,
                <Heart size={32} className="text-[#FF8FA3] mx-auto" />,
                <Users size={32} className="text-[#43E97B] mx-auto" />,
                <Utensils size={32} className="text-[#FFB347] mx-auto" />
              ].map((icon, i) => (
                <div key={i} className={`rounded-2xl p-6 text-center hover:-translate-y-1 transition-all border flex items-center justify-center ${emojiCardBg}`}>{icon}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3 ways */}
      <section className={`py-16 ${sectionBgB}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <h2 className={`font-['Poppins'] font-black text-4xl text-center mb-10 ${heroText}`}>3 Ways to <span className="gradient-text">Get Involved</span></h2>
          <div className="grid sm:grid-cols-3 gap-6 reveal">
            {ways.map((w, i) => (
              <div key={i} className={`border rounded-2xl p-6 text-center hover:-translate-y-1 transition-all ${cardBg}`}>
                <div className="mb-4">{w.icon}</div>
                <h4 className={`font-['Poppins'] font-bold text-base mb-2 ${heroText}`}>{w.title}</h4>
                <p className={`text-sm leading-relaxed ${textMuted}`}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className={`py-14 ${sectionBgA}`}>
        <div className="max-w-[700px] mx-auto px-4 sm:px-6 text-center">
          <h2 className={`font-['Poppins'] font-bold text-3xl mb-6 ${heroText}`}>Feeding Tips</h2>
          <div className="flex flex-col gap-2 text-left reveal">
            {tips.map((tip, i) => (
              <div key={i} className={`border rounded-xl p-3 text-sm ${cardBg}`}>
                <span className="w-6 h-6 rounded-full bg-[#13221B]/15 border border-[#13221B]/30 flex items-center justify-center text-[#2E7D59] text-xs font-bold shrink-0 mr-3 inline-flex">{i + 1}</span>
                <span className={heroText}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </section>





    </div>
  )
}
