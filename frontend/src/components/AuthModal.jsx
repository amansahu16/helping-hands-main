import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Eye, EyeOff, User, Building2, CheckCircle,
  Camera, MapPin, Phone, Navigation, ArrowRight, Shield
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'
import LocationAutocomplete from './LocationAutocomplete'

// ── GPS location helper ───────────────────────────────────────
function useGPS() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getLocation = useCallback((onSuccess) => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser')
      return
    }
    setLoading(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json()
          const addr = data.address
          const locationStr = [
            addr.suburb || addr.neighbourhood || addr.hamlet,
            addr.city || addr.town || addr.village,
            addr.state,
          ].filter(Boolean).join(', ')
          onSuccess({ locationStr, latitude, longitude })
        } catch {
          onSuccess({ locationStr: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, latitude, longitude })
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('Could not get location. Please enter manually.')
        setLoading(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [])

  return { getLocation, loading, error }
}

// ── Photo picker ──────────────────────────────────────────────
function PhotoPicker({ value, onChange, label = 'Upload Photo', accept = 'image/*', camera = false, isDark }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className="flex flex-col gap-1.5">
      <label className={`text-xs font-medium ${isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'}`}>{label}</label>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${isDark
            ? 'bg-white/[0.04] border border-white/10 hover:border-[#13221B]/50'
            : 'bg-[#EEF2FF] border border-[#C7D2FE] hover:border-[#13221B]'
          } ${uploading ? 'opacity-70 cursor-wait' : ''}`}
      >
        {uploading ? (
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-[#13221B] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Uploading...</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="preview" className="w-10 h-10 rounded-lg object-contain" />
            <span className="text-[#13221B] text-sm font-medium">Photo selected ✓</span>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-lg bg-[#13221B]/10 flex items-center justify-center">
              <Camera size={18} className="text-[#13221B]" />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'}`}>Click to select photo</p>
              <p className={`text-xs ${isDark ? 'text-[#555577]' : 'text-[#A5B4FC]'}`}>From gallery{camera ? ' or camera' : ''}</p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          capture={camera ? 'environment' : undefined}
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
function OtpStep({ email, onVerify, onBack, role, isDark }) {
  const { verifyOtpUser, verifyOtpNgo } = useAuth()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return }
    setLoading(true); setError('')
    try {
      role === 'user' ? await verifyOtpUser(email, otp) : await verifyOtpNgo(email, otp)
      setSuccess(true)
      setTimeout(() => onVerify(), 1200)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Use 123456 for testing.')
    } finally { setLoading(false) }
  }

  const inputCls = isDark
    ? 'bg-white/[0.04] border-white/10 text-white placeholder-[#555577] focus:border-[#13221B] focus:ring-[#13221B]/20'
    : 'bg-[#EEF2FF] border-[#C7D2FE] text-[#1E1B4B] placeholder-[#A5B4FC] focus:border-[#13221B] focus:ring-[#13221B]/20'

  return (
    <div className="flex flex-col gap-4">
      {success ? (
        <div className="text-center py-4">
          <CheckCircle size={48} className="text-[#43E97B] mx-auto mb-3" />
          <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-[#1E1B4B]'}`}>Email Verified! 🎉</p>
          <p className={`text-sm mt-1 ${isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'}`}>Taking you to login…</p>
        </div>
      ) : (
        <>
          <div className="text-center">
            <div className="text-4xl mb-2">📧</div>
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-[#1E1B4B]'}`}>Check Your Email</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'}`}>Enter the OTP sent to <strong className="text-[#13221B]">{email}</strong></p>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#555577]' : 'text-[#A5B4FC]'}`}>(Use <strong>123456</strong> for testing)</p>
          </div>
          <form onSubmit={handleVerify} className="flex flex-col gap-3">
            <input
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className={`w-full px-4 py-3 rounded-xl border text-center text-xl font-bold tracking-widest focus:outline-none focus:ring-2 transition-all ${inputCls}`}
              maxLength={6}
            />
            {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">⚠ {error}</div>}
            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white hover:shadow-[0_0_28px_rgba(108,99,255,0.4)] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying…</> : 'Verify OTP'}
            </button>
            <button type="button" onClick={onBack} className={`text-sm hover:underline transition-colors text-center ${isDark ? 'text-[#7777AA] hover:text-white' : 'text-[#6366F1] hover:text-[#13221B]'}`}>
              ← Back to Registration
            </button>
          </form>
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function AuthModal({ open, onClose, initialTab = 'login' }) {
  const { loginUser, loginNgo, loginAdmin, registerUser, registerAdmin } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { getLocation, loading: gpsLoading, error: gpsError } = useGPS()

  const isDark = theme === 'dark'

  const [tab, setTab] = useState(initialTab)
  const [role, setRole] = useState('user')
  const [step, setStep] = useState('form')  // 'form' | 'otp'
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', location: '',
    latitude: null, longitude: null,
    photo: null, dateOfBirth: '', occupation: '',
  })

  if (!open) return null

  const change = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleGPS = () => {
    getLocation(({ locationStr, latitude, longitude }) => {
      setForm(f => ({ ...f, location: locationStr, latitude, longitude }))
    })
  }

  const resetForm = () => {
    setForm({ name: '', email: '', phone: '', password: '', location: '', latitude: null, longitude: null, photo: null, dateOfBirth: '', occupation: '' })
    setError(''); setSuccess(''); setStep('form')
  }

  const switchTab = (t2) => { setTab(t2); resetForm() }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')

    try {
      if (tab === 'login') {
        // ── LOGIN ────────────────────────────────────────────
        const payload = { email: form.email, password: form.password }
        if (role === 'user') {
          await loginUser(payload)
        } else if (role === 'ngo') {
          await loginNgo(payload)
        } else if (role === 'admin') {
          await loginAdmin(payload)
          navigate('/admin/dashboard')
        }
        setSuccess('Welcome back! 🎉')
        setTimeout(() => { onClose(); }, 1000)

      } else {
        // ── REGISTER ─────────────────────
        if (!form.phone) { setError('Phone number is required'); setLoading(false); return }

        const phoneClean = form.phone.replace(/\s+/g, '')
        if (!/^\d{10}$/.test(phoneClean)) {
          setError('Phone number must be exactly 10 digits.');
          setLoading(false);
          return;
        }

        if (!/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8}$/.test(form.password)) {
          setError('Password must be exactly 8 characters long and contain both letters and numbers.');
          setLoading(false);
          return;
        }

        if (role === 'user') {
          const payload = {
            name: form.name,
            email: form.email,
            password: form.password,
            phoneNumber: phoneClean,
            location: form.location,
            latitude: form.latitude,
            longitude: form.longitude,
            photoBase64: form.photo || null,
            dateOfBirth: form.dateOfBirth || null,
            occupation: form.occupation || null,
          }
          await registerUser(payload)
          setPendingEmail(form.email)
          setStep('otp')
        } else if (role === 'admin') {
          const payload = {
            name: form.name,
            email: form.email,
            password: form.password,
            phoneNumber: phoneClean,
          }
          await registerAdmin(payload)
          setSuccess('Admin registered successfully! Please login.')
          setTimeout(() => {
            setTab('login')
            setForm(f => ({ ...f, password: '' }))
            setSuccess('')
          }, 1500)
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong. Please check your details.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const afterOtpVerified = () => {
    setStep('form')
    setTab('login')
    setForm(f => ({ ...f, password: '' }))
    setSuccess('Account created! Please sign in.')
  }

  // Styles based on theme
  const modalBg = isDark ? 'bg-[#16163A] border-[#13221B]/25' : 'bg-white border-[#C7D2FE]'
  const overlayBg = isDark ? 'bg-[#07071A]/85' : 'bg-[#1E1B4B]/40'
  const inputClass = isDark
    ? 'w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-[#555577] text-sm focus:outline-none focus:border-[#13221B] focus:ring-2 focus:ring-[#13221B]/20 transition-all'
    : 'w-full px-4 py-3 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] text-[#1E1B4B] placeholder-[#A5B4FC] text-sm focus:outline-none focus:border-[#13221B] focus:ring-2 focus:ring-[#13221B]/20 transition-all'
  const labelClass = isDark ? 'text-[#8888AA] text-xs font-medium' : 'text-[#6366F1] text-xs font-medium'
  const headingClass = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subClass = isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'

  return (
    <div className={`fixed inset-0 z-[100] flex items-start justify-center p-4 pt-12 ${overlayBg} backdrop-blur-md animate-fade-up overflow-y-auto`}>
      <div className={`relative w-full max-w-md ${modalBg} border rounded-3xl p-7 shadow-[0_32px_80px_rgba(0,0,0,0.2)] animate-scale-in my-4`}>

        {/* Close */}
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-1.5 rounded-lg transition-colors ${isDark ? 'text-[#7777AA] hover:text-white hover:bg-white/5' : 'text-[#A5B4FC] hover:text-[#13221B] hover:bg-[#EEF2FF]'}`}
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#13221B] to-[#3D6A53] mb-3 shadow-[0_0_24px_rgba(108,99,255,0.35)]">
            <span className="text-white text-xl">🤝</span>
          </div>
          <h2 className={`font-['Poppins'] font-bold text-xl ${headingClass}`}>
            {step === 'otp' ? 'Verify Email' : tab === 'login' ? 'Welcome Back' : 'Join Helping Hands'}
          </h2>
          {step !== 'otp' && (
            <p className={`text-sm mt-1 ${subClass}`}>
              {tab === 'login' ? 'Sign in to your account' : 'Create your free account'}
            </p>
          )}
        </div>

        {/* OTP Step */}
        {step === 'otp' && (
          <OtpStep
            email={pendingEmail}
            role={role}
            onVerify={afterOtpVerified}
            onBack={() => setStep('form')}
            isDark={isDark}
          />
        )}

        {/* Auth Form */}
        {step === 'form' && (
          <>
            {/* Login / Register tabs */}
            <div className={`flex rounded-full p-1 mb-4 ${isDark ? 'bg-white/[0.04] border border-white/8' : 'bg-[#EEF2FF] border border-[#C7D2FE]'}`}>
              {['login', 'register'].map(t2 => (
                <button
                  key={t2}
                  onClick={() => switchTab(t2)}
                  className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${tab === t2
                      ? 'bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white shadow-[0_0_16px_rgba(108,99,255,0.35)]'
                      : isDark ? 'text-[#7777AA] hover:text-white' : 'text-[#6366F1] hover:text-[#13221B]'
                    }`}
                >
                  {t2 === 'login' ? 'Login' : 'Register'}
                </button>
              ))}
            </div>

            {/* Role selector */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'user', icon: <User size={15} />, label: 'User' },
                { id: 'ngo', icon: <Building2 size={15} />, label: 'NGO' },
                { id: 'admin', icon: <Shield size={15} />, label: 'Admin' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => { setRole(r.id); setError('') }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${role === r.id
                      ? isDark
                        ? 'bg-[#13221B]/15 border-[#13221B]/60 text-[#2E7D59]'
                        : 'bg-[#EEF2FF] border-[#13221B] text-[#13221B]'
                      : isDark
                        ? 'bg-transparent border-white/8 text-[#7777AA] hover:border-[#13221B]/30 hover:text-white'
                        : 'bg-transparent border-[#C7D2FE] text-[#6366F1] hover:border-[#13221B] hover:text-[#13221B]'
                    }`}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>

            {/* NGO Register redirect notice */}
            {tab === 'register' && role === 'ngo' && (
              <div className={`mb-4 p-4 rounded-2xl border ${isDark ? 'bg-[#13221B]/10 border-[#13221B]/30' : 'bg-[#EEF2FF] border-[#13221B]/25'}`}>
                <p className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-[#1E1B4B]'}`}>🏢 Registering as an NGO?</p>
                <p className={`text-xs mb-3 ${isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'}`}>
                  NGO registration requires additional details like your registration number, area of work, and organization description. Please use our dedicated NGO registration page.
                </p>
                <button
                  onClick={() => { onClose(); navigate('/ngos/register') }}
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(108,99,255,0.4)] hover:-translate-y-0.5 transition-all"
                >
                  Go to NGO Registration Page <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm mb-3">
                <span>⚠</span> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm mb-3">
                <CheckCircle size={15} /> {success}
              </div>
            )}

            {/* Show form only if not NGO register */}
            {!(tab === 'register' && role === 'ngo') && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {/* ── REGISTER FIELDS ──────────────────────── */}
                {tab === 'register' && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Full Name *</label>
                    <input name="name" value={form.name} onChange={change} required
                      placeholder="e.g. Rahul Sharma"
                      className={inputClass} />
                  </div>
                )}

                {/* ── EMAIL ────────────────────────────────── */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Email Address *</label>
                  <input name="email" type="email" value={form.email} onChange={change} required
                    placeholder="email@example.com" className={inputClass} />
                </div>

                {/* ── PHONE (register only) ─────────────────── */}
                {tab === 'register' && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Phone Number *</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A5B4FC]" />
                      <input name="phone" type="tel" value={form.phone} onChange={change}
                        required
                        placeholder="+91 XXXXX XXXXX"
                        className={`${inputClass} pl-9`} />
                    </div>
                  </div>
                )}

                {/* ── PASSWORD ─────────────────────────────── */}
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Password *</label>
                  <div className="relative">
                    <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={change}
                      required placeholder="Create a strong password" className={`${inputClass} pr-11`} />
                    <button type="button" onClick={() => setShowPw(s => !s)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-[#555577] hover:text-[#2E7D59]' : 'text-[#A5B4FC] hover:text-[#13221B]'}`}>
                      {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* ── REGISTER EXTRAS ───────────────────────── */}
                {tab === 'register' && role === 'user' && (
                  <>
                    {/* Date of Birth */}
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Date of Birth (optional)</label>
                      <input
                        name="dateOfBirth"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={change}
                        className={inputClass}
                      />
                    </div>

                    {/* Occupation */}
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Occupation (optional)</label>
                      <input
                        name="occupation"
                        value={form.occupation}
                        onChange={change}
                        placeholder="e.g. Student, Social Worker"
                        className={inputClass}
                      />
                    </div>

                    {/* Profile Photo */}
                    <PhotoPicker
                      value={form.photo || null}
                      onChange={(url) => setForm(f => ({ ...f, photo: url }))}
                      label="Profile Photo (optional)"
                      isDark={isDark}
                    />

                    {/* Location */}
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Location (optional)</label>
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
                        <button
                          type="button"
                          onClick={handleGPS}
                          disabled={gpsLoading}
                          className="px-3 py-3 rounded-xl bg-[#13221B]/10 border border-[#13221B]/30 text-[#13221B] hover:bg-[#13221B]/20 transition-all disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
                          title="Use my current location"
                        >
                          {gpsLoading ? <span className="w-3 h-3 border-2 border-[#13221B]/30 border-t-[#13221B] rounded-full animate-spin" /> : <Navigation size={14} />}
                          GPS
                        </button>
                      </div>
                      {gpsError && <p className="text-red-500 text-xs">{gpsError}</p>}
                      {form.latitude && <p className="text-[#43E97B] text-xs">📍 Location captured ({form.latitude.toFixed(3)}, {form.longitude.toFixed(3)})</p>}
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-1 rounded-xl font-['Poppins'] font-semibold text-sm bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white shadow-[0_0_20px_rgba(108,99,255,0.35)] hover:shadow-[0_0_32px_rgba(108,99,255,0.55)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing…</>
                    : tab === 'login' ? 'Sign In' : 'Create Account →'
                  }
                </button>
              </form>
            )}

            <p className={`text-center text-xs mt-4 ${isDark ? 'text-[#555577]' : 'text-[#A5B4FC]'}`}>
              {tab === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => switchTab(tab === 'login' ? 'register' : 'login')}
                className="text-[#13221B] hover:underline font-medium"
              >
                {tab === 'login' ? 'Register' : 'Login'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
