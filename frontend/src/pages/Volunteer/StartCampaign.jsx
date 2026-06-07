import { useState } from 'react'
import useScrollReveal from '../../hooks/useScrollReveal'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { CheckCircle, ArrowRight, Calendar, MapPin, FileText, Users, Map } from 'lucide-react'
import LocationAutocomplete from '../../components/LocationAutocomplete'
import bgImg from '../images/Volunteer.jpg'

export default function StartCampaign() {
  useScrollReveal()
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [form, setForm] = useState({
    title: '', description: '', type: 'CLEANUP', location: '', date: '', maxVolunteers: 50,
    latitude: null, longitude: null
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const change = e => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      setError('Please login to create a campaign.')
      return
    }
    setLoading(true); setError('')
    try {
      const payload = {
        name: form.title,
        description: form.description,
        type: form.type,
        location: form.location,
        timeFrom: form.date,
        maxParticipants: Number(form.maxVolunteers),
        latitude: form.latitude,
        longitude: form.longitude
      }
      await api.post('/campaigns', payload)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create campaign.')
    } finally { setLoading(false) }
  }

  const types = ['CLEANUP', 'ANIMAL_WELFARE', 'EDUCATION', 'HEALTH', 'FOOD_DRIVE', 'BLOOD_DONATION', 'OTHER']

  const features = [
    { icon: <FileText size={20} className="text-[#3D6A53]" />, title: 'Custom Campaign Page', desc: 'Create a dedicated page with description, goals, and media.' },
    { icon: <Map size={20} className="text-[#3D6A53]" />, title: 'Real-Time Location', desc: 'Add your campaign location for easy discovery by nearby volunteers.' },
    { icon: <Users size={20} className="text-[#3D6A53]" />, title: 'Volunteer Management', desc: 'Track registrations, communicate with participants, and manage attendance.' },
  ]

  const pastCampaigns = [
    { title: 'Marine Beach Cleanup', organizer: 'Save Our Shores', volunteers: 80, impact: '2 tonnes waste collected' },
    { title: 'Adopt a Street Dog Week', organizer: 'Paws & Claws NGO', volunteers: 45, impact: '32 dogs adopted' },
    { title: 'Textbook Distribution Drive', organizer: 'Study India', volunteers: 30, impact: '500 kids received books' },
  ]

  // Theme-aware styles
  const heroText  = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText   = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const mutedText = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const sectionBg = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'
  const cardBg    = isDark ? 'bg-[#16163A] border-white/8' : 'bg-white border-[#E0E7FF] shadow-sm'
  const selectBg  = isDark ? 'bg-[#0F0F2A] border-white/10 text-white' : 'bg-[#F9FAFF] border-[#13221B]/20 text-[#1E1B4B]'
  
  const labelClass = `text-xs font-semibold ${isDark ? 'text-[#8888AA]' : 'text-[#4338CA]'}`
  const inputClass = isDark
    ? "px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-[#555577] text-sm focus:outline-none focus:border-[#13221B] transition-all"
    : "px-4 py-3 rounded-xl bg-[#F9FAFF] border border-[#13221B]/20 text-[#1E1B4B] placeholder-[#8888AA] text-sm focus:outline-none focus:border-[#13221B] transition-all"

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
          <div className="section-label mb-4">Be the Change</div>
          <h1 className={`font-['Poppins'] font-black text-5xl mb-4 ${heroText}`}>
            Start a <span className="gradient-text">Campaign</span>
          </h1>
          <p className={`text-lg ${subText}`}>Have an idea for a community campaign? Create it here and rally volunteers from your area.</p>
        </div>
      </section>

      <section className={`py-16 ${sectionBg}`}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Form */}
            <div className="lg:col-span-3 reveal-left">
              {success ? (
                <div className={`border rounded-3xl p-10 text-center ${cardBg} ${isDark ? 'border-[#43E97B]/30' : 'border-green-200 shadow-lg'}`}>
                  <CheckCircle size={52} className="text-[#43E97B] mx-auto mb-4" />
                  <h3 className={`font-['Poppins'] font-bold text-2xl mb-2 ${heroText}`}>Campaign Submitted! 🎉</h3>
                  <p className={mutedText}>Your campaign is under review. Once approved, it'll be visible to volunteers near you.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={`border rounded-3xl p-8 flex flex-col gap-4 ${cardBg} ${isDark ? '' : 'shadow-md'}`}>
                  <h2 className={`font-['Poppins'] font-bold text-2xl mb-1 ${heroText}`}>Campaign Details</h2>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Campaign Title *</label>
                    <input name="title" value={form.title} onChange={change} required placeholder="e.g. Weekend Park Cleanup Drive"
                      className={inputClass} />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Campaign Type</label>
                    <select name="type" value={form.type} onChange={change}
                      className={`px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-[#13221B] transition-all ${selectBg}`}>
                      {types.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Description *</label>
                    <textarea name="description" value={form.description} onChange={change} required rows={3}
                      placeholder="Describe your campaign goals, what volunteers will do, and the expected impact…"
                      className={`${inputClass} resize-none`} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Location *</label>
                      <LocationAutocomplete
                        value={form.location}
                        onChange={(val) => setForm(f => ({ ...f, location: val }))}
                        onSelectLocation={({ locationStr, latitude, longitude }) => {
                          setForm(f => ({ ...f, location: locationStr, latitude, longitude }))
                        }}
                        placeholder="City or area"
                        inputClass={inputClass}
                        isDark={isDark}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Date *</label>
                      <input name="date" type="date" value={form.date} onChange={change} required
                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-[#13221B] transition-all ${selectBg}`} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Max Volunteers</label>
                    <input name="maxVolunteers" type="number" min="5" value={form.maxVolunteers} onChange={change}
                      className={inputClass} />
                  </div>

                  {error && <div className="p-3 rounded-xl bg-[#3D6A53]/10 border border-[#3D6A53]/25 text-[#FF8FA3] text-sm">⚠ {error}</div>}

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#43E97B] to-[#13221B] text-white font-bold text-sm hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowRight size={16} />}
                    {loading ? 'Creating…' : 'Launch Campaign'}
                  </button>
                </form>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 flex flex-col gap-4 reveal-right">
              {features.map((f, i) => (
                <div key={i} className={`border rounded-2xl p-4 flex gap-3 items-start ${cardBg}`}>
                  <div className="shrink-0 mt-0.5">{f.icon}</div>
                  <div>
                    <p className={`font-['Poppins'] font-semibold text-sm mb-0.5 ${heroText}`}>{f.title}</p>
                    <p className={`text-xs leading-relaxed ${mutedText}`}>{f.desc}</p>
                  </div>
                </div>
              ))}

              <div className={`border rounded-2xl p-5 ${cardBg}`}>
                <h4 className={`font-['Poppins'] font-semibold text-sm mb-3 ${heroText}`}>Inspired by These 🌟</h4>
                {pastCampaigns.map((c, i) => (
                  <div key={i} className="mb-3 pb-3 border-b border-white/5 last:border-0">
                    <p className={`font-semibold text-xs ${heroText}`}>{c.title}</p>
                    <p className={`text-xs ${mutedText}`}>{c.organizer} · {c.volunteers} volunteers</p>
                    <p className="text-[#43E97B] text-xs mt-0.5">{c.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
