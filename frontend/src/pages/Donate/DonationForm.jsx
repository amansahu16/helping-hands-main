import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../api/axios'
import {
  Package, MapPin, Camera, CheckCircle, ArrowRight,
  Navigation, X, AlertCircle, LogIn
} from 'lucide-react'
import useScrollReveal from '../../hooks/useScrollReveal'
import LocationAutocomplete from '../../components/LocationAutocomplete'
import bgImg from '../images/donate_item.jpg'

// ── GPS helper ───────────────────────────────────────────────
function useGPS() {
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')

  const getLocation = useCallback((onSuccess) => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported')
      return
    }
    setGpsLoading(true)
    setGpsError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`
          )
          const data = await res.json()
          const addr = data.address
          // Landmark = amenity/tourism/shop/building name if available
          const landmark = addr.amenity || addr.tourism || addr.shop || addr.building || addr.man_made || addr.leisure || null
          const road = addr.house_number
            ? `${addr.house_number}, ${addr.road || ''}`.trim()
            : addr.road
          const area = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.county
          const city = addr.city || addr.town || addr.village || addr.district
          const locationStr = [landmark, road, area, city, addr.state]
            .filter(Boolean)
            .join(', ')
          onSuccess({ locationStr, latitude, longitude })
        } catch {
          onSuccess({ locationStr: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, latitude, longitude })
        } finally {
          setGpsLoading(false)
        }
      },
      () => { setGpsError('Location access denied. Enter manually.'); setGpsLoading(false) },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [])

  return { getLocation, gpsLoading, gpsError }
}

// ── Auth Gate Banner ─────────────────────────────────────────
function AuthGate({ onLogin, isDark }) {
  const cardBg = isDark ? 'bg-[#16163A] border-white/8' : 'bg-white border-[#E0E7FF] shadow-sm'
  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const mutedText = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'

  return (
    <div className={`border rounded-3xl p-10 text-center ${cardBg}`}>
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center mx-auto mb-5">
        <LogIn size={36} className="text-white" />
      </div>
      <h3 className={`font-['Poppins'] font-bold text-2xl mb-3 ${heroText}`}>
        Login Required
      </h3>
      <p className={`mb-6 text-sm ${mutedText}`}>
        You need to be logged in to donate items. Please login or create an account to continue.
      </p>
      <button
        onClick={onLogin}
        className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white font-bold hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(108,99,255,0.4)] transition-all"
      >
        Login / Register
      </button>
    </div>
  )
}

// ── Multi-photo picker ────────────────────────────────────────
function PhotoPicker({ photos, onChange, isDark }) {
  const inputRef = useRef(null)
  const [uploadingCount, setUploadingCount] = useState(0)

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limit to max 5 total photos
    const slotsAvailable = 5 - photos.length
    const filesToUpload = files.slice(0, slotsAvailable)

    // Increase uploading count
    setUploadingCount(prev => prev + filesToUpload.length)

    filesToUpload.forEach(async (file) => {
      try {
        const formData = new FormData()
        formData.append('photo', file)
        const { data } = await api.post('/auth/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        onChange(prev => [...prev, data.url])
      } catch (err) {
        console.error("Upload error:", err)
        alert(err.response?.data?.message || 'Failed to upload image')
      } finally {
        setUploadingCount(prev => Math.max(0, prev - 1))
      }
    })
    e.target.value = ''
  }

  const remove = (i) => onChange(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div className="flex flex-col gap-2">
      <label className={`text-xs font-semibold ${isDark ? 'text-[#8888AA]' : 'text-[#4338CA]'}`}>
        Photos (optional)
      </label>
      <div className="flex flex-wrap gap-2">
        {photos.map((p, i) => (
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
            <img src={p} alt="" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {/* Render loading placeholders */}
        {Array.from({ length: uploadingCount }).map((_, i) => (
          <div key={`loading-${i}`} className="w-20 h-20 rounded-xl border border-dashed flex items-center justify-center bg-black/10">
            <span className="w-4 h-4 border-2 border-[#13221B] border-t-transparent rounded-full animate-spin" />
          </div>
        ))}
        {photos.length + uploadingCount < 5 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${isDark ? 'border-[#13221B]/30 hover:border-[#13221B]/60' : 'border-[#13221B]/40 hover:border-[#13221B] bg-[#EEF2FF]/40'
              }`}
          >
            <Camera size={18} className="text-[#13221B]" />
            <span className="text-[#13221B] text-[10px]">Add</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <p className="text-[#8888AA] text-[10px]">Up to 5 photos, PNG/JPG</p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function DonationForm() {
  useScrollReveal()
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const { getLocation, gpsLoading, gpsError } = useGPS()

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [form, setForm] = useState({
    title: '', category: 'CLOTHES', description: '', condition: 'Good',
    quantity: 1, location: '', latitude: null, longitude: null, pickupType: 'PICKUP',
  })
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleGPS = () => {
    getLocation(({ locationStr, latitude, longitude }) => {
      setForm(f => ({ ...f, location: locationStr, latitude, longitude }))
    })
  }

  // Import AuthModal here to avoid circular deps
  const [AuthModal, setAuthModalComp] = useState(null)
  useEffect(() => {
    import('../../components/AuthModal').then(m => setAuthModalComp(() => m.default))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      setShowAuthModal(true)
      return
    }
    setLoading(true); setError('')
    try {
      await api.post('/donations', {
        title: form.title,
        category: form.category,
        condition: form.condition,
        description: form.description,
        quantity: Number(form.quantity),
        location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        pickupType: form.pickupType,
        photos,
      })
      setSuccess(true)
      setTimeout(() => navigate('/donate/listings'), 2500)
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const categories = ['CLOTHES', 'FOOD', 'GOODS', 'BOOKS']
  const conditions = ['New', 'Like New', 'Good', 'Fair']

  const pickupTypes = [
    { val: 'PICKUP', label: '📍 Pickup from me' },
    { val: 'DROPOFF', label: "🚚 I'll drop off" },
    { val: 'BOTH', label: '🔄 Either works' },
  ]

  const features = [
    { icon: '🗓️', title: 'Easy Scheduling', desc: 'Arrange pickup/drop-off at your convenience.' },
    { icon: '✅', title: 'Verified Recipients', desc: 'Items go to pre-screened families and shelters.' },
    { icon: '📊', title: 'Real-Time Tracking', desc: 'Track your donation status every step of the way.' },
  ]

  const faqs = [
    { q: 'What items can I donate?', a: 'Clothes, food (non-perishable and sealed), household goods, books, toys, and more.' },
    { q: 'Is there a minimum quantity?', a: 'No minimum. Even a single item can make a difference.' },
    { q: 'How is safety ensured?', a: 'Recipients are verified and donation exchanges happen at safe public locations.' },
  ]

  // Theme-aware styles
  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const mutedText = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const sectionBg = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'
  const cardBg = isDark ? 'bg-[#16163A] border-white/8' : 'bg-white border-[#E0E7FF] shadow-sm'
  const selectBg = isDark ? 'bg-[#0F0F2A] border-white/10 text-white' : 'bg-[#F9FAFF] border-[#13221B]/20 text-[#1E1B4B]'
  const labelClass = `text-xs font-semibold ${isDark ? 'text-[#8888AA]' : 'text-[#4338CA]'}`

  const inputClass = isDark
    ? "px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-[#555577] text-sm focus:outline-none focus:border-[#13221B] transition-all"
    : "px-4 py-3 rounded-xl bg-[#F9FAFF] border border-[#13221B]/20 text-[#1E1B4B] placeholder-[#8888AA] text-sm focus:outline-none focus:border-[#13221B] transition-all"

  return (
    <div className="page-enter">
      {/* Auth modal */}
      {showAuthModal && AuthModal && (
        <AuthModal
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialTab="login"
        />
      )}

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
          <div className="section-label mb-4">Donate Items</div>
          <h1 className={`font-['Poppins'] font-black text-5xl mb-4 ${heroText}`}>
            Give What <span className="gradient-text">You Don't Need</span>
          </h1>
          <p className={`text-lg ${subText}`}>Your unused items could change someone's day. List them in minutes.</p>
        </div>
      </section>

      <section className={`py-16 ${sectionBg}`}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10">

            {/* Form — 3 cols */}
            <div className="lg:col-span-3 reveal-left">
              {success ? (
                <div className={`border rounded-3xl p-10 text-center ${cardBg} ${isDark ? 'border-[#43E97B]/30' : 'border-green-200 shadow-lg'}`}>
                  <CheckCircle size={52} className="text-[#43E97B] mx-auto mb-4" />
                  <h3 className={`font-['Poppins'] font-bold text-2xl mb-2 ${heroText}`}>
                    Donation Listed! 🎉
                  </h3>
                  <p className={mutedText}>
                    Your item has been listed. Redirecting to listings…
                  </p>
                </div>
              ) : !user ? (
                <AuthGate onLogin={() => setShowAuthModal(true)} isDark={isDark} />
              ) : (
                <form onSubmit={handleSubmit} className={`border rounded-3xl p-8 flex flex-col gap-5 ${cardBg} ${isDark ? '' : 'shadow-md'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#13221B]/15 flex items-center justify-center">
                      <Package size={20} className="text-[#2E7D59]" />
                    </div>
                    <h2 className={`font-['Poppins'] font-bold text-2xl ${heroText}`}>
                      Donation Details
                    </h2>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Item Title *</label>
                    <input name="title" value={form.title} onChange={change} required
                      placeholder="e.g. Winter Clothes Bundle"
                      className={inputClass} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Category *</label>
                      <select name="category" value={form.category} onChange={change}
                        className={`px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-[#13221B] transition-all ${selectBg}`}>
                        {categories.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Condition *</label>
                      <select name="condition" value={form.condition} onChange={change}
                        className={`px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-[#13221B] transition-all ${selectBg}`}>
                        {conditions.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Description</label>
                    <textarea name="description" value={form.description} onChange={change} rows={3}
                      placeholder="Describe the items — size, type, quantity details, etc."
                      className={`${inputClass} resize-none`} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Quantity</label>
                      <input name="quantity" type="number" min="1" value={form.quantity} onChange={change}
                        className={inputClass} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Pickup Location *</label>
                      <div className="flex gap-2">
                        <LocationAutocomplete
                          value={form.location}
                          onChange={(val) => setForm(f => ({ ...f, location: val }))}
                          onSelectLocation={({ locationStr, latitude, longitude }) => {
                            setForm(f => ({ ...f, location: locationStr, latitude, longitude }))
                          }}
                          placeholder="Street, area, city…"
                          inputClass={inputClass}
                          isDark={isDark}
                        />
                        <button
                          type="button"
                          onClick={handleGPS}
                          disabled={gpsLoading}
                          title="Use my current location"
                          className="px-3 rounded-xl bg-[#13221B]/15 border border-[#13221B]/30 text-[#2E7D59] hover:bg-[#13221B]/25 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          {gpsLoading
                            ? <span className="w-3 h-3 border-2 border-[#2E7D59]/30 border-t-[#2E7D59] rounded-full animate-spin block" />
                            : <Navigation size={15} />
                          }
                        </button>
                      </div>
                      {gpsError && <p className="text-[#FF8FA3] text-xs">{gpsError}</p>}
                      {form.latitude && <p className="text-[#43E97B] text-xs">📍 GPS location captured</p>}
                    </div>
                  </div>

                  {/* Pickup preference */}
                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Pickup Preference</label>
                    <div className="grid grid-cols-3 gap-2">
                      {pickupTypes.map(p => (
                        <button
                          type="button" key={p.val}
                          onClick={() => setForm(f => ({ ...f, pickupType: p.val }))}
                          className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${form.pickupType === p.val
                            ? 'bg-[#13221B]/15 border-[#13221B]/60 text-[#2E7D59]'
                            : isDark
                              ? 'border-white/8 text-[#7777AA] hover:border-white/20'
                              : 'border-[#13221B]/20 text-[#5A5A8A] hover:border-[#13221B]/40'
                            }`}
                        >{p.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Photo upload */}
                  <PhotoPicker photos={photos} onChange={setPhotos} isDark={isDark} />

                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#3D6A53]/10 border border-[#3D6A53]/25 text-[#FF8FA3] text-sm">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  <button
                    type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white font-['Poppins'] font-bold text-sm hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(108,99,255,0.4)] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
                      : <>Submit Donation <ArrowRight size={16} /></>
                    }
                  </button>
                </form>
              )}
            </div>

            {/* Sidebar — 2 cols */}
            <div className="lg:col-span-2 flex flex-col gap-5 reveal-right">
              <div className={`border rounded-2xl p-6 ${cardBg}`}>
                <h3 className={`font-['Poppins'] font-bold text-base mb-4 ${heroText}`}>
                  Why Donate Here?
                </h3>
                <div className="flex flex-col gap-4">
                  {features.map((f, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-2xl shrink-0">{f.icon}</span>
                      <div>
                        <p className={`font-semibold text-sm ${heroText}`}>{f.title}</p>
                        <p className={`text-xs leading-relaxed ${mutedText}`}>{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`border rounded-2xl p-6 ${cardBg}`}>
                <h3 className={`font-['Poppins'] font-bold text-base mb-4 ${heroText}`}>FAQ</h3>
                <div className="flex flex-col gap-3">
                  {faqs.map((f, i) => (
                    <div key={i} className="border-b border-white/5 pb-3 last:border-0">
                      <p className={`text-xs font-semibold mb-1 ${heroText}`}>{f.q}</p>
                      <p className={`text-xs leading-relaxed ${mutedText}`}>{f.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`border rounded-2xl p-5 text-center ${isDark
                ? 'bg-gradient-to-br from-[#13221B]/20 to-[#3D6A53]/10 border-[#13221B]/25'
                : 'bg-white border-[#C7D2FE] shadow-sm'
                }`}>
                <p className={`font-bold text-lg mb-1 ${heroText}`}>Need Help?</p>
                <p className={`text-xs mb-3 ${mutedText}`}>
                  Our team is here to assist with your donation.
                </p>
                <a href="mailto:donate@helpinghands.org" className="text-[#2E7D59] text-sm font-semibold hover:text-[#13221B] transition-colors">
                  amansahuat799959@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
