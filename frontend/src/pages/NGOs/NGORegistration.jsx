import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useScrollReveal from '../../hooks/useScrollReveal'
import api from '../../api/axios'
import { useTheme } from '../../context/ThemeContext'
import { ArrowRight, CheckCircle, Camera, MapPin, Navigation, Phone, Building2, Lock, Shield, CreditCard, Megaphone, BarChart2 } from 'lucide-react'
import LocationAutocomplete from '../../components/LocationAutocomplete'
import bgImg from '../images/NGO_bg.jpg'

// ── GPS helper ────────────────────────────────────────────────
function useGPS() {
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const getLocation = useCallback((onSuccess) => {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported'); return }
    setGpsLoading(true); setGpsError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          const data = await res.json()
          const addr = data.address
          const loc = [addr.suburb || addr.neighbourhood, addr.city || addr.town, addr.state].filter(Boolean).join(', ')
          onSuccess({ locationStr: loc, latitude, longitude })
        } catch {
          onSuccess({ locationStr: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, latitude, longitude })
        }
        setGpsLoading(false)
      },
      () => { setGpsError('Could not get location. Enter manually.'); setGpsLoading(false) },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [])
  return { getLocation, gpsLoading, gpsError }
}

// ── Photo Picker ──────────────────────────────────────────────
function PhotoPicker({ value, onChange, label, isDark }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className="flex flex-col gap-1.5">
      <label className={`text-xs font-semibold ${isDark ? 'text-[#8888AA]' : 'text-[#4338CA]'}`}>{label}</label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer hover:border-[#13221B]/50 transition-all ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-[#F9FAFF] border-[#13221B]/20 hover:bg-[#EEF2FF]/60'
          } ${uploading ? 'opacity-70 cursor-wait' : ''}`}
      >
        {uploading ? (
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-[#13221B] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium font-semibold">Uploading...</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="preview" className="w-10 h-10 rounded-lg object-contain" />
            <span className="text-[#2E7D59] text-sm font-medium font-semibold">
              Photo selected ✓
            </span>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-lg bg-[#13221B]/10 flex items-center justify-center shrink-0">
              <Camera size={18} className="text-[#13221B]" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-[#BBBBD8]' : 'text-[#1E1B4B] font-semibold'}`}>
                Click to upload photo
              </p>
              <p className={`text-xs ${isDark ? 'text-[#555577]' : 'text-[#8888AA]'}`}>PNG, JPG, PDF accepted</p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setUploading(true)
            setError('')
            try {
              const formData = new FormData()
              formData.append('photo', file)
              const { data } = await api.post('/auth/upload-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              })
              onChange(data.url)
            } catch (err) {
              console.error("Upload error:", err)
              setError(err.response?.data?.message || 'Upload failed')
            } finally {
              setUploading(false)
            }
          }}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

// ── OTP Step ──────────────────────────────────────────────────
function OtpStep({ email, onVerified, onBack, isDark }) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const verify = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/auth/ngo/verify-otp', { email, otp })
      setDone(true)
      setTimeout(() => onVerified(), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Use 123456 for testing.')
    } finally { setLoading(false) }
  }

  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const mutedText = isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'
  const inputClass = isDark
    ? "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-center text-xl font-bold tracking-widest focus:outline-none focus:border-[#13221B] transition-all"
    : "w-full px-4 py-3 rounded-xl bg-[#F9FAFF] border border-[#13221B]/20 text-[#1E1B4B] text-center text-xl font-bold tracking-widest focus:outline-none focus:border-[#13221B] transition-all"

  return (
    <div className="text-center py-4 flex flex-col gap-4">
      {done ? (
        <>
          <CheckCircle size={52} className="text-[#43E97B] mx-auto animate-scale-in" />
          <h3 className={`font-bold text-xl ${heroText}`}>
            Email Verified! 🎉
          </h3>
          <p className={`${mutedText} text-sm`}>
            Redirecting to login…
          </p>
        </>
      ) : (
        <>
          <div className="text-4xl">📧</div>
          <h3 className={`font-bold text-lg ${heroText}`}>
            Verify Your Email
          </h3>
          <p className={`${mutedText} text-sm`}>
            OTP sent to <strong className="text-[#2E7D59]">{email}</strong>
          </p>
          <p className="text-[#8888AA] text-xs">
            (Use 123456 for testing)
          </p>
          <form onSubmit={verify} className="flex flex-col gap-3">
            <input
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className={inputClass}
              maxLength={6}
            />
            {error && <div className="p-3 rounded-xl bg-[#3D6A53]/10 border border-[#3D6A53]/25 text-[#FF8FA3] text-sm">⚠ {error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white font-bold disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying…</> : 'Verify OTP'}
            </button>
            <button type="button" onClick={onBack} className="text-[#2E7D59] text-sm hover:text-[#13221B] transition-colors">
              ← Back to form
            </button>
          </form>
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function NGORegistration() {
  useScrollReveal()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const { getLocation, gpsLoading, gpsError } = useGPS()

  const [step, setStep] = useState('form')  // 'form' | 'otp' | 'done'
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', registrationNumber: '',
    location: '', latitude: null, longitude: null,
    areaOfWork: '', description: '',
  })
  const [photo, setPhoto] = useState(null)
  const [certificate, setCertificate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const change = e => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError('') }

  const handleGPS = () => {
    getLocation(({ locationStr, latitude, longitude }) => {
      setForm(f => ({ ...f, location: locationStr, latitude, longitude }))
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.registrationNumber) { setError('NGO Registration Number is required'); return }
    if (!certificate) { setError('Registration Certificate is required'); return }

    const phoneClean = form.phone.replace(/\s+/g, '')
    if (!/^\d{10}$/.test(phoneClean)) {
      setError('Phone number must be exactly 10 digits.');
      return;
    }

    if (!/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8}$/.test(form.password)) {
      setError('Password must be exactly 8 characters long and contain both letters and numbers.');
      return;
    }

    setLoading(true); setError('')
    try {
      await api.post('/auth/ngo/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        phoneNumber: phoneClean,
        registrationNumber: form.registrationNumber,
        location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        areaOfWork: form.areaOfWork,
        description: form.description,
        photoBase64: photo || null,
        certificateUrl: certificate || null,
      })
      setStep('otp')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const afterOtpVerified = () => {
    navigate('/', { state: { openLogin: true, message: 'NGO registered! Please login once approved by admin.' } })
  }

  const benefits = [
    { icon: <Shield size={20} className="text-[#3D6A53]" />, title: 'Secure Verified Profile', desc: 'Verified NGO badge builds donor trust immediately.' },
    { icon: <CreditCard size={20} className="text-[#3D6A53]" />, title: 'Donation Management', desc: 'Accept monetary and goods donations seamlessly.' },
    { icon: <Megaphone size={20} className="text-[#3D6A53]" />, title: 'Volunteer Campaigns', desc: 'Create and promote campaigns with location mapping.' },
    { icon: <BarChart2 size={20} className="text-[#3D6A53]" />, title: 'Real-time Analytics', desc: 'Track donations, rescues, and volunteer hours live.' },
  ]

  const needItems = [
    'NGO Registration Certificate / Number',
    'Official email address',
    'Phone number for contact',
    'Authorized signatory information',
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
    ? "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-[#555577] text-sm focus:outline-none focus:border-[#13221B] transition-all"
    : "w-full px-4 py-3 rounded-xl bg-[#F9FAFF] border border-[#13221B]/20 text-[#1E1B4B] placeholder-[#8888AA] text-sm focus:outline-none focus:border-[#13221B] transition-all"

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
          <div className="section-label mb-4">Join the Network</div>
          <h1 className={`font-['Poppins'] font-black text-5xl mb-4 ${heroText}`}>
            Register Your <span className="gradient-text">NGO</span>
          </h1>
          <p className={`text-lg ${subText}`}>Get verified, reach more donors, and amplify your impact.</p>
        </div>
      </section>

      <section className={`py-16 ${sectionBg}`}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10">

            {/* Form */}
            <div className="lg:col-span-3 reveal-left">
              <div className={`border rounded-3xl p-8 ${cardBg} ${isDark ? '' : 'shadow-md'}`}>
                {step === 'otp' ? (
                  <OtpStep email={form.email} onVerified={afterOtpVerified} onBack={() => setStep('form')} isDark={isDark} />
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 rounded-xl bg-[#13221B]/15 flex items-center justify-center">
                        <Building2 size={20} className="text-[#2E7D59]" />
                      </div>
                      <h2 className={`font-['Poppins'] font-bold text-2xl ${heroText}`}>NGO Registration Form</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Organization Name *</label>
                        <input name="name" value={form.name} onChange={change} required placeholder="e.g. Animal Aid Society" className={inputClass} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Registration Number *</label>
                        <div className="relative">
                          <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555577]" />
                          <input name="registrationNumber" value={form.registrationNumber} onChange={change} required placeholder="e.g. NGO/2024/1234"
                            className={`${inputClass} pl-9`} />
                        </div>
                        <p className="text-[#8888AA] text-[10px]">
                          This cannot be changed after registration.
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Email Address *</label>
                        <input name="email" type="email" value={form.email} onChange={change} required placeholder="ngo@organization.org" className={inputClass} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Phone Number *</label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555577]" />
                          <input name="phone" type="tel" value={form.phone} onChange={change} required placeholder="+91 XXXXX XXXXX"
                            className={`${inputClass} pl-9`} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Password *</label>
                      <input name="password" type="password" value={form.password} onChange={change} required placeholder="Create a strong password" className={inputClass} />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Area of Work</label>
                        <select name="areaOfWork" value={form.areaOfWork} onChange={change}
                          className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:border-[#13221B] transition-all ${selectBg}`}>
                          <option value="">Select area…</option>
                          {['Animal Welfare', 'Education', 'Elderly Care', 'Children', 'Environment', 'Health', 'Women Empowerment', 'Disaster Relief', 'Other'].map(a => <option key={a}>{a}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Location *</label>
                        <div className="flex gap-2">
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
                          <button type="button" onClick={handleGPS} disabled={gpsLoading}
                            className="px-3 rounded-xl bg-[#13221B]/15 border border-[#13221B]/30 text-[#2E7D59] hover:bg-[#13221B]/25 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                            title="Use my location">
                            {gpsLoading ? <span className="w-3 h-3 border-2 border-[#2E7D59]/30 border-t-[#2E7D59] rounded-full animate-spin block" /> : <Navigation size={14} />}
                          </button>
                        </div>
                        {gpsError && <p className="text-[#FF8FA3] text-xs">{gpsError}</p>}
                        {form.latitude && <p className="text-[#43E97B] text-xs">📍 GPS location captured</p>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>NGO Description</label>
                      <textarea name="description" value={form.description} onChange={change} rows={3}
                        placeholder="Briefly describe your NGO's mission, work, and impact…"
                        className={`${inputClass} resize-none`} />
                    </div>

                    <PhotoPicker
                      value={photo}
                      onChange={setPhoto}
                      label="NGO Logo / Profile Photo (optional)"
                      isDark={isDark}
                    />

                    <PhotoPicker
                      value={certificate}
                      onChange={setCertificate}
                      label="Registration Certificate * (required for verification)"
                      isDark={isDark}
                    />

                    {error && (
                      <div className="p-3 rounded-xl bg-[#3D6A53]/10 border border-[#3D6A53]/25 text-[#FF8FA3] text-sm">⚠ {error}</div>
                    )}

                    <button type="submit" disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white font-['Poppins'] font-bold text-sm hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(108,99,255,0.4)] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                      {loading
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Registering…</>
                        : <>Submit Registration <ArrowRight size={16} /></>
                      }
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 flex flex-col gap-5 reveal-right">
              <div className={`border rounded-2xl p-6 ${cardBg}`}>
                <h3 className={`font-['Poppins'] font-bold text-base mb-4 ${heroText}`}>Why Join Helping Hands?</h3>
                <div className="flex flex-col gap-4">
                  {benefits.map((b, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="shrink-0 mt-0.5">{b.icon}</div>
                      <div>
                        <p className={`font-semibold text-sm ${heroText}`}>{b.title}</p>
                        <p className={`text-xs leading-relaxed ${mutedText}`}>{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`border rounded-2xl p-5 ${cardBg}`}>
                <h4 className={`font-['Poppins'] font-bold text-sm mb-3 ${heroText}`}>What you'll need</h4>
                {needItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0">
                    <CheckCircle size={13} className="text-[#43E97B] shrink-0" />
                    <p className={`text-xs ${mutedText}`}>{item}</p>
                  </div>
                ))}
              </div>

              <div className={`border rounded-2xl p-5 ${isDark
                  ? 'bg-gradient-to-br from-[#13221B]/20 to-[#3D6A53]/10 border-[#13221B]/25'
                  : 'bg-white border-[#C7D2FE] shadow-sm'
                }`}>
                <p className={`font-bold text-sm mb-1 ${heroText}`}>Admin Approval Required</p>
                <p className={`text-xs ${mutedText}`}>Newly registered NGOs are set as unverified and must be approved by the administrator before they can log in.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
