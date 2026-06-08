import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import api from '../../api/axios'
import {
  PawPrint, Heart, MapPin, CheckCircle, Loader2,
  ExternalLink, ChevronRight, X, Navigation
} from 'lucide-react'
import useScrollReveal from '../../hooks/useScrollReveal'
import bgImg from '../images/adopt-animals.jpg'


// ── Haversine ─────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// catEmoji is removed, we use Lucide icons instead

// ── Adopt Modal ────────────────────────────────────────────────
function AdoptModal({ animal, onClose, onConfirm, loading, isDark }) {
  const modalBg = isDark ? 'bg-[#16163A] border-[#13221B]/30' : 'bg-white border-[#E0E7FF] shadow-xl'
  const textTitle = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const textMuted = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const boxBg = isDark ? 'bg-[#0F0F2A] border border-white/8' : 'bg-[#EEF2FF] border border-[#C7D2FE]'
  const cancelBtn = isDark ? 'border-white/10 text-[#7777AA] hover:text-white' : 'border-[#C7D2FE] text-[#6366F1] hover:text-[#13221B]'
  const hasNgo = !!animal.postedByNgo

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md ${isDark ? 'bg-[#07071A]/90' : 'bg-gray-800/60'}`}>
      <div className={`relative rounded-3xl p-8 max-w-md w-full shadow-2xl ${modalBg}`}>
        <button onClick={onClose} className={`absolute top-4 right-4 ${isDark ? 'text-[#7777AA] hover:text-white' : 'text-[#6366F1] hover:text-[#13221B]'}`}>
          <X size={20} />
        </button>
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3"><PawPrint size={48} className="text-[#3D6A53]" /></div>
          <h3 className={`font-['Poppins'] font-bold text-xl mb-1 ${textTitle}`}>Adopt {animal.name || animal.category}</h3>
          <p className={`text-sm ${textMuted}`}>You're about to start the adoption process.</p>
        </div>

        {/* NGO info */}
        {hasNgo && (
          <div className={`mb-4 p-4 rounded-xl ${boxBg}`}>
            <p className={`text-xs font-bold mb-1.5 ${textTitle}`}>🏢 Listed by NGO</p>
            <p className={`text-sm font-semibold ${textTitle}`}>{animal.postedByNgo.name}</p>
            {animal.postedByNgo.phoneNumber && (
              <a
                href={`tel:${animal.postedByNgo.phoneNumber}`}
                className="mt-2 flex items-center gap-2 text-xs text-[#43E97B] hover:underline"
              >
                📞 {animal.postedByNgo.phoneNumber}
              </a>
            )}
            {animal.postedByNgo.email && (
              <a
                href={`mailto:${animal.postedByNgo.email}`}
                className="flex items-center gap-2 text-xs text-[#43E97B] hover:underline mt-0.5"
              >
                ✉️ {animal.postedByNgo.email}
              </a>
            )}
          </div>
        )}

        {animal.latitude && animal.longitude && (
          <div className={`mb-5 p-4 rounded-xl ${boxBg}`}>
            <p className={`text-sm font-semibold mb-1 ${textTitle}`}>📍 Animal's Location</p>
            <p className={`text-xs mb-3 ${textMuted}`}>{animal.location || 'See on map'}</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${animal.latitude},${animal.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#13221B]/15 border border-[#13221B]/30 text-[#2E7D59] text-sm font-semibold hover:bg-[#13221B]/25 transition-all"
            >
              <Navigation size={14} /> Get Directions to Shelter
            </a>
          </div>
        )}

        <div className="p-4 rounded-xl bg-[#3D6A53]/8 border border-[#3D6A53]/20 mb-5">
          <p className="text-[#FF8FA3] text-xs leading-relaxed">
            By confirming, you agree to complete the adoption process at the shelter. The animal will be marked as "Adopted" and removed from listings.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className={`flex-1 py-3 rounded-xl border text-sm transition-colors ${cancelBtn}`}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-sm font-bold hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing…</> : '❤️ Confirm Adoption'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Animal Card ────────────────────────────────────────────────
function AnimalCard({ animal, onAdopt, userLocation, isDark }) {
  const [imgErr, setImgErr] = useState(false)
  const hasNgo = !!animal.postedByNgo

  const distance = userLocation && animal.latitude && animal.longitude
    ? haversine(userLocation.lat, userLocation.lng, animal.latitude, animal.longitude)
    : null

  const cardBg = isDark
    ? 'bg-[#16163A] border-white/8 hover:border-[#3D6A53]/30 hover:shadow-[0_12px_40px_rgba(255,101,132,0.15)]'
    : 'bg-white border-[#E0E7FF] hover:border-[#3D6A53]/40 shadow-sm hover:shadow-lg'
  const textTitle = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const textMuted = isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'

  return (
    <div className={`border rounded-2xl overflow-hidden hover:-translate-y-2 transition-all duration-300 flex flex-col ${cardBg}`}>
      {/* Photo */}
      <div className={`h-48 relative overflow-hidden ${isDark ? 'bg-[#0F0F2A]' : 'bg-[#F0F4FF]'}`}>
        {animal.photos?.[0] && !imgErr ? (
          <img src={animal.photos[0]} alt={animal.name} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3D6A53]/10 to-[#13221B]/10">
            <PawPrint size={48} className="text-[#3D6A53] opacity-60" />
          </div>
        )}
        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-bold bg-[#43E97B]/20 border border-[#43E97B]/40 text-[#43E97B]">
          Available
        </div>
        {distance !== null && (
          <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${isDark ? 'bg-[#07071A]/80 text-white' : 'bg-white/80 text-[#13221B]'}`}>
            📍 {distance.toFixed(1)} km
          </div>
        )}
        {/* NGO badge */}
        {hasNgo && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-[#3D6A53]/90 border border-[#43E97B]/40 text-white text-[10px] font-semibold backdrop-blur-sm">
            🏢 {animal.postedByNgo.name}
          </div>
        )}
        {/* User badge */}
        {animal.postedByUser && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-[#3D6A53]/90 border border-[#43E97B]/40 text-white text-[10px] font-semibold backdrop-blur-sm">
            👤 {animal.postedByUser.name}
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-['Poppins'] font-bold text-base ${textTitle}`}>{animal.name || animal.category}</h3>
          {animal.age && <span className={`text-xs ${textMuted}`}>{animal.age}</span>}
        </div>
        <div className={`flex items-center gap-1 text-xs mb-2 ${textMuted}`}>
          <MapPin size={11} />
          <span className="truncate">{animal.location || 'Location not specified'}</span>
        </div>
        {animal.description && (
          <p className={`text-xs leading-relaxed mb-3 line-clamp-2 ${textMuted}`}>{animal.description}</p>
        )}

        <div className="mt-auto flex gap-2 pt-3">
          {animal.latitude && animal.longitude && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${animal.latitude},${animal.longitude}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[#13221B]/30 text-[#2E7D59] hover:bg-[#13221B]/10 transition-all"
            >
              <ExternalLink size={11} /> Map
            </a>
          )}
          <button
            onClick={() => onAdopt(animal)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#3D6A53] to-[#13221B] text-white hover:shadow-[0_0_16px_rgba(255,101,132,0.3)] hover:-translate-y-0.5 transition-all"
          >
            <Heart size={12} className="fill-white" /> Adopt Me
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function AdoptPet() {
  useScrollReveal()
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate  = useNavigate()

  const [animals, setAnimals]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('ALL')
  const [selectedAnimal, setSelectedAnimal] = useState(null)
  const [adopting, setAdopting]     = useState(false)
  const [adoptedId, setAdoptedId]   = useState(null)
  const [authModal, setAuthModal]   = useState(false)
  const [AuthModal, setAuthModalComp] = useState(null)
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    import('../../components/AuthModal').then(m => setAuthModalComp(() => m.default))
  }, [])

  // Get user location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  // Load animals
  const loadAnimals = () => {
    setLoading(true)
    api.get('/animals?status=AVAILABLE&limit=50')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.animals || data.data || []
        setAnimals(list)
      })
      .catch(() => setAnimals([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAnimals() }, [])

  const handleAdoptClick = (animal) => {
    if (!user) { setAuthModal(true); return }
    setSelectedAnimal(animal)
  }

  const confirmAdopt = async () => {
    if (!selectedAnimal) return
    setAdopting(true)
    try {
      await api.post(`/animals/${selectedAnimal.id}/adopt`)
      setAdoptedId(selectedAnimal.id)
      setAnimals(prev => prev.filter(a => a.id !== selectedAnimal.id))
      setSelectedAnimal(null)
    } catch (err) {
      console.error('Adopt error:', err)
    } finally {
      setAdopting(false)
    }
  }

  const categories = ['ALL', 'Dog', 'Cat', 'Bird', 'Rabbit', 'Other']
  const filtered = filter === 'ALL' ? animals : animals.filter(a => a.category === filter)

  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const sectionBg = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'
  const filterText = isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'
  const countText = isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'
  const countVal = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const filterBtn = (active) => active
    ? 'bg-[#13221B] border-[#13221B] text-white shadow-[0_0_12px_rgba(108,99,255,0.3)]'
    : isDark ? 'border-white/10 text-[#7777AA] hover:border-[#13221B]/30 hover:text-white' : 'border-[#C7D2FE] text-[#6366F1] hover:border-[#13221B] hover:text-[#13221B]'
  const stepCardBg = isDark ? 'bg-[#16163A] border-white/8' : 'bg-white border-[#E0E7FF] shadow-sm'

  return (
    <div className="page-enter">
      {authModal && AuthModal && (
        <AuthModal open={authModal} onClose={() => setAuthModal(false)} initialTab="login" />
      )}
      {selectedAnimal && (
        <AdoptModal
          animal={selectedAnimal}
          onClose={() => setSelectedAnimal(null)}
          onConfirm={confirmAdopt}
          loading={adopting}
          isDark={isDark}
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
          <div className="section-label mb-4">Animal Adoption</div>
          <h1 className={`font-['Poppins'] font-black text-5xl mb-4 ${heroText}`}>
            Find Your <span className="gradient-text">Forever Friend</span>
          </h1>
          <p className={`text-lg ${subText}`}>Every animal deserves a loving home. Browse available animals near you.</p>
        </div>
      </section>

      <section className={`py-12 ${sectionBg}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">

          {/* Success toast */}
          {adoptedId && (
            <div className="mb-6 p-4 rounded-2xl bg-[#43E97B]/10 border border-[#43E97B]/30 flex items-center gap-3 animate-fade-up">
              <CheckCircle size={20} className="text-[#43E97B] shrink-0" />
              <p className="text-[#43E97B] text-sm font-semibold">Adoption initiated! 🎉 Please visit the shelter to complete the process.</p>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-8 reveal">
            <p className={`text-sm ${filterText}`}>Filter by type:</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${filterBtn(filter === c)}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className={`ml-auto text-sm ${countText}`}>
              <span className={`font-bold ${countVal}`}>{filtered.length}</span> animals available
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="text-center py-20">
              <Loader2 size={40} className="text-[#3D6A53] animate-spin mx-auto mb-4" />
              <p className={filterText}>Loading available animals…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="flex justify-center mb-4"><PawPrint size={48} className="text-[#3D6A53]" /></div>
              <h3 className={`font-bold text-xl mb-2 ${heroText}`}>No animals available yet</h3>
              <p className={`text-sm mb-4 ${filterText}`}>Check back soon, or help by reporting animals in need.</p>
              <button onClick={() => navigate('/animals/rescue')}
                className="px-6 py-2.5 rounded-xl border border-[#3D6A53]/30 text-[#FF8FA3] text-sm font-semibold hover:bg-[#3D6A53]/10 transition-all cursor-pointer">
                Report an Animal
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 reveal">
              {filtered.map(animal => (
                <AnimalCard
                  key={animal.id}
                  animal={animal}
                  onAdopt={handleAdoptClick}
                  userLocation={userLocation}
                  isDark={isDark}
                />
              ))}
            </div>
          )}

          {/* How adoption works */}
          <div className="mt-16 reveal">
            <h2 className={`font-['Poppins'] font-bold text-2xl mb-6 text-center ${heroText}`}>How Adoption Works</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { num:'01', title:'Browse Animals', desc:'Find an animal near you by browsing our listings.' },
                { num:'02', title:'Click Adopt', desc:'Confirm your interest and get directions to the shelter.' },
                { num:'03', title:'Complete at Shelter', desc:'Visit the shelter to fill paperwork and take your new friend home!' },
              ].map((step, i) => (
                <div key={i} className={`border rounded-2xl p-6 text-center ${stepCardBg}`}>
                  <div className="font-['Poppins'] font-black text-5xl gradient-text opacity-25 mb-3">{step.num}</div>
                  <h4 className={`font-semibold text-sm mb-2 ${heroText}`}>{step.title}</h4>
                  <p className={`text-xs leading-relaxed ${filterText}`}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
