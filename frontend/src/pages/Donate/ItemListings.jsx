import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../../api/axios'
import { MapPin, Navigation, Package, AlertCircle, Loader2, Route, Search, Inbox } from 'lucide-react'
import useScrollReveal from '../../hooks/useScrollReveal'
import { useTheme } from '../../context/ThemeContext'
import bgImg from '../images/donate_item.jpg'
import imgClothes from '../images/donate_clothes.png'
import imgFood from '../images/donate_food.png'
import imgGoods from '../images/donate_goods.png'


// ── Haversine distance (km) ───────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Category badge colors ─────────────────────────────────────
const catColors = {
  CLOTHES: { bg: 'rgba(108,99,255,0.15)', border: 'rgba(108,99,255,0.4)', text: '#2E7D59', img: imgClothes, label: 'CLOTHES' },
  FOOD: { bg: 'rgba(67,233,123,0.12)', border: 'rgba(67,233,123,0.35)', text: '#43E97B', img: imgFood, label: 'FOOD' },
  GOODS: { bg: 'rgba(255,179,71,0.12)', border: 'rgba(255,179,71,0.35)', text: '#FFB347', img: imgGoods, label: 'GOODS' },
  BOOKS: { bg: 'rgba(99,179,237,0.12)', border: 'rgba(99,179,237,0.35)', text: '#63B3ED', img: imgGoods, label: 'BOOKS' },
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

  try {
    const { data } = await api.post('/public/osm-shelters', { query })

    return (data.elements || []).map(el => {
      const elLat = el.lat || el.center?.lat
      const elLon = el.lon || el.center?.lon
      const dist = haversine(lat, lon, elLat, elLon)
      const type = el.tags?.amenity === 'veterinary' || el.tags?.shop === 'veterinary'
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
  } catch (err) {
    console.error('Error fetching Overpass shelters:', err)
    return []
  }
}

// ── Map (lazy-loaded) ─────────────────────────────────────────
function DonationMap({ donations, campaigns, rescues, ngos, userLocation, onSelectItem }) {
  const mapRef = useRef(null)
  const [mapInstance, setMapInstance] = useState(null)
  const markersRef = useRef([])
  const [osmShelters, setOsmShelters] = useState([])

  const userMarkerRef = useRef(null)
  const userCircleRef = useRef(null)

  // Fetch nearby OSM shelters when userLocation is set
  useEffect(() => {
    if (!userLocation) return
    findNearbyVetAndShelters(userLocation.lat, userLocation.lng, 15)
      .then(found => setOsmShelters(found))
      .catch(() => setOsmShelters([]))
  }, [userLocation])

  useEffect(() => {
    if (!mapRef.current || mapInstance) return

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

      const center = userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629]
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
      setMapInstance(map)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      map.setView(center, 12)

      if (userLocation) {
        const userIcon = L.divIcon({
          html: `<div style="width:18px;height:18px;background:#43E97B;border:4px solid white;border-radius:50%;box-shadow:0 0 10px rgba(67,233,123,0.6)"></div>`,
          iconSize: [18, 18], iconAnchor: [9, 9], className: ''
        })
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('<b>Your Location</b>')
        userCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
          radius: 10000, color: '#13221B', fillColor: '#13221B', fillOpacity: 0.04,
          weight: 1, dashArray: '6,4'
        }).addTo(map)
      }
    })
  }, [])

  useEffect(() => {
    if (!mapInstance || !userLocation) return
    import('leaflet').then((L) => {
      L = L.default || L
      if (userMarkerRef.current) userMarkerRef.current.remove()
      if (userCircleRef.current) userCircleRef.current.remove()

      const userIcon = L.divIcon({
        html: `<div style="width:18px;height:18px;background:#43E97B;border:4px solid white;border-radius:50%;box-shadow:0 0 10px rgba(67,233,123,0.6)"></div>`,
        iconSize: [18, 18], iconAnchor: [9, 9], className: ''
      })
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapInstance)
        .bindPopup('<b>Your Location</b>')
      userCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: 10000, color: '#13221B', fillColor: '#13221B', fillOpacity: 0.04,
        weight: 1, dashArray: '6,4'
      }).addTo(mapInstance)

      mapInstance.setView([userLocation.lat, userLocation.lng], 12)
    })
  }, [userLocation, mapInstance])

  useEffect(() => {
    if (!mapInstance) return
    import('leaflet').then((L) => {
      L = L.default || L
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      // 1. Plot donations
      donations.forEach(d => {
        if (!d.latitude || !d.longitude) return
        const cat = catColors[d.category] || catColors.GOODS
        const icon = L.divIcon({
          html: `<div style="background:${cat.bg};border:2px solid ${cat.border};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;backdrop-filter:blur(4px);box-shadow:0 2px 6px rgba(0,0,0,0.15);"><span style="color:${cat.text};font-weight:bold;font-size:10px">${d.category.slice(0, 3)}</span></div>`,
          iconSize: [34, 34], iconAnchor: [17, 17], className: ''
        })
        const m = L.marker([d.latitude, d.longitude], { icon })
          .addTo(mapInstance)
          .bindPopup(`
            <div style="font-family:Inter,sans-serif;min-width:160px">
              <span style="background:#2e7d59;color:white;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:bold">DONATION</span>
              <h4 style="margin:4px 0 2px 0;color:#1e1b4b">${d.title || d.category}</h4>
              <span style="color:#666;font-size:11px">${d.location || ''}</span><br/>
              ${d.distance !== undefined ? `<span style="color:#13221B;font-size:11px">${d.distance.toFixed(1)} km away</span><br/>` : ''}
              <a href="https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}" target="_blank" style="color:#2e7d59;font-size:12px;font-weight:600;display:inline-block;margin-top:6px">Get Directions →</a>
            </div>
          `)
        m.on('click', () => onSelectItem(d))
        markersRef.current.push(m)
      })

      // 2. Plot campaigns
      if (campaigns) {
        campaigns.forEach(c => {
          if (!c.latitude || !c.longitude) return
          const icon = L.divIcon({
            html: `<div style="background:rgba(99,102,241,0.15);border:2px solid rgba(99,102,241,0.5);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;backdrop-filter:blur(4px);box-shadow:0 2px 6px rgba(0,0,0,0.15);"><span style="color:#6366F1;font-weight:bold;font-size:10px">DRV</span></div>`,
            iconSize: [34, 34], iconAnchor: [17, 17], className: ''
          })
          const m = L.marker([c.latitude, c.longitude], { icon })
            .addTo(mapInstance)
            .bindPopup(`
              <div style="font-family:Inter,sans-serif;min-width:180px">
                <span style="background:#6366F1;color:white;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:bold">CAMPAIGN</span>
                <h4 style="margin:4px 0 2px 0;color:#1e1b4b">${c.name}</h4>
                <p style="margin:0;font-size:11px;color:#4f46e5">Type: ${c.type || 'Other'}</p>
                <p style="margin:4px 0;font-size:11px;color:#555">${c.description ? c.description.slice(0, 85) + '...' : ''}</p>
                <p style="margin:0;font-size:10px;color:#888">📍 ${c.location || ''}</p>
                <a href="https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}" target="_blank" style="color:#2e7d59;font-size:12px;font-weight:600;display:inline-block;margin-top:6px">Get Directions →</a>
              </div>
            `)
          markersRef.current.push(m)
        })
      }

      // 3. Plot rescues
      if (rescues) {
        rescues.forEach(r => {
          if (!r.latitude || !r.longitude) return
          const icon = L.divIcon({
            html: `<div style="background:rgba(239,68,68,0.15);border:2px solid rgba(239,68,68,0.5);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;backdrop-filter:blur(4px);box-shadow:0 2px 6px rgba(0,0,0,0.15);"><span style="color:#ef4444;font-weight:bold;font-size:10px">ESC</span></div>`,
            iconSize: [34, 34], iconAnchor: [17, 17], className: ''
          })
          const m = L.marker([r.latitude, r.longitude], { icon })
            .addTo(mapInstance)
            .bindPopup(`
              <div style="font-family:Inter,sans-serif;min-width:180px">
                <span style="background:#ef4444;color:white;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:bold">RESCUE REQUEST</span>
                <h4 style="margin:4px 0 2px 0;color:#1e1b4b">${r.animalType} - ${r.condition}</h4>
                <p style="margin:4px 0;font-size:11px;color:#555">${r.description ? r.description.slice(0, 85) + '...' : ''}</p>
                <p style="margin:0;font-size:10px;color:#888">📍 ${r.location || ''}</p>
                <p style="margin:2px 0 0 0;font-size:11px;color:#ef4444;font-weight:bold">Status: ${r.status}</p>
                <a href="https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}" target="_blank" style="color:#2e7d59;font-size:12px;font-weight:600;display:inline-block;margin-top:6px">Get Directions →</a>
              </div>
            `)
          markersRef.current.push(m)
        })
      }

      // 4. Plot NGOs
      if (ngos) {
        ngos.forEach(n => {
          if (!n.latitude || !n.longitude) return
          const icon = L.divIcon({
            html: `<div style="background:rgba(16,185,129,0.15);border:2px solid rgba(16,185,129,0.5);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;backdrop-filter:blur(4px);box-shadow:0 2px 6px rgba(0,0,0,0.15);"><span style="color:#10b981;font-weight:bold;font-size:10px">NGO</span></div>`,
            iconSize: [34, 34], iconAnchor: [17, 17], className: ''
          })
          const m = L.marker([n.latitude, n.longitude], { icon })
            .addTo(mapInstance)
            .bindPopup(`
              <div style="font-family:Inter,sans-serif;min-width:180px">
                <span style="background:#10b981;color:white;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:bold">NGO PARTNER</span>
                <h4 style="margin:4px 0 2px 0;color:#1e1b4b">${n.name}</h4>
                <p style="margin:0;font-size:11px;color:#059669">Area: ${n.areaOfWork || 'General'}</p>
                <p style="margin:4px 0;font-size:11px;color:#555">${n.description ? n.description.slice(0, 85) + '...' : ''}</p>
                <p style="margin:0;font-size:10px;color:#888">📍 ${n.location || ''}</p>
                <a href="https://www.google.com/maps/dir/?api=1&destination=${n.latitude},${n.longitude}" target="_blank" style="color:#2e7d59;font-size:12px;font-weight:600;display:inline-block;margin-top:6px">Get Directions →</a>
              </div>
            `)
          markersRef.current.push(m)
        })
      }

      // 5. Plot OSM Shelters
      if (osmShelters) {
        osmShelters.forEach(s => {
          if (!s.lat || !s.lon) return
          const icon = L.divIcon({
            html: `<div style="background:rgba(217,70,239,0.15);border:2px solid rgba(217,70,239,0.5);width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;backdrop-filter:blur(4px);box-shadow:0 2px 6px rgba(0,0,0,0.15);"><span style="color:#d946ef;font-weight:bold;font-size:10px">VET</span></div>`,
            iconSize: [34, 34], iconAnchor: [17, 17], className: ''
          })
          const m = L.marker([s.lat, s.lon], { icon })
            .addTo(mapInstance)
            .bindPopup(`
              <div style="font-family:Inter,sans-serif;min-width:160px">
                <span style="background:#d946ef;color:white;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:bold">SHELTER / VET</span>
                <h4 style="margin:4px 0 2px 0;color:#1e1b4b">${s.name}</h4>
                <span style="color:#d946ef;font-size:11px;font-weight:500">${s.type}</span><br/>
                <span style="color:#666;font-size:11px">${s.distance.toFixed(1)} km away</span><br/>
                <a href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}" target="_blank" style="color:#2e7d59;font-size:12px;font-weight:600;display:inline-block;margin-top:6px">Get Directions →</a>
              </div>
            `)
          markersRef.current.push(m)
        })
      }
    })
  }, [donations, campaigns, rescues, ngos, osmShelters, mapInstance])

  return (
    <div style={{ height: '420px', borderRadius: '16px', overflow: 'hidden' }} ref={mapRef}>
    </div>
  )
}

// ── Donation Card ─────────────────────────────────────────────
function DonationCard({ item, onDirections, isDark }) {
  const cat = catColors[item.category] || catColors.GOODS
  const [imgErr, setImgErr] = useState(false)

  const cardBg = isDark
    ? 'bg-[#16163A] border-white/8 hover:border-[#13221B]/30 hover:shadow-[0_8px_32px_rgba(108,99,255,0.15)]'
    : 'bg-white border-[#E0E7FF] hover:border-[#13221B]/35 shadow-sm hover:shadow-md'
  const textTitle = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const textMuted = isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'
  const textFaint = isDark ? 'text-[#555577]' : 'text-[#A5B4FC]'

  return (
    <div className={`border rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 ${cardBg}`}>
      {/* Photo */}
      <div className={`h-40 relative overflow-hidden ${isDark ? 'bg-[#0F0F2A]' : 'bg-[#F0F4FF]'}`}>
        {item.photos?.[0] && !imgErr ? (
          <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        ) : (
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `linear-gradient(to top, rgba(7, 7, 26, 0.8) 0%, rgba(7, 7, 26, 0.2) 100%), url(${cat.img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        {/* Category badge */}
        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: cat.bg, border: `1px solid ${cat.border}`, color: cat.text }}>
          {item.category}
        </div>
        {/* Distance badge — only if calculated */}
        {item.distance !== undefined && item.distance !== null && (
          <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${isDark ? 'bg-[#07071A]/80 text-white' : 'bg-white/85 text-[#13221B]'}`}>
            📍 {item.distance.toFixed(1)} km
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className={`font-['Poppins'] font-semibold text-sm mb-1 line-clamp-2 ${textTitle}`}>{item.title || `${cat.icon} ${item.category}`}</h3>
        {item.condition && <p className={`text-xs mb-1 ${textFaint}`}>Condition: <span className={textMuted}>{item.condition}</span></p>}
        <p className={`text-xs mb-2 ${textFaint}`}>Donated by: <span className={textMuted}>{item.donor?.name || item.donorNgo?.name || 'Anonymous'}</span></p>
        <p className={`text-xs line-clamp-2 mb-3 ${textMuted}`}>{item.description || item.location}</p>
        <div className={`flex items-center gap-1.5 text-xs mb-3 ${textFaint}`}>
          <MapPin size={11} />
          <span className="truncate">{item.location || 'Location not specified'}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs mb-4 ${textFaint}`}>
          <Package size={11} />
          <span>Qty: {item.quantity || 1}</span>
          {item.pickupType && <span className="ml-auto text-[#13221B]/70">{item.pickupType}</span>}
        </div>
        <button
          onClick={() => onDirections(item)}
          className="w-full py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white hover:shadow-[0_0_16px_rgba(108,99,255,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
        >
          <Route size={13} /> Get Directions
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
export default function ItemListings() {
  useScrollReveal()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [allDonations, setAllDonations] = useState([])   // raw data — never mutated
  const [displayed, setDisplayed] = useState([])          // what is shown in the grid
  const [userLocation, setUserLocation] = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [radius, setRadius] = useState(10)
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState('grid')
  const [locationEnabled, setLocationEnabled] = useState(false) // true only when user explicitly enabled

  const [campaigns, setCampaigns] = useState([])
  const [rescues, setRescues] = useState([])
  const [ngos, setNgos] = useState([])

  // ── Step 1: load donations — IMMEDIATELY show all ──────────
  useEffect(() => {
    api.get('/donations?limit=200')
      .then(({ data }) => {
        const raw = data.data || data.donations || data || []
        const arr = Array.isArray(raw) ? raw : []
        setAllDonations(arr)
        setDisplayed(arr)          // show everything right away
        setDataLoading(false)
      })
      .catch(() => {
        setAllDonations([])
        setDisplayed([])
        setDataLoading(false)
      })

    // Fetch campaigns, rescues, and NGOs for map view
    api.get('/campaigns?limit=200')
      .then(({ data }) => setCampaigns(data || []))
      .catch(() => { })

    api.get('/rescues?limit=200')
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : []
        setRescues(list.filter(r => r.status === 'OPEN' || r.status === 'ASSIGNED'))
      })
      .catch(() => { })

    api.get('/ngos?limit=200')
      .then(({ data }) => setNgos(data || []))
      .catch(() => { })
  }, [])

  // ── Step 2: apply filters whenever deps change ─────────────
  useEffect(() => {
    let result = allDonations.filter(d => d.status === 'PENDING')

    // Category filter
    if (filter !== 'ALL') {
      result = result.filter(d => d.category === filter)
    }

    // Location filter — only if user explicitly enabled location
    if (locationEnabled && userLocation) {
      result = result
        .map(d => {
          if (d.latitude != null && d.longitude != null) {
            return { ...d, distance: haversine(userLocation.lat, userLocation.lng, d.latitude, d.longitude) }
          }
          return { ...d, distance: undefined }  // no coords → still include, just no badge
        })
        .filter(d => d.distance === undefined || d.distance <= radius)
        .sort((a, b) => {
          if (a.distance === undefined) return 1
          if (b.distance === undefined) return -1
          return a.distance - b.distance
        })
    }

    setDisplayed(result)
  }, [allDonations, filter, locationEnabled, userLocation, radius])

  // ── Get location — only when user clicks the button ────────
  const getMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.')
      return
    }
    setLocLoading(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationEnabled(true)
        setLocLoading(false)
      },
      () => {
        setError('Could not get your location. Showing all donations.')
        setLocLoading(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [])

  const openDirections = (item) => {
    if (item.latitude && item.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`, '_blank')
    } else if (item.location) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`, '_blank')
    }
  }

  const categories = ['ALL', 'CLOTHES', 'FOOD', 'GOODS', 'BOOKS']

  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const sectionBg = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'
  const mutedText = isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'

  const filterBtnClass = (active) => active
    ? 'bg-[#13221B] border-[#13221B] text-white shadow-sm'
    : isDark
      ? 'border-white/10 text-[#BBBBD8] hover:border-[#13221B]/30'
      : 'border-[#13221B]/20 text-[#13221B] hover:border-[#13221B] hover:bg-[#EEF2FF]/40'
  const viewToggleBg = isDark ? 'bg-[#0F0F2A] border-white/10' : 'bg-white border-[#E0E7FF]'
  const statsBoxBg = isDark ? 'bg-[#16163A]/50 border-white/5 text-[#BBBBD8]' : 'bg-white border-[#E0E7FF] text-[#1E1B4B]'
  const mapContainerBg = isDark ? 'bg-[#16163A] border-white/8' : 'bg-white border-[#E0E7FF]'
  const selectedItemBg = isDark ? 'bg-[#0F0F2A] border-white/5' : 'bg-[#F0F4FF] border-[#C7D2FE]'

  return (
    <div className="page-enter">
      <section
        className="page-hero-bg pt-32 pb-14 text-center relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(var(--hero-overlay-start), var(--hero-overlay-end)), url(${bgImg})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-[700px] mx-auto px-4 relative z-10">
          <div className="section-label mb-4">Browse Donations</div>
          <h1 className={`font-['Poppins'] font-black text-5xl mb-4 ${heroText}`}>
            Find Items <span className="gradient-text">Near You</span>
          </h1>
          <p className={`text-lg ${subText}`}>
            {locationEnabled ? `Showing ${displayed.length} donations within ${radius} km` : `Browse all ${allDonations.length} available donations`}
          </p>
        </div>
      </section>

      <section className={`py-12 ${sectionBg}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">

          {/* Controls bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6 reveal">

            {/* Location button */}
            <button
              onClick={getMyLocation}
              disabled={locLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${locationEnabled
                ? 'bg-[#43E97B]/10 border-[#43E97B]/40 text-[#43E97B]'
                : 'bg-[#13221B]/10 border-[#13221B]/40 text-[#2E7D59] hover:bg-[#13221B]/20'
                }`}
            >
              {locLoading
                ? <><span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />Getting location…</>
                : locationEnabled
                  ? <><Navigation size={14} />📍 Near me ({radius} km)</>
                  : <><Navigation size={14} />Find near me</>
              }
            </button>

            {/* Radius slider — only when location active */}
            {locationEnabled && (
              <div className="flex items-center gap-2">
                <span className={`text-xs ${mutedText}`}>Radius:</span>
                <input
                  type="range" min="2" max="50" step="2" value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                  className="w-24 accent-[#13221B]"
                />
                <span className="text-[#2E7D59] text-xs font-bold w-12">{radius} km</span>
              </div>
            )}

            {/* Category filter */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${filterBtnClass(filter === c)}`}
                >
                  {c === 'ALL' ? 'All Items' : c}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className={`ml-auto flex rounded-xl overflow-hidden border ${viewToggleBg}`}>
              {['grid', 'map'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-2 text-xs font-semibold transition-all ${view === v ? 'bg-[#13221B] text-white' : `${mutedText} hover:text-[#13221B]`}`}>
                  {v === 'grid' ? '⊞ Grid' : '🗺 Map'}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-[#FFB347]/10 border border-[#FFB347]/25 text-[#FFB347] text-sm mb-5">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Stats bar */}
          <div className="flex flex-wrap gap-3 mb-6 reveal">
            <div className={`px-4 py-2.5 rounded-xl border text-sm ${statsBoxBg}`}>
              <span className={mutedText}>Showing </span>
              <span className="font-bold">{displayed.length}</span>
              <span className={mutedText}> of {allDonations.length} donations</span>
            </div>
            {locationEnabled && displayed.filter(d => d.distance !== undefined).length > 0 && (
              <div className="px-4 py-2.5 rounded-xl bg-[#43E97B]/10 border border-[#43E97B]/25 text-sm text-[#43E97B]">
                Nearest: {Math.min(...displayed.filter(d => d.distance !== undefined).map(d => d.distance)).toFixed(1)} km away
              </div>
            )}
          </div>

          {/* Map view */}
          {view === 'map' && (
            <div className="mb-8 reveal">
              <div className={`border rounded-2xl p-4 ${mapContainerBg}`}>
                <DonationMap
                  donations={displayed.filter(d => d.latitude && d.longitude)}
                  campaigns={campaigns}
                  rescues={rescues}
                  ngos={ngos}
                  userLocation={userLocation}
                  onSelectItem={setSelected}
                />
                {selected && (
                  <div className={`mt-4 p-4 rounded-xl flex items-center justify-between gap-4 ${selectedItemBg}`}>
                    <div>
                      <p className={`font-semibold text-sm ${heroText}`}>{selected.title || selected.category}</p>
                      <p className={`text-xs ${mutedText}`}>{selected.location} {selected.distance !== undefined ? `• ${selected.distance.toFixed(1)} km` : ''}</p>
                    </div>
                    <button
                      onClick={() => openDirections(selected)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white whitespace-nowrap"
                    >
                      🗺 Get Directions
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grid */}
          {dataLoading ? (
            <div className="text-center py-20">
              <Loader2 size={40} className="text-[#13221B] animate-spin mx-auto mb-4" />
              <p className={mutedText}>Loading donations…</p>
            </div>
          ) : displayed.length === 0 && allDonations.length === 0 ? (
            <div className="text-center py-20">
              <Inbox size={48} className="mx-auto text-indigo-500 mb-4" />
              <h3 className={`font-bold text-xl mb-2 ${heroText}`}>No donations listed yet</h3>
              <p className={`text-sm ${mutedText}`}>Be the first to list a donation!</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-20">
              <Search size={48} className="mx-auto text-indigo-500 mb-4" />
              <h3 className={`font-bold text-xl mb-2 ${heroText}`}>
                {locationEnabled ? `No ${filter === 'ALL' ? '' : filter + ' '}donations within ${radius} km` : `No ${filter} donations found`}
              </h3>
              <p className={`text-sm mb-4 ${mutedText}`}>
                {locationEnabled ? 'Try expanding the radius or changing the category filter.' : 'Try a different category.'}
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {filter !== 'ALL' && (
                  <button onClick={() => setFilter('ALL')}
                    className="px-6 py-2.5 rounded-xl bg-[#13221B]/10 border border-[#13221B]/30 text-[#2E7D59] text-sm font-semibold hover:bg-[#13221B]/20 transition-all">
                    Show All Categories
                  </button>
                )}
                {locationEnabled && (
                  <button onClick={() => setRadius(r => Math.min(r + 10, 50))}
                    className="px-6 py-2.5 rounded-xl border border-[#13221B]/30 text-[#2E7D59] text-sm font-semibold hover:bg-[#13221B]/10 transition-all">
                    Expand to {Math.min(radius + 10, 50)} km
                  </button>
                )}
              </div>
            </div>
          ) : view === 'grid' ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 reveal">
              {displayed.map((item) => (
                <DonationCard key={item.id} item={item} onDirections={openDirections} isDark={isDark} />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
