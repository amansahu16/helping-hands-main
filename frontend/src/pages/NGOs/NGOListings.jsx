import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useScrollReveal from '../../hooks/useScrollReveal'
import { Search, MapPin, Phone, Mail, ExternalLink, CheckCircle, Loader2, ArrowRight } from 'lucide-react'
import api from '../../api/axios'
import { useTheme } from '../../context/ThemeContext'
import bgImg from '../images/NGO_bg.jpg'


function NGOCard({ ngo, isDark = false }) {
  const areaColors = {
    'Animal Welfare': { bg: 'rgba(255,101,132,0.12)', border: 'rgba(255,101,132,0.35)', text: '#FF8FA3' },
    'Education': { bg: 'rgba(108,99,255,0.12)', border: 'rgba(108,99,255,0.35)', text: '#2E7D59' },
    'Elderly Care': { bg: 'rgba(67,233,123,0.12)', border: 'rgba(67,233,123,0.35)', text: '#43E97B' },
    'Environment': { bg: 'rgba(56,249,215,0.12)', border: 'rgba(56,249,215,0.35)', text: '#38F9D7' },
    'Disaster Relief': { bg: 'rgba(255,179,71,0.12)', border: 'rgba(255,179,71,0.35)', text: '#FFB347' },
  }
  const colors = areaColors[ngo.areaOfWork] || { bg: 'rgba(108,99,255,0.12)', border: 'rgba(108,99,255,0.35)', text: '#2E7D59' }
  const cardBg = isDark ? 'bg-[#16163A] border-white/8 hover:border-[#13221B]/30 hover:shadow-[0_12px_40px_rgba(108,99,255,0.12)]' : 'bg-white border-[#E0E7FF] hover:border-[#13221B]/35 shadow-sm hover:shadow-lg'
  const nameText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const regText = isDark ? 'text-[#555577]' : 'text-[#A5B4FC]'
  const descText = isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'
  const locText = isDark ? 'text-[#555577]' : 'text-[#A5B4FC]'
  const mapBtn = isDark
    ? 'bg-white/5 border-white/10 text-[#7777AA] hover:text-white hover:bg-white/10'
    : 'bg-[#EEF2FF] border-[#C7D2FE] text-[#6366F1] hover:text-[#13221B] hover:bg-[#EEF2FF]'

  return (
    <div className={`border rounded-2xl p-5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-3 ${cardBg}`}>
      <Link to={`/ngos/${ngo.id}`} className="flex flex-col gap-3 group/card no-underline">
        {/* Header */}
        <div className="flex items-start gap-3">
          {ngo.photoUrl ? (
            <img src={ngo.photoUrl} alt={ngo.name} className="w-12 h-12 rounded-xl object-contain shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">{ngo.name?.charAt(0) || 'N'}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className={`font-['Poppins'] font-bold text-sm ${nameText} group-hover/card:text-[#2E7D59] transition-colors`}>{ngo.name}</h3>
              {ngo.verified && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#43E97B] bg-[#43E97B]/10 px-1.5 py-0.5 rounded-full border border-[#43E97B]/25">
                  <CheckCircle size={9} /> Verified
                </span>
              )}
            </div>
            {ngo.registrationNumber && (
              <p className={`text-xs mt-0.5 ${regText}`}>Reg: {ngo.registrationNumber}</p>
            )}
          </div>
        </div>

        {/* Area tag */}
        {ngo.areaOfWork && (
          <span className="self-start px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
            {ngo.areaOfWork}
          </span>
        )}

        {/* Description */}
        {ngo.description && (
          <p className={`text-xs leading-relaxed line-clamp-2 ${descText}`}>{ngo.description}</p>
        )}

        {/* Location */}
        {ngo.location && (
          <div className={`flex items-center gap-1.5 text-xs ${locText}`}>
            <MapPin size={11} /> {ngo.location}
          </div>
        )}
      </Link>

      {/* Contact buttons */}
      <div className="flex flex-wrap gap-2 mt-auto pt-2">
        {ngo.phoneNumber && (
          <a
            href={`tel:${ngo.phoneNumber}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#43E97B]/10 border border-[#43E97B]/25 text-[#43E97B] hover:bg-[#43E97B]/20 transition-all"
          >
            <Phone size={11} /> Call
          </a>
        )}
        {ngo.email && (
          <a
            href={`mailto:${ngo.email}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#13221B]/10 border border-[#13221B]/25 text-[#2E7D59] hover:bg-[#13221B]/20 transition-all"
          >
            <Mail size={11} /> Email
          </a>
        )}
        {ngo.location && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ngo.location + ' ' + (ngo.name || ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${mapBtn}`}
          >
            <ExternalLink size={11} /> Map
          </a>
        )}
        <Link
          to="/ngos/donate"
          className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white hover:shadow-[0_0_12px_rgba(108,99,255,0.3)] transition-all"
        >
          Donate <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  )
}

export default function NGOListings() {
  useScrollReveal()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [ngos, setNgos] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/ngos?limit=100')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.data || data.ngos || []
        setNgos(list)
      })
      .catch(() => setNgos([]))
      .finally(() => setLoading(false))
  }, [])

  const areas = ['all', 'Animal Welfare', 'Education', 'Elderly Care', 'Environment', 'Women Empowerment', 'Disaster Relief', 'Health', 'Other']

  const displayed = ngos.filter(n => {
    const matchArea = filter === 'all' || n.areaOfWork === filter
    const matchSearch = !search ||
      n.name?.toLowerCase().includes(search.toLowerCase()) ||
      n.location?.toLowerCase().includes(search.toLowerCase()) ||
      n.email?.toLowerCase().includes(search.toLowerCase())
    return matchArea && matchSearch
  })

  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#6366F1]'
  const mutedText = isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'
  const filterBar = isDark ? 'bg-[#0F0F2A] border-white/5' : 'bg-white border-[#E0E7FF]'
  const searchInput = isDark
    ? 'bg-white/[0.05] border-white/10 text-white placeholder-[#555577] focus:border-[#13221B]'
    : 'bg-[#EEF2FF] border-[#C7D2FE] text-[#1E1B4B] placeholder-[#A5B4FC] focus:border-[#13221B]'
  const filterBtn = (active) => active
    ? 'bg-[#13221B] border-[#13221B] text-white'
    : isDark ? 'border-white/10 text-[#8888AA] hover:border-[#13221B]/30' : 'border-[#C7D2FE] text-[#6366F1] hover:border-[#13221B] hover:text-[#13221B]'
  const sectionBg = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'

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
          <div className="section-label mb-4">Verified Organizations</div>
          <h1 className={`font-['Poppins'] font-black text-5xl mb-4 ${heroText}`}>
            Discover <span className="gradient-text">NGOs</span>
          </h1>
          <p className={`text-lg ${subText}`}>Find and support verified organizations working for people, animals, and communities.</p>
        </div>
      </section>

      {/* Filters */}
      <section className={`py-5 border-b sticky top-16 z-40 backdrop-blur-xl ${filterBar}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A5B4FC]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search NGOs…"
              className={`pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none transition-all w-52 border ${searchInput}`}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {areas.map(a => (
              <button
                key={a}
                onClick={() => setFilter(a)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterBtn(filter === a)}`}
              >
                {a === 'all' ? 'All' : a}
              </button>
            ))}
          </div>
          <div className={`ml-auto text-sm shrink-0 ${mutedText}`}>
            <span className={`font-bold ${heroText}`}>{displayed.length}</span> NGOs found
          </div>
        </div>
      </section>

      <section className={`py-12 min-h-[50vh] ${sectionBg}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="text-center py-20">
              <Loader2 size={40} className="text-[#13221B] animate-spin mx-auto mb-4" />
              <p className={mutedText}>Loading NGOs…</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4"></div>
              <h3 className={`font-bold text-xl mb-2 ${heroText}`}>No NGOs found</h3>
              <p className={`text-sm mb-4 ${mutedText}`}>
                {ngos.length === 0 ? 'No NGOs are registered yet. Be the first!' : 'Try adjusting your search or filter.'}
              </p>
              <Link to="/ngos/register" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-sm font-bold hover:-translate-y-0.5 transition-all">
                Register Your NGO <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 reveal">
              {displayed.map(ngo => (
                <NGOCard key={ngo.id} ngo={ngo} isDark={isDark} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
