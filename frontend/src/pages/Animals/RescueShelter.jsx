import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import {
  PawPrint, MapPin, Navigation, Camera, CheckCircle, Phone,
  ArrowRight, AlertCircle, X, ExternalLink, Loader2, Heart
} from 'lucide-react'
import useScrollReveal from '../../hooks/useScrollReveal'
import { useTheme } from '../../context/ThemeContext'
import LocationAutocomplete from '../../components/LocationAutocomplete'
import bgImg from '../images/rescue-animals.jpg'

// ── Distance helper ───────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// ── Overpass OSM search ───────────────────────────────────────
async function findNearbyVetAndShelters(lat, lon, radiusKm = 10) {
  const r = radiusKm * 1000
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="veterinary"](around:${r},${lat},${lon});
      node["amenity"="animal_shelter"](around:${r},${lat},${lon});
      node["amenity"="animal_boarding"](around:${r},${lat},${lon});
      node["shop"="veterinary"](around:${r},${lat},${lon});
      way["amenity"="veterinary"](around:${r},${lat},${lon});
      way["amenity"="animal_shelter"](around:${r},${lat},${lon});
    );
    out center;
  `.trim()

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
  const data = await res.json()

  return (data.elements || []).map(el => {
    const elLat = el.lat || el.center?.lat
    const elLon = el.lon || el.center?.lon
    const dist  = haversine(lat, lon, elLat, elLon)
    const type  = el.tags?.amenity === 'veterinary' || el.tags?.shop === 'veterinary'
      ? 'Veterinary Clinic' : 'Animal Shelter'
    return {
      id: el.id,
      name: el.tags?.name || (type === 'Veterinary Clinic' ? 'Veterinary Clinic' : 'Animal Shelter'),
      type,
      phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
      address: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', ') || null,
      lat: elLat, lon: elLon,
      distance: dist,
    }
  }).sort((a, b) => a.distance - b.distance).slice(0, 8)
}

// ── Combined NGO & OSM Shelter search ──────────────────────────
async function findNearbyHelpCenters(lat, lon, radiusKm = 10) {
  // 1. Fetch OSM shelters
  let osmShelters = [];
  try {
    osmShelters = await findNearbyVetAndShelters(lat, lon, radiusKm);
  } catch (err) {
    console.error('Error fetching OSM shelters:', err);
  }

  // 2. Fetch database NGOs
  let dbNgos = [];
  try {
    const { data } = await api.get('/ngos');
    const ngoList = Array.isArray(data) ? data : data.data || data.ngos || [];
    dbNgos = ngoList
      .filter(ngo => {
        if (!ngo.latitude || !ngo.longitude) return false;
        // Check if animal welfare
        const area = ngo.areaOfWork || '';
        return area.toLowerCase().includes('animal');
      })
      .map(ngo => {
        const dist = haversine(lat, lon, ngo.latitude, ngo.longitude);
        return {
          id: ngo.id,
          name: ngo.name,
          type: 'Animal Welfare NGO',
          isVerifiedPartner: true,
          phone: ngo.phoneNumber,
          address: ngo.location,
          lat: ngo.latitude,
          lon: ngo.longitude,
          distance: dist,
        };
      })
      .filter(ngo => ngo.distance <= radiusKm);
  } catch (err) {
    console.error('Error fetching database NGOs:', err);
  }

  // 3. Combine both lists and sort by distance
  const combined = [...dbNgos, ...osmShelters];
  combined.sort((a, b) => a.distance - b.distance);
  return combined;
}

// ── Mini Leaflet Map ──────────────────────────────────────────
function ShelterMap({ shelters, userLat, userLon }) {
  const mapRef = React.useRef(null)
  const [mapInstance, setMapInstance] = useState(null)
  const markersRef = React.useRef([])

  useEffect(() => {
    if (!mapRef.current || mapInstance || shelters.length === 0) return
    import('leaflet').then((L) => {
      L = L.default || L
      if (L && L.Icon && L.Icon.Default && L.Icon.Default.prototype) {
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })
      }

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
      setMapInstance(map)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)
      map.setView([userLat, userLon], 13)

      // User marker
      const userIcon = L.divIcon({
        html: `<div style="width:14px;height:14px;background:#43E97B;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(67,233,123,0.3)"></div>`,
        iconSize:[14,14], iconAnchor:[7,7], className:''
      })
      L.marker([userLat, userLon], { icon: userIcon }).addTo(map).bindPopup('<b>Your Location</b>')
    })
  }, [shelters])

  useEffect(() => {
    if (!mapInstance) return
    import('leaflet').then((L) => {
      L = L.default || L
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      shelters.forEach(s => {
        if (!s.lat || !s.lon) return
        const iconHtml = s.isVerifiedPartner
          ? `<div style="background:rgba(46,125,89,0.2);border:2.5px solid #2E7D59;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 0 10px rgba(46,125,89,0.4)">✨</div>`
          : `<div style="background:rgba(61,106,83,0.25);border:2px solid rgba(61,106,83,0.7);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px">${s.type === 'Veterinary Clinic' ? '🏥' : '🐾'}</div>`
        
        const icon = L.divIcon({
          html: iconHtml,
          iconSize: s.isVerifiedPartner ? [38,38] : [34,34],
          iconAnchor: s.isVerifiedPartner ? [19,19] : [17,17],
          className: ''
        })
        const m = L.marker([s.lat, s.lon], { icon })
          .addTo(mapInstance)
          .bindPopup(`
            <div style="font-family:Inter,sans-serif;min-width:170px;padding:2px">
              <b style="color:#1a1a3e;font-size:13px">${s.name}</b><br/>
              <span style="color:#3D6A53;font-size:11px;font-weight:600">${s.type}</span><br/>
              ${s.isVerifiedPartner ? '<span style="display:inline-block;background:rgba(46,125,89,0.1);color:#2E7D59;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;border:1px solid rgba(46,125,89,0.2);margin-top:3px;margin-bottom:3px">✨ Verified Partner</span><br/>' : ''}
              <span style="color:#666;font-size:11px">${s.distance.toFixed(1)} km away</span><br/>
              <div style="margin-top:6px">
                <a href="https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${s.lat},${s.lon}" target="_blank" style="color:#2E7D59;font-size:12px;font-weight:600;text-decoration:none">Get Directions →</a>
              </div>
            </div>
          `)
        markersRef.current.push(m)
      })
    })
  }, [shelters, mapInstance, userLat, userLon])

  if (shelters.length === 0) return null
  return (
    <div style={{ height: '280px', borderRadius: '14px', overflow: 'hidden' }} ref={mapRef}>
    </div>
  )
}

function ShelterCard({ shelter, userLat, userLon, isDark }) {
  const isVet = shelter.type === 'Veterinary Clinic'
  const cardBg = shelter.isVerifiedPartner
    ? (isDark ? 'bg-[#16163A] border-[#2E7D59]/40 hover:border-[#2E7D59]/70 shadow-[0_0_15px_rgba(46,125,89,0.15)]' : 'bg-[#F4FBF7] border-[#2E7D59]/35 hover:border-[#2E7D59]/50 shadow-md shadow-[#2E7D59]/5')
    : (isDark ? 'bg-[#16163A] border-white/8 hover:border-[#3D6A53]/30' : 'bg-white border-[#E0E7FF] hover:border-[#3D6A53]/40 shadow-sm')
  const textPrimary = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const textMuted = isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'
  return (
    <div className={`border rounded-2xl p-4 hover:-translate-y-1 transition-all duration-200 ${cardBg}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{shelter.isVerifiedPartner ? '✨' : (isVet ? '🏥' : '🐾')}</span>
          <div>
            <p className={`font-semibold text-sm ${textPrimary}`}>{shelter.name}</p>
            <p className="text-[#3D6A53] text-xs font-medium">{shelter.type}</p>
            {shelter.isVerifiedPartner && (
              <span className="inline-block bg-[#2E7D59]/10 text-[#2E7D59] border border-[#2E7D59]/25 text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1">
                Verified NGO
              </span>
            )}
          </div>
        </div>
        <span className="text-[#43E97B] text-xs font-bold shrink-0 bg-[#43E97B]/10 px-2 py-1 rounded-full">
          {shelter.distance.toFixed(1)} km
        </span>
      </div>
      {shelter.address && (
        <div className={`flex items-center gap-1.5 text-xs mb-3 ${textMuted}`}>
          <MapPin size={11} /> {shelter.address}
        </div>
      )}
      <div className="flex gap-2">
        {shelter.phone && (
          <a
            href={`tel:${shelter.phone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#43E97B]/10 border border-[#43E97B]/30 text-[#43E97B] text-xs font-semibold hover:bg-[#43E97B]/20 transition-all"
          >
            <Phone size={12} /> Call
          </a>
        )}
        <a
          href={`https://www.google.com/maps/dir/?api=1${userLat ? `&origin=${userLat},${userLon}` : ''}&destination=${shelter.lat},${shelter.lon}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#13221B]/10 border border-[#13221B]/30 text-[#2E7D59] text-xs font-semibold hover:bg-[#13221B]/20 transition-all"
        >
          <ExternalLink size={12} /> Directions
        </a>
      </div>
    </div>
  )
}

// ── Photo Picker ──────────────────────────────────────────────
function PhotoPicker({ photos, onChange, isDark }) {
  const inputRef = React.useRef(null)
  const [uploadingCount, setUploadingCount] = useState(0)
  const labelColor = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const uploadBtnBg = isDark
    ? 'border-2 border-dashed border-[#13221B]/30 hover:border-[#13221B]/60'
    : 'border-2 border-dashed border-[#13221B]/40 bg-[#EEF2FF] hover:border-[#13221B]'

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const slotsAvailable = 3 - photos.length
    const filesToUpload = files.slice(0, slotsAvailable)

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

  return (
    <div>
      <label className={`text-xs font-medium ${labelColor}`}>Photos of the animal</label>
      <div className="flex flex-wrap gap-2 mt-1.5">
        {photos.map((p, i) => (
          <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10">
            <img src={p} alt="" className="w-full h-full object-contain" />
            <button type="button" onClick={() => onChange(prev => prev.filter((_,j) => j !== i))}
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
              <X size={8} className="text-white" />
            </button>
          </div>
        ))}
        {Array.from({ length: uploadingCount }).map((_, i) => (
          <div key={`loading-${i}`} className="w-16 h-16 rounded-xl border border-dashed flex items-center justify-center bg-black/10">
            <span className="w-4 h-4 border-2 border-[#13221B] border-t-transparent rounded-full animate-spin" />
          </div>
        ))}
        {photos.length + uploadingCount < 3 && (
          <button type="button" onClick={() => inputRef.current?.click()}
            className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${uploadBtnBg}`}>
            <Camera size={14} className="text-[#13221B]" />
            <span className="text-[#13221B] text-[10px]">Add</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={handleFiles} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function RescueShelter() {
  useScrollReveal()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [form, setForm] = useState({
    animalType: 'Dog', condition: '', description: '',
    location: '', latitude: null, longitude: null, animalName: '',
  })
  const [photos, setPhotos] = useState([])
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [shelters, setShelters] = useState([])
  const [shelterLoading, setShelterLoading] = useState(false)
  const [sheltersPreview, setSheltersPreview] = useState([])  // shown before submit
  const [shelterPreviewLoading, setShelterPreviewLoading] = useState(false)
  const [isNear, setIsNear] = useState(false)
  const [authModal, setAuthModal] = useState(false)

  const [openRescues, setOpenRescues] = useState([])
  const [rescuesLoading, setRescuesLoading] = useState(false)

  const fetchOpenRescues = useCallback(async () => {
    setRescuesLoading(true)
    try {
      const res = await api.get('/rescues?status=OPEN')
      setOpenRescues(res.data || [])
    } catch (err) {
      console.error('Error fetching open rescues:', err)
    } finally {
      setRescuesLoading(false)
    }
  }, [])

  const handleClaimRescue = async (rescueId) => {
    try {
      await api.put(`/rescues/${rescueId}/status`, { status: 'ASSIGNED' })
      alert('Rescue claimed successfully! Redirecting you to your claimed cases...')
      navigate('/ngos/dashboard', { state: { activeTab: 'rescues' } })
    } catch (err) {
      alert(err.response?.data?.message || 'Could not claim rescue request.')
    }
  }

  useEffect(() => {
    fetchOpenRescues()
  }, [fetchOpenRescues])

  const isForAdoption = form.condition === 'For Adoption'

  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const getGPS = useCallback(() => {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported'); return }
    setGpsLoading(true); setGpsError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`)
          const data = await res.json()
          const addr = data.address
          const landmark = addr.amenity || addr.tourism || addr.shop || addr.building || addr.man_made || addr.leisure || null
          const road = addr.house_number ? `${addr.house_number}, ${addr.road || ''}`.trim() : addr.road
          const area = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.county
          const city = addr.city || addr.town || addr.village || addr.district
          const loc = [landmark, road, area, city, addr.state].filter(Boolean).join(', ')
          setForm(f => ({ ...f, location: loc, latitude, longitude }))

          // ── Immediately fetch nearby shelters ──────────────
          setShelterPreviewLoading(true)
          try {
            const found = await findNearbyHelpCenters(latitude, longitude, 10)
            setSheltersPreview(found)
          } catch (_) {
            setSheltersPreview([])
          } finally {
            setShelterPreviewLoading(false)
          }
        } catch {
          setForm(f => ({ ...f, latitude, longitude, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }))
        }
        setGpsLoading(false)
      },
      () => { setGpsError('Could not get location. Enter manually.'); setGpsLoading(false) },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { setAuthModal(true); return }
    if (!form.description || !form.location) {
      setError('Please add a description and location before submitting.')
      return
    }
    setLoading(true); setError('')

    try {
      await api.post('/rescues', {
        animalType: form.animalType,
        description: form.description,
        condition: form.condition,
        location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        photos,
      })

      // ── If "For Adoption" — auto-create an animal listing ──
      if (isForAdoption) {
        try {
          await api.post('/animals', {
            name: form.animalName || null,
            category: form.animalType,
            location: form.location,
            latitude: form.latitude,
            longitude: form.longitude,
            description: form.description,
            photos,
          })
        } catch (adoptErr) {
          console.warn('Could not create adoption listing:', adoptErr.message)
        }
      }

      setSubmitted(true)

      // Find nearby shelters for post-submit display
      if (form.latitude && form.longitude) {
        setShelterLoading(true)
        try {
          const found = await findNearbyHelpCenters(form.latitude, form.longitude, 10)
          setShelters(found)
          setIsNear(found.some(s => s.distance <= 2))
        } catch {
          setShelters([])
        } finally {
          setShelterLoading(false)
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const animalTypes = ['Dog','Cat','Bird','Cow','Monkey','Horse','Snake','Other']
  const conditions  = ['Injured','Sick','Malnourished','Abandoned','Trapped','Aggressive','For Adoption','Other']

  const [AuthModal, setAuthModalComp] = useState(null)
  React.useEffect(() => {
    import('../../components/AuthModal').then(m => setAuthModalComp(() => m.default))
  }, [])

  const inputClass = isDark
    ? "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-[#555577] text-sm focus:outline-none focus:border-[#13221B] transition-all"
    : "w-full px-4 py-3 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] text-[#1E1B4B] placeholder-[#A5B4FC] text-sm focus:outline-none focus:border-[#13221B] transition-all"

  const selectClass = isDark
    ? "px-4 py-3 rounded-xl bg-[#0F0F2A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#13221B] transition-all"
    : "px-4 py-3 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] text-[#1E1B4B] text-sm focus:outline-none focus:border-[#13221B] transition-all"

  const labelClass = isDark ? "text-[#8888AA] text-xs font-medium" : "text-[#6366F1] text-xs font-medium"
  const labelMutedClass = isDark ? "text-[#555577]" : "text-[#A5B4FC]"

  const sectionBg = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'
  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const textMuted = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  
  const formCardBg = isDark ? 'bg-[#16163A] border-white/8' : 'bg-white border-[#E0E7FF] shadow-md'
  const sidebarCardBg = isDark ? 'bg-[#16163A] border-[#3D6A53]/20' : 'bg-white border-[#E0E7FF] shadow-md'
  const sidebarGuideBg = isDark ? 'bg-[#16163A] border-white/8' : 'bg-white border-[#E0E7FF] shadow-md'

  return (
    <div className="page-enter">
      {authModal && AuthModal && (
        <AuthModal open={authModal} onClose={() => setAuthModal(false)} initialTab="login" />
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
          <div className="section-label mb-4">Emergency Rescue</div>
          <h1 className={`font-['Poppins'] font-black text-5xl mb-4 ${heroText}`}>
            Found an <span className="gradient-text">Animal in Need?</span>
          </h1>
          <p className={`text-lg ${subText}`}>Report immediately. We'll find the nearest shelter, vet, or NGO for help.</p>
        </div>
      </section>

      <section className={`py-16 ${sectionBg}`}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          {/* Urgent Open Rescues Section */}
          <div className="mb-12">
            <h2 className={`font-['Poppins'] font-black text-3xl mb-2 flex items-center gap-2 ${heroText}`}>
              <span>🚨</span> Urgent <span className="gradient-text">Open Rescues</span>
            </h2>
            <p className={`text-sm mb-6 ${textMuted}`}>Below are active rescue reports from citizens. If you are a rescue center or NGO, please claim these cases to help save them.</p>

            {rescuesLoading ? (
              <div className="flex items-center justify-center py-10 gap-2">
                <Loader2 className="animate-spin text-[#3D6A53]" />
                <span className={textMuted}>Loading open rescue requests...</span>
              </div>
            ) : openRescues.length === 0 ? (
              <div className={`p-8 text-center rounded-2xl border ${isDark ? 'bg-[#16163A]/40 border-white/5' : 'bg-white border-[#E0E7FF]'} shadow-sm`}>
                <p className={`text-sm ${textMuted}`}>No open rescue reports right now. All animals are safe! ❤️</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {openRescues.map(rescue => (
                  <div
                    key={rescue.id}
                    onClick={() => {
                      if (user?.role === 'ngo') {
                        handleClaimRescue(rescue.id)
                      }
                    }}
                    className={`border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 ${
                      user?.role === 'ngo'
                        ? 'cursor-pointer hover:scale-[1.02] hover:border-[#3D6A53] hover:shadow-[0_4px_20px_rgba(61,106,83,0.15)]'
                        : ''
                    } ${
                      isDark ? 'bg-[#16163A] border-white/8 hover:border-[#3D6A53]/30' : 'bg-white border-[#E0E7FF] hover:border-[#3D6A53]/40 shadow-sm'
                    }`}
                  >
                    <div>
                      {rescue.photos && rescue.photos.length > 0 ? (
                        <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
                          <img src={rescue.photos[0]} alt={rescue.animalType} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-full h-40 rounded-xl bg-[#3D6A53]/10 flex items-center justify-center mb-4">
                          <PawPrint size={40} className="text-[#3D6A53]/30" />
                        </div>
                      )}
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FF8FA3]/15 text-[#FF8FA3]">
                          {rescue.animalType}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#3D6A53]/15 text-[#2E7D59]">
                          {rescue.condition}
                        </span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'} mb-1`}>
                        Reported: {new Date(rescue.createdAt).toLocaleString()}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'} mb-2`}>
                        Reported by: <span className="font-semibold">{rescue.reporter?.name || 'Anonymous'}</span>
                      </p>
                      <p className={`text-sm font-semibold mb-2 ${heroText}`}>Description:</p>
                      <p className={`text-xs leading-relaxed mb-4 line-clamp-3 ${textMuted}`}>
                        {rescue.description}
                      </p>
                      <div className={`flex items-center gap-1.5 text-xs mb-4 ${textMuted}`}>
                        <MapPin size={12} className="shrink-0 text-[#2E7D59]" />
                        <span className="truncate">{rescue.location}</span>
                      </div>
                    </div>
                    {user?.role === 'ngo' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClaimRescue(rescue.id)
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#3D6A53] hover:bg-[#2E7D59] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Heart size={12} className="fill-white" /> Claim & Rescue Animal
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-5 gap-10">

            {/* Form */}
            <div className="lg:col-span-3 reveal-left">
              {!submitted ? (
                <>
                  <form onSubmit={handleSubmit} className={`border rounded-3xl p-8 flex flex-col gap-5 ${formCardBg}`}>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 rounded-xl bg-[#3D6A53]/15 flex items-center justify-center">
                        <PawPrint size={20} className="text-[#3D6A53]" />
                      </div>
                      <h2 className={`font-['Poppins'] font-bold text-2xl ${heroText}`}>Report a Rescue</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Animal Type *</label>
                        <select name="animalType" value={form.animalType} onChange={change}
                          className={`w-full ${selectClass}`}>
                          {animalTypes.map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>Condition *</label>
                        <select name="condition" value={form.condition} onChange={change} required
                          className={`w-full ${selectClass}`}>
                          <option value="">Select condition…</option>
                          {conditions.map(c => (
                            <option key={c} value={c}>
                              {c === 'For Adoption' ? '❤️ For Adoption' : c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* For Adoption — extra fields */}
                    {isForAdoption && (
                      <div className={`border rounded-2xl p-4 flex flex-col gap-3 ${isDark ? 'bg-[#3D6A53]/10 border-[#3D6A53]/25' : 'bg-[#EEF2FF] border-[#C7D2FE]'}`}>
                        <div className="flex items-center gap-2">
                          <Heart size={16} className="text-[#3D6A53]" />
                          <p className={`text-sm font-semibold ${heroText}`}>This animal will be listed for adoption</p>
                        </div>
                        <p className={`text-xs ${textMuted}`}>
                          After submitting, this animal will appear in the <strong>Adopt a Pet</strong> section with your details and photos.
                        </p>
                        <div className="flex flex-col gap-1">
                          <label className={labelClass}>Animal Name (optional)</label>
                          <input name="animalName" value={form.animalName} onChange={change}
                            placeholder="e.g. Buddy, Mittens…"
                            className={inputClass} />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Description * <span className={`text-[10px] ${labelMutedClass}`}>(what you see, urgency level)</span></label>
                      <textarea name="description" value={form.description} onChange={change} required rows={4}
                        placeholder="Describe the animal's situation in detail. E.g. 'A brown dog with a bleeding leg, unable to walk, near the main road gate…'"
                        className={`${inputClass} resize-none`} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>
                        Exact Location * <span className="text-[#3D6A53] text-[10px] font-bold">REQUIRED for shelters to reach you</span>
                      </label>
                      <div className="flex gap-2">
                        <LocationAutocomplete
                          value={form.location}
                          onChange={(val) => setForm(f => ({ ...f, location: val }))}
                          onSelectLocation={async ({ locationStr, latitude, longitude }) => {
                            setForm(f => ({ ...f, location: locationStr, latitude, longitude }))
                            
                            // ── Immediately fetch nearby shelters ──────────────
                            setShelterPreviewLoading(true)
                            try {
                              const found = await findNearbyHelpCenters(latitude, longitude, 10)
                              setSheltersPreview(found)
                            } catch (_) {
                              setSheltersPreview([])
                            } finally {
                              setShelterPreviewLoading(false)
                            }
                          }}
                          placeholder="Street, landmark, area, city…"
                          inputClass={inputClass}
                          isDark={isDark}
                        />
                        <button
                          type="button"
                          onClick={getGPS}
                          disabled={gpsLoading}
                          title="Use my GPS location"
                          className="px-4 rounded-xl bg-[#13221B]/15 border border-[#13221B]/30 text-[#2E7D59] hover:bg-[#13221B]/25 transition-all disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
                        >
                          {gpsLoading
                            ? <span className="w-3 h-3 border-2 border-[#2E7D59]/30 border-t-[#2E7D59] rounded-full animate-spin" />
                            : <Navigation size={14} />
                          }
                          GPS
                        </button>
                      </div>
                      {gpsError && <p className="text-[#FF8FA3] text-xs">{gpsError}</p>}
                      {form.latitude && <p className="text-[#43E97B] text-xs">📍 Precise GPS coordinates captured — nearby shelters shown below</p>}

                      {/* ── Pre-submit shelter preview ──────────────── */}
                      {(shelterPreviewLoading || sheltersPreview.length > 0) && (
                        <div className={`mt-3 border rounded-2xl p-4 ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🗺️</span>
                            <p className={`font-semibold text-sm ${heroText}`}>Nearby Animal Help Centers</p>
                            <span className={`ml-auto text-xs ${textMuted}`}>(within 10 km)</span>
                          </div>
                          {shelterPreviewLoading ? (
                            <div className="flex items-center gap-2 py-4 justify-center">
                              <Loader2 size={18} className="animate-spin text-[#43E97B]" />
                              <span className={`text-sm ${textMuted}`}>Searching nearby shelters…</span>
                            </div>
                          ) : (
                            <>
                              <ShelterMap
                                shelters={sheltersPreview}
                                userLat={form.latitude}
                                userLon={form.longitude}
                              />
                              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                                {sheltersPreview.map(s => (
                                  <ShelterCard
                                    key={s.id}
                                    shelter={s}
                                    userLat={form.latitude}
                                    userLon={form.longitude}
                                    isDark={isDark}
                                  />
                                ))}
                              </div>
                              {sheltersPreview.length === 0 && (
                                <p className={`text-sm text-center py-4 ${textMuted}`}>No shelters found in OpenStreetMap nearby. You can still submit the rescue request.</p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <PhotoPicker photos={photos} onChange={setPhotos} isDark={isDark} />

                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-[#3D6A53]/10 border border-[#3D6A53]/25 text-[#FF8FA3] text-sm">
                        <AlertCircle size={15} /> {error}
                      </div>
                    )}

                    <button type="submit" disabled={loading}
                      className="w-full py-3.5 rounded-xl font-['Poppins'] font-bold text-sm bg-gradient-to-r from-[#3D6A53] to-[#13221B] text-white hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(255,101,132,0.4)] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                      {loading
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</>
                        : isForAdoption
                          ? <><Heart size={16} className="fill-white" /> List for Adoption <ArrowRight size={16} /></>
                          : <>🚨 Submit Rescue Request <ArrowRight size={16} /></>
                      }
                    </button>

                    {!user && (
                      <p className={`text-center text-xs ${isDark ? 'text-[#555577]' : 'text-[#6366F1]'}`}>
                        <button type="button" onClick={() => setAuthModal(true)} className="text-[#2E7D59] hover:underline font-bold">Login</button> to save your rescue history.
                      </p>
                    )}
                  </form>
                </>
              ) : (
                <div className={`border rounded-3xl p-8 text-center ${isDark ? 'bg-[#16163A] border-[#43E97B]/30' : 'bg-white border-green-200 shadow-md'}`}>
                  <CheckCircle size={52} className="text-[#43E97B] mx-auto mb-4" />
                  <h3 className={`font-['Poppins'] font-bold text-2xl mb-2 ${heroText}`}>
                    {isForAdoption ? 'Listed for Adoption! ❤️' : 'Rescue Reported! 🐾'}
                  </h3>
                  <p className={`mb-4 ${isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'}`}>
                    {isForAdoption
                      ? 'The animal has been listed in the Adopt a Pet section. Thank you for giving it a chance!'
                      : 'Your rescue request has been submitted. Please stay with the animal if safe to do so.'
                    }
                  </p>

                  {/* Notification message */}
                  <div className={`p-4 rounded-xl mb-5 text-left ${isDark ? 'bg-[#13221B]/20 border border-[#3D6A53]/25' : 'bg-[#EEF2FF] border border-[#C7D2FE]'}`}>
                    <p className="text-[#43E97B] font-semibold text-sm mb-1">📢 NGOs & Volunteers Notified</p>
                    <p className={`text-xs leading-relaxed ${textMuted}`}>
                      Registered NGOs, shelters, and volunteers within 10 km of your location have been notified. They will see your report, photos, and location in their dashboard.
                    </p>
                  </div>

                  {isNear && (
                    <div className="p-4 rounded-xl bg-[#3D6A53]/10 border border-[#3D6A53]/30 text-left mb-4">
                      <p className="text-[#FF8FA3] font-semibold text-sm">🚨 A rescue center is within 2 km of you!</p>
                      <p className="text-[#3D6A53]/70 text-xs mt-1">Please stay with the animal — a rescue team may reach you soon. Call the nearest center below.</p>
                    </div>
                  )}
                  {shelterLoading ? (
                    <div className={`flex items-center justify-center gap-2 text-sm ${isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'}`}>
                      <Loader2 size={18} className="animate-spin" /> Finding nearby shelters and vets…
                    </div>
                  ) : shelters.length > 0 ? (
                    <div className="text-left mt-4">
                      <p className={`font-bold text-sm mb-3 ${heroText}`}>📍 Nearest Animal Help Centers:</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {shelters.map(s => (
                          <ShelterCard
                            key={s.id}
                            shelter={s}
                            userLat={form.latitude}
                            userLon={form.longitude}
                            isDark={isDark}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className={`text-sm mt-2 ${isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'}`}>
                      No shelters found in OpenStreetMap nearby. Try searching "animal shelter near me" or call your local municipality.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 flex flex-col gap-5 reveal-right">
              <div className={`border rounded-2xl p-5 ${sidebarCardBg}`}>
                <h4 className={`font-['Poppins'] font-bold text-base mb-3 ${heroText}`}>📞 Emergency Contacts</h4>
                {[
                  { name:'Wildlife SOS India',   phone:'9871963535', type:'Wildlife' },
                  { name:'Animal Helpline (PFA)', phone:'44074477',   type:'General' },
                  { name:'SPCA Animal Helpline',  phone:'25561000',   type:'General' },
                  { name:'Police Animal Cell',    phone:'100',        type:'Emergency' },
                ].map((c, i) => (
                  <div key={i} className={`flex items-center justify-between py-2.5 border-b last:border-0 ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                    <div>
                      <p className={`text-xs font-semibold ${heroText}`}>{c.name}</p>
                      <p className={`text-xs ${isDark ? 'text-[#555577]' : 'text-[#6366F1]'}`}>{c.type}</p>
                    </div>
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#43E97B]/10 border border-[#43E97B]/25 text-[#43E97B] text-xs font-bold hover:bg-[#43E97B]/20 transition-all">
                      <Phone size={11} /> {c.phone}
                    </a>
                  </div>
                ))}
              </div>

              {/* For Adoption info card */}
              <div className={`border rounded-2xl p-5 ${isDark ? 'bg-[#3D6A53]/10 border-[#3D6A53]/20' : 'bg-[#EEF2FF] border-[#C7D2FE]'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={16} className="text-[#3D6A53]" />
                  <h4 className={`font-['Poppins'] font-bold text-sm ${heroText}`}>Listing for Adoption?</h4>
                </div>
                <p className={`text-xs leading-relaxed ${textMuted}`}>
                  Select <strong>"For Adoption"</strong> as the condition. Your report will also appear in the <strong>Adopt a Pet</strong> section so loving families can find this animal.
                </p>
              </div>

              <div className={`border rounded-2xl p-5 ${sidebarGuideBg}`}>
                <h4 className={`font-['Poppins'] font-bold text-sm mb-3 ${heroText}`}>What to do while waiting</h4>
                {[
                  '🛡️ Keep distance from aggressive animals',
                  '💧 Offer water if the animal is thirsty',
                  '🌡️ Provide shade if injured/overheated',
                  '📸 Take photos for the rescue team',
                  '📍 Mark exact GPS location to share',
                  '🤫 Speak calmly and avoid loud noises',
                ].map((tip, i) => (
                  <p key={i} className={`text-xs py-1.5 border-b last:border-0 ${isDark ? 'text-[#7777AA] border-white/5' : 'text-[#6366F1] border-gray-100'}`}>{tip}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
