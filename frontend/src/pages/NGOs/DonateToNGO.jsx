import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import useScrollReveal from '../../hooks/useScrollReveal'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  CheckCircle, ArrowRight, Shield, CreditCard, Calendar, Lock,
  MapPin, Navigation, Eye, Check, Loader2, Sparkles, HelpCircle,
  TrendingUp, Compass, AlertCircle, Package
} from 'lucide-react'
import LocationAutocomplete from '../../components/LocationAutocomplete'
import bgImg from '../images/NGO_bg.jpg'

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
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json()
          const addr = data.address
          const locationStr = [
            addr.suburb || addr.neighbourhood || addr.hamlet,
            addr.city || addr.town || addr.village,
            addr.state
          ].filter(Boolean).join(', ')
          onSuccess({ locationStr, latitude, longitude })
        } catch {
          onSuccess({ locationStr: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, latitude, longitude })
        } finally {
          setGpsLoading(false)
        }
      },
      (err) => {
        setGpsError('Could not get location. Enter manually.')
        setGpsLoading(false)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [])
  return { getLocation, gpsLoading, gpsError }
}

// ── Leaflet Map Component for Self-Drop NGO location ─────────
function NgoMap({ lat, lon, name, isDark }) {
  const mapRef = useRef(null)
  const [mapInstance, setMapInstance] = useState(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance || !lat || !lon) return

    import('leaflet').then((L) => {
      L = L.default || L

      if (L && L.Icon && L.Icon.Default && L.Icon.Default.prototype) {
        delete L.Icon.Default.prototype._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })
      }

      const map = L.map(mapRef.current, {
        center: [lat, lon],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      })
      setMapInstance(map)

      L.tileLayer('https://{s.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
      }).addTo(map)

      L.marker([lat, lon])
        .addTo(map)
        .bindPopup(`<b>${name}</b><br/>Our Center`)
        .openPopup()
    })

    return () => {
      if (mapInstance) {
        mapInstance.remove()
        setMapInstance(null)
      }
    }
  }, [lat, lon, name, mapInstance])

  return (
    <div className={`relative rounded-2xl overflow-hidden border h-[220px] w-full shadow-inner ${isDark ? 'border-white/10 bg-[#0F0F2A]' : 'border-[#13221B]/20 bg-[#EEF2FF]'
      }`}>
      <div ref={mapRef} className="w-full h-full z-10" />
    </div>
  )
}

export default function DonateToNGO() {
  useScrollReveal()
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { state } = useLocation()
  const [searchParams] = useSearchParams()
  const urlNgoId = searchParams.get('ngoId') || state?.ngoId || ''

  const t = {
    ngos: {
      donateHeroLabel: 'Empower Communities',
      donateHeroTitle: 'Donate to',
      donateHeroTitleAccent: 'Verified NGOs',
      donateHeroSub: 'Your support helps verified NGOs run feeding drives, medical treatment, shelter maintenance, and animal rescue services.',
      moneyFund: 'Monetary Fund',
      donateGoods: 'Donate Goods',
      donationRegistered: 'Donation Registered!',
      paymentSuccessMsg: 'We have successfully processed your payment of',
      paymentTo: 'to',
      receiptNo: 'Receipt No',
      goodsSuccessMsg: 'Your goods donation request has been logged under your dashboard.',
      volunteerOtpLabel: 'Volunteer Collection OTP',
      volunteerOtpDesc: 'Share this OTP only with the NGO volunteer who arrives at your address to collect the items.',
      selfDropInstructions: '📍 Self-Drop Instructions',
      selfDropDesc: 'Please hand deliver the items to the center:',
    },
    common: {
      submit: 'Submit',
    }
  }

  const { getLocation, gpsLoading, gpsError } = useGPS()

  const [ngos, setNgos] = useState([])
  const [form, setForm] = useState({
    ngoId: urlNgoId,
    type: 'MONEY', // 'MONEY' | 'GOODS'
    amount: '1000',
    customAmount: '',
    message: '',
    // Goods fields
    title: '',
    category: 'GOODS',
    condition: 'GOOD',
    quantity: 1,
    pickupType: 'SELF_DROP', // 'SELF_DROP' | 'VOLUNTEER'
    location: '',
    latitude: null,
    longitude: null,
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successPayload, setSuccessPayload] = useState(null)
  const [error, setError] = useState('')
  const [userTxnId, setUserTxnId] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [utrError, setUtrError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
    }
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  const triggerToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    if (urlNgoId) {
      setForm(f => ({ ...f, ngoId: urlNgoId }))
    }
  }, [urlNgoId])

  useEffect(() => {
    api.get('/ngos')
      .then(({ data }) => {
        setNgos(Array.isArray(data) ? data : data.data || data.ngos || [])
      })
      .catch(() => {
        setNgos([
          { id: '1', name: 'Animal Rescue Alliance', location: 'Bandra, Mumbai', latitude: 19.0596, longitude: 72.8295, phoneNumber: '+91 98765 43210', upiId: 'animalrescue@upi' },
          { id: '2', name: 'Green Earth Foundation', location: 'Juhu, Mumbai', latitude: 19.1026, longitude: 72.8242, phoneNumber: '+91 99999 88888', upiId: 'greenearth@upi' },
          { id: '3', name: 'Vidyasagar Trust', location: 'Dadar, Mumbai', latitude: 19.0178, longitude: 72.8478, phoneNumber: '+91 88888 77777', upiId: 'vidyasagar@upi' }
        ])
      })
  }, [])

  const selectedNgo = ngos.find(n => n.id === form.ngoId)

  const change = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleDownloadReceipt = () => {
    if (!successPayload) return

    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = 500 * scale
    canvas.height = 760 * scale
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)

    // Background Gradient (Dark Premium Emerald theme)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 760)
    bgGradient.addColorStop(0, '#0F1F17')
    bgGradient.addColorStop(1, '#080F0B')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, 500, 760)

    // Border
    ctx.strokeStyle = 'rgba(67, 233, 123, 0.25)'
    ctx.lineWidth = 1.5
    ctx.strokeRect(15, 15, 470, 730)

    // Soft background circles
    ctx.fillStyle = 'rgba(67, 233, 123, 0.02)'
    ctx.beginPath()
    ctx.arc(450, 60, 120, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(50, 700, 100, 0, Math.PI * 2)
    ctx.fill()

    // Header Title
    ctx.fillStyle = '#43E97B'
    ctx.font = 'bold 24px "Poppins", "Inter", -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('HELPING HANDS', 250, 65)

    // Subheader
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '600 12px "Poppins", "Inter", -apple-system, sans-serif'
    ctx.fillText('OFFICIAL DONATION RECEIPT', 250, 90)

    ctx.fillStyle = '#88A090'
    ctx.font = 'italic 11px sans-serif'
    ctx.fillText('Thank you for your generous support!', 250, 110)

    // Separator line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(35, 130)
    ctx.lineTo(465, 130)
    ctx.stroke()

    let y = 175
    const drawRow = (label, val, isBold = false) => {
      ctx.textAlign = 'left'
      ctx.fillStyle = '#88A090'
      ctx.font = '12px "Inter", -apple-system, sans-serif'
      ctx.fillText(label, 40, y)

      ctx.textAlign = 'right'
      ctx.fillStyle = '#FFFFFF'
      ctx.font = isBold ? 'bold 12px "Inter", -apple-system, sans-serif' : '12px "Inter", -apple-system, sans-serif'

      let displayVal = val || 'N/A'
      if (ctx.measureText(displayVal).width > 240) {
        while (ctx.measureText(displayVal + '...').width > 240 && displayVal.length > 0) {
          displayVal = displayVal.slice(0, -1)
        }
        displayVal += '...'
      }
      ctx.fillText(displayVal, 460, y)
      y += 34
    }

    // Donor Info
    ctx.textAlign = 'left'
    ctx.fillStyle = '#43E97B'
    ctx.font = 'bold 11px "Inter", -apple-system, sans-serif'
    ctx.fillText('DONOR DETAILS', 40, y)
    y += 24

    drawRow('Name', user?.name || 'Anonymous', true)
    drawRow('Email', user?.email || 'N/A')

    // Recipient Info
    y += 12
    ctx.textAlign = 'left'
    ctx.fillStyle = '#43E97B'
    ctx.font = 'bold 11px "Inter", -apple-system, sans-serif'
    ctx.fillText('RECIPIENT NGO DETAILS', 40, y)
    y += 24

    drawRow('NGO Name', successPayload.ngo?.name || 'Verified NGO', true)
    drawRow('Registration No', successPayload.ngo?.registrationNumber || 'N/A')
    drawRow('UPI ID', successPayload.ngo?.upiId || 'N/A')

    // Donation Info
    y += 12
    ctx.textAlign = 'left'
    ctx.fillStyle = '#43E97B'
    ctx.font = 'bold 11px "Inter", -apple-system, sans-serif'
    ctx.fillText('DONATION SUMMARY', 40, y)
    y += 24

    drawRow('Date', successPayload.date || new Date().toLocaleString())
    drawRow('Transaction ID', successPayload.transactionId, true)
    drawRow('Support Message', form.message || 'None')

    // Separator line
    y += 12
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.beginPath()
    ctx.moveTo(35, y)
    ctx.lineTo(465, y)
    ctx.stroke()

    // Draw Amount box
    y += 25
    ctx.fillStyle = 'rgba(67, 233, 123, 0.08)'
    // Rounded rect
    const rx = 35, ry = y, rw = 430, rh = 65, radius = 12
    ctx.beginPath()
    ctx.moveTo(rx + radius, ry)
    ctx.lineTo(rx + rw - radius, ry)
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius)
    ctx.lineTo(rx + rw, ry + rh - radius)
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh)
    ctx.lineTo(rx + radius, ry + rh)
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius)
    ctx.lineTo(rx, ry + radius)
    ctx.quadraticCurveTo(rx, ry, rx + radius, ry)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = 'rgba(67, 233, 123, 0.35)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Text in amount box
    ctx.textAlign = 'left'
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 13px "Inter", -apple-system, sans-serif'
    ctx.fillText('TOTAL AMOUNT PAID', 55, y + 38)

    ctx.textAlign = 'right'
    ctx.fillStyle = '#43E97B'
    ctx.font = 'bold 22px "Inter", -apple-system, sans-serif'
    ctx.fillText(`₹${successPayload.amount}`, 445, y + 42)

    // Status Badge
    y += 95
    ctx.textAlign = 'center'
    ctx.fillStyle = '#43E97B'
    ctx.font = 'bold 12px "Inter", -apple-system, sans-serif'
    ctx.fillText('STATUS: COMPLETED (VERIFIED DIRECT TRANSFER)', 250, y)

    // Footer copyright/branding
    y += 40
    ctx.fillStyle = '#55665b'
    ctx.font = '10px "Inter", -apple-system, sans-serif'
    ctx.fillText('This is a computer-generated receipt. Powered by Helping Hands.', 250, y)

    // Download action
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `helping_hands_receipt_${successPayload.transactionId || 'receipt'}.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const validateUTR = (val) => {
    if (!val) {
      setUtrError('Please enter your UTR / Transaction ID after completing the payment.')
      return false
    }
    if (val.length < 8 || val.length > 30) {
      setUtrError('UTR must be between 8 and 30 characters.')
      return false
    }
    if (!/^[a-zA-Z0-9]+$/.test(val)) {
      setUtrError('UTR must only contain alphanumeric characters.')
      return false
    }
    setUtrError('')
    return true
  }

  const submitMoneyDonation = async () => {
    setLoading(true)
    setError('')
    try {
      const finalAmount = form.amount === 'Custom' ? form.customAmount : form.amount
      const transactionId = userTxnId.trim()

      await api.post('/donations', {
        title: `Monetary Donation to ${selectedNgo?.name || 'NGO'}`,
        category: 'MONEY',
        description: `UPI QR Code payment to ${selectedNgo?.upiId || 'platform'}. Message: ${form.message}`,
        quantity: 1,
        location: 'UPI QR Payment',
        recipientNgoId: form.ngoId,
        pickupType: 'SELF_DROP',
        amount: parseFloat(finalAmount),
        transactionId: transactionId,
      })

      setSuccessPayload({
        type: 'MONEY',
        amount: finalAmount,
        ngo: selectedNgo,
        transactionId: transactionId,
        date: new Date().toLocaleString(),
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleGPS = () => {
    getLocation((res) => {
      setForm(f => ({
        ...f,
        location: res.locationStr,
        latitude: res.latitude,
        longitude: res.longitude,
      }))
    })
  }

  const handleDonateInit = (e) => {
    e.preventDefault()
    if (!user) {
      setError('Please login to donate to an NGO.')
      return
    }
    if (!form.ngoId) {
      setError('Please select an NGO.')
      return
    }

    if (form.type === 'MONEY') {
      const amt = form.amount === 'Custom' ? form.customAmount : form.amount
      if (!amt || parseFloat(amt) <= 0) {
        setError('Please select or enter a valid donation amount.')
        return
      }
      if (!validateUTR(userTxnId)) {
        setError('Please enter a valid UTR / Transaction ID after completing the payment.')
        return
      }
      setError('')
      submitMoneyDonation()
    } else {
      // Direct Goods Donation Submit
      submitGoodsDonation()
    }
  }

  const submitGoodsDonation = async () => {
    setLoading(true)
    setError('')
    try {
      const isVolunteer = form.pickupType === 'VOLUNTEER'
      const generatedOtp = isVolunteer ? String(Math.floor(100000 + Math.random() * 900000)) : null

      await api.post('/donations', {
        title: form.title || `Goods Donation to ${selectedNgo?.name || 'NGO'}`,
        category: form.category,
        condition: form.condition,
        quantity: parseInt(form.quantity) || 1,
        description: form.message,
        location: isVolunteer ? form.location : (selectedNgo?.location || 'NGO Center'),
        latitude: isVolunteer ? form.latitude : selectedNgo?.latitude,
        longitude: isVolunteer ? form.longitude : selectedNgo?.longitude,
        recipientNgoId: form.ngoId,
        pickupType: form.pickupType,
        otp: generatedOtp,
      })

      setSuccessPayload({
        type: 'GOODS',
        otp: generatedOtp,
        pickupType: form.pickupType,
        ngo: selectedNgo,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Goods donation registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const nt = t.ngos || {}

  const donationTypes = [
    { val: 'MONEY', icon: <CreditCard size={18} className="text-[#2E7D59]" />, label: nt.moneyFund || 'Monetary Fund' },
    { val: 'GOODS', icon: <Package size={18} className="text-[#2E7D59]" />, label: nt.donateGoods || 'Donate Goods' },
  ]

  const presetAmounts = ['500', '1000', '2500', '5000', 'Custom']

  // Theme-aware variables
  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const mutedText = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const sectionBg = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'
  const cardBg = isDark ? 'bg-[#16163A] border-white/8' : 'bg-white border-[#E0E7FF] shadow-sm'
  const selectBg = isDark
    ? "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-[#13221B] transition-all"
    : "w-full px-4 py-3 rounded-xl bg-[#F9FAFF] border border-[#13221B]/20 text-[#1E1B4B] text-sm focus:outline-none focus:border-[#13221B] transition-all"
  const inputClass = isDark
    ? "px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-[#555577] text-sm focus:outline-none focus:border-[#13221B] transition-all"
    : "px-4 py-3 rounded-xl bg-[#F9FAFF] border border-[#13221B]/20 text-[#1E1B4B] placeholder-[#8888AA] text-sm focus:outline-none focus:border-[#13221B] transition-all"
  const labelClass = `text-xs font-semibold ${isDark ? 'text-[#8888AA]' : 'text-[#4338CA]'}`

  return (
    <div className="page-enter">
      {/* Hero Section */}
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
          <div className="section-label mb-4">{nt.donateHeroLabel || 'Empower Communities'}</div>
          <h1 className={`font-['Poppins'] font-black text-5xl mb-4 ${heroText}`}>
            {nt.donateHeroTitle} <span className="gradient-text">{nt.donateHeroTitleAccent}</span>
          </h1>
          <p className={`text-lg ${subText}`}>{nt.donateHeroSub}</p>
        </div>
      </section>

      {/* Main Content */}
      <section className={`py-16 ${sectionBg}`}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Form Column */}
            <div className="lg:col-span-3">
              {success ? (
                <div className={`border rounded-3xl p-10 text-center flex flex-col items-center justify-center ${isDark ? 'bg-[#16163A] border-[#43E97B]/30' : 'bg-white border-[#43E97B]/40 shadow-lg'
                  }`}>
                  <div className="w-16 h-16 rounded-full bg-[#43E97B]/10 border border-[#43E97B]/40 flex items-center justify-center mb-6">
                    <CheckCircle size={40} className="text-[#43E97B]" />
                  </div>
                  <h3 className={`font-['Poppins'] font-bold text-3xl mb-3 ${heroText}`}>{nt.donationRegistered || 'Donation Registered!'}</h3>

                  {successPayload?.type === 'MONEY' ? (
                    <div className="w-full max-w-lg flex flex-col items-center">
                      <div className="printable-receipt w-full p-6 rounded-2xl border text-left text-xs mb-6 bg-gray dark:bg-[#16163w]/80 border-[#13221w]/15">
                        <div className="text-center border-b pb-4 mb-4 border-white-100 dark:border-white/5">
                          <h4 className={`font-['Poppins'] font-bold text-lg ${heroText}`}>HELPING HANDS RECEIPT</h4>
                          <p className={`text-[10px] ${mutedText}`}>Thank you for your generous support!</p>
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <p className="flex justify-between">
                            <span className={mutedText}>Date:</span>
                            <span className={`font-medium ${heroText}`}>{successPayload.date || new Date().toLocaleString()}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className={mutedText}>Transaction ID:</span>
                            <span className={`font-mono font-bold ${heroText}`}>{successPayload.transactionId}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className={mutedText}>Donor Name:</span>
                            <span className={`font-semibold ${heroText}`}>{user?.name || 'Anonymous'}</span>
                          </p>
                          <p className="flex justify-between font-mono">
                            <span className={mutedText}>Donor Email:</span>
                            <span className={heroText}>{user?.email || 'N/A'}</span>
                          </p>
                          <div className="border-t border-dashed my-2 dark:border-white/10" />
                          <p className="flex justify-between">
                            <span className={mutedText}>Recipient NGO:</span>
                            <span className={`font-semibold ${heroText}`}>{successPayload.ngo?.name}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className={mutedText}>NGO Reg No:</span>
                            <span className={heroText}>{successPayload.ngo?.registrationNumber || 'N/A'}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className={mutedText}>NGO UPI ID:</span>
                            <span className={`font-mono ${heroText}`}>{successPayload.ngo?.upiId || 'N/A'}</span>
                          </p>
                          <div className="border-t border-dashed my-2 dark:border-white/10" />
                          <p className="flex justify-between">
                            <span className={mutedText}>Donation Type:</span>
                            <span className={heroText}>MONETARY CONTRIBUTION</span>
                          </p>
                          <p className="flex justify-between">
                            <span className={mutedText}>Support Message:</span>
                            <span className={`italic ${heroText}`}>{form.message || 'None'}</span>
                          </p>
                          <p className="flex justify-between text-sm font-bold border-t pt-3 border-gray-100 dark:border-white/5">
                            <span className={heroText}>Amount Paid:</span>
                            <span className="text-[#43E97B] font-mono">₹{successPayload.amount}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className={mutedText}>Payment Status:</span>
                            <span className="text-[#43E97B] font-bold uppercase">COMPLETED</span>
                          </p>
                        </div>
                      </div>

                      {/* Download Action */}
                      <div className="flex flex-wrap gap-3 justify-center mb-6 no-print">
                        <button
                          type="button"
                          onClick={handleDownloadReceipt}
                          className="px-5 py-2.5 rounded-xl border text-xs font-bold transition-all bg-[#13221B]/10 border-[#13221B]/25 text-[#2E7D59] hover:bg-[#13221B]/20 cursor-pointer flex items-center gap-1.5"
                        >
                          Download Receipt
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-md">
                      <p className={`text-sm mb-6 ${mutedText}`}>
                        {nt.goodsSuccessMsg}
                      </p>

                      {successPayload.pickupType === 'VOLUNTEER' ? (
                        <div className={`p-6 rounded-2xl text-center mb-6 border ${isDark ? 'bg-[#13221B]/10 border-[#13221B]/30' : 'bg-[#EEF2FF] border-[#13221B]/40'
                          }`}>
                          <p className="text-xs text-[#2E7D59] font-bold uppercase tracking-wider mb-2">{nt.volunteerOtpLabel || 'Volunteer Collection OTP'}</p>
                          <div className={`text-4xl font-mono font-black tracking-widest mb-3 ${heroText}`}>
                            {successPayload.otp}
                          </div>
                          <p className={`text-xs leading-relaxed ${mutedText}`}>
                            {nt.volunteerOtpDesc || 'Share this OTP only with the NGO volunteer who arrives at your address to collect the items.'}
                          </p>
                        </div>
                      ) : (
                        <div className={`p-4 rounded-xl text-left text-xs mb-6 border ${isDark ? 'bg-[#0F0F2A] border-white/5' : 'bg-[#F9FAFF] border-[#13221B]/20'
                          }`}>
                          <p className={`font-bold mb-1 ${heroText}`}>{nt.selfDropInstructions || '📍 Self-Drop Instructions'}</p>
                          <p className={`mb-3 ${mutedText}`}>{nt.selfDropDesc || 'Please hand deliver the items to the center:'}</p>
                          <p className={`font-medium mb-1 ${heroText}`}>{successPayload.ngo?.name}</p>
                          <p className={mutedText}>{successPayload.ngo?.location || 'NGO Registered Address'}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSuccess(false)
                      setSuccessPayload(null)
                      setForm(f => ({ ...f, title: '', message: '', customAmount: '' }))
                    }}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    {nt.makeAnotherDonate || 'Make Another Donation'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDonateInit} className={`border rounded-3xl p-8 flex flex-col gap-6 ${cardBg} ${isDark ? '' : 'shadow-md'}`}>
                  <div>
                    <h2 className={`font-['Poppins'] font-bold text-2xl mb-1 ${heroText}`}>{nt.supportCause || 'Support a Cause'}</h2>
                    <p className={`text-xs ${mutedText}`}>{nt.supportCauseSub || 'Choose an organization and contribution method to get started.'}</p>
                  </div>

                  {/* NGO Select */}
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>{nt.targetNgo || 'Target NGO *'}</label>
                    <select
                      name="ngoId"
                      value={form.ngoId}
                      onChange={change}
                      required
                      className={selectBg}
                    >
                      <option value="">{nt.chooseNgoPlaceholder || 'Choose a verified organization…'}</option>
                      {ngos.map(n => (
                        <option key={n.id} value={n.id}>
                          {n.name} ({n.areaOfWork || n.location || 'Verified Partner'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Donation Type Tabs */}
                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>{nt.donateMethod || 'Donation Method'}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {donationTypes.map(dt => (
                        <button
                          type="button"
                          key={dt.val}
                          onClick={() => setForm(f => ({ ...f, type: dt.val }))}
                          className={`py-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all ${form.type === dt.val
                            ? 'bg-[#13221B]/15 border-[#13221B]/60 text-[#2E7D59] shadow-[0_0_12px_rgba(108,99,255,0.15)]'
                            : isDark
                              ? 'border-white/8 text-[#7777AA] hover:border-white/20'
                              : 'border-[#13221B]/20 text-[#5A5A8A] hover:border-[#13221B]/40'
                            }`}
                        >
                          {dt.icon}
                          <span>{dt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* MONEY FORM */}
                  {form.type === 'MONEY' && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      <div className="flex flex-col gap-2">
                        <label className={labelClass}>{nt.selectAmount || 'Select Amount'}</label>
                        <div className="grid grid-cols-5 gap-2">
                          {presetAmounts.map(a => (
                            <button
                              type="button"
                              key={a}
                              onClick={() => setForm(f => ({ ...f, amount: a }))}
                              className={`py-2 rounded-xl text-xs font-bold border transition-all ${form.amount === a
                                ? 'bg-[#13221B] border-[#13221B] text-white'
                                : isDark
                                  ? 'border-white/10 text-[#8888AA] hover:border-white/20'
                                  : 'border-[#13221B]/20 text-[#5A5A8A] hover:border-[#13221B]/45'
                                }`}
                            >
                              {a === 'Custom' ? (t.common.submit === 'सबमिट करें' ? 'अन्य' : 'Custom') : `₹${a}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {form.amount === 'Custom' && (
                        <div className="flex flex-col gap-1.5">
                          <label className={labelClass}>{nt.customAmount || 'Custom Amount (₹)'}</label>
                          <input
                            type="number"
                            name="customAmount"
                            value={form.customAmount}
                            onChange={change}
                            placeholder={nt.customAmountPlaceholder || 'Enter amount in ₹'}
                            className={inputClass}
                          />
                        </div>
                      )}

                      {/* UPI DYNAMIC QR CODE INLINE */}
                      {form.ngoId && (form.amount !== 'Custom' || (form.customAmount && parseFloat(form.customAmount) > 0)) && (() => {
                        const finalAmount = form.amount === 'Custom' ? form.customAmount : form.amount
                        const upiId = selectedNgo?.upiId || 'helpinghands@upi'
                        const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(selectedNgo?.name || 'Helping Hands')}&am=${finalAmount}&cu=INR`

                        return (
                          <div className="mt-4 p-5 rounded-2xl border flex flex-col items-center gap-4 bg-gray dark:bg-[#16163w]/60 border-dashed border-[#13221w]/25">
                            <div className="text-center">
                              <p className={`text-xs font-bold ${heroText}`}>UPI Payment Option</p>
                              <p className={`text-[10px] ${mutedText} mt-0.5`}>Direct transfer to {selectedNgo?.name}</p>
                            </div>

                            {/* Device specific display */}
                            {isMobile ? (
                              <a
                                href={upiUrl}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white font-bold text-xs hover:shadow-md transition-all text-center flex items-center justify-center gap-2"
                              >
                                Open UPI App
                              </a>
                            ) : (
                              <div className="p-3 bg-white rounded-xl border shadow-inner flex flex-col items-center">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`}
                                  alt="UPI QR Code"
                                  className="w-[160px] h-[160px]"
                                />
                                <span className={`text-[9px] ${mutedText} mt-2`}>Scan using GPay, PhonePe, Paytm, BHIM, etc.</span>
                              </div>
                            )}

                            {/* Clickable UPI ID */}
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                onClick={() => {
                                  if (isMobile) {
                                    window.location.href = upiUrl
                                  } else {
                                    navigator.clipboard.writeText(upiId)
                                    triggerToast('UPI ID copied successfully.')
                                  }
                                }}
                                className="text-xs font-mono cursor-pointer hover:underline text-[#2E7D59] font-bold flex items-center gap-1.5"
                                title={isMobile ? "Click to Open UPI App" : "Click to Copy UPI ID"}
                              >
                                UPI ID: {upiId}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(upiId)
                                  triggerToast('UPI ID copied successfully.')
                                }}
                                className="p-1 rounded bg-[#13221B]/10 hover:bg-[#13221B]/20 text-[#2E7D59]"
                                title="Copy UPI ID"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                </svg>
                              </button>
                            </div>

                            {/* User Guidance Alert */}
                            <div className="w-full p-3.5 rounded-xl bg-[#43E97B]/10 border border-[#43E97B]/25 text-left">
                              <p className={`text-[11px] leading-relaxed font-semibold ${isDark ? 'text-[#43E97B]' : 'text-[#1E1B4B]'}`}>
                                Complete the payment using the QR code or UPI app. After payment, enter your UTR/Transaction ID to verify your donation.
                              </p>
                            </div>

                            {/* UTR Input */}
                            <div className="w-full flex flex-col gap-1.5 text-left">
                              <label className={labelClass}>Transaction Ref / UTR Number *</label>
                              <input
                                type="text"
                                name="userTxnId"
                                value={userTxnId}
                                onChange={(e) => {
                                  setUserTxnId(e.target.value)
                                  validateUTR(e.target.value)
                                }}
                                placeholder="Enter 12-digit UTR or Transaction ID"
                                className={`${inputClass} ${utrError ? 'border-red-500 focus:border-red-500' : ''}`}
                                required
                              />
                              {utrError && (
                                <p className="text-[10px] text-red-400 font-semibold">{utrError}</p>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* GOODS FORM */}
                  {form.type === 'GOODS' && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className={labelClass}>{nt.itemTitle || 'Item Title *'}</label>
                          <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={change}
                            placeholder={nt.itemTitlePlaceholder || 'e.g. Blankets, Rice bags'}
                            required
                            className={inputClass}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className={labelClass}>{nt.itemCategory || 'Category *'}</label>
                          <select
                            name="category"
                            value={form.category}
                            onChange={change}
                            className={selectBg}
                          >
                            <option value="CLOTHES">{t.common.submit === 'सबमिट करें' ? 'कपड़े और कंबल' : 'Clothes & Blankets'}</option>
                            <option value="FOOD">{t.common.submit === 'सबमिट करें' ? 'भोजन और अनाज' : 'Food & Grains'}</option>
                            <option value="GOODS">{t.common.submit === 'सबमिट करें' ? 'सामान्य वस्तुएं' : 'General Goods / Utensils'}</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className={labelClass}>{nt.itemCondition || 'Condition *'}</label>
                          <select
                            name="condition"
                            value={form.condition}
                            onChange={change}
                            className={selectBg}
                          >
                            <option value="NEW">{t.common.submit === 'सबमिट करें' ? 'बिल्कुल नया' : 'Brand New'}</option>
                            <option value="GOOD">{t.common.submit === 'सबमिट करें' ? 'अच्छी स्थिति' : 'Gently Used / Good'}</option>
                            <option value="USED">{t.common.submit === 'सबमिट करें' ? 'सामान्य स्थिति' : 'Fairly Used'}</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className={labelClass}>{nt.itemQuantity || 'Quantity'}</label>
                          <input
                            type="number"
                            name="quantity"
                            value={form.quantity}
                            onChange={change}
                            min="1"
                            required
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Pickup Option Selection */}
                      <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>{nt.deliveryOption || 'Delivery Option'}</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, pickupType: 'SELF_DROP' }))}
                            className={`py-3 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center gap-1 ${form.pickupType === 'SELF_DROP'
                              ? 'bg-[#13221B]/15 border-[#13221B]/60 text-[#2E7D59]'
                              : isDark
                                ? 'border-white/8 text-[#7777AA]'
                                : 'border-[#13221B]/25 text-[#5A5A8A]'
                              }`}
                          >
                            <span>{nt.dropNgoCenter || 'Drop at NGO Center'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, pickupType: 'VOLUNTEER' }))}
                            className={`py-3 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center gap-1 ${form.pickupType === 'VOLUNTEER'
                              ? 'bg-[#13221B]/15 border-[#13221B]/60 text-[#2E7D59]'
                              : isDark
                                ? 'border-white/8 text-[#7777AA]'
                                : 'border-[#13221B]/25 text-[#5A5A8A]'
                              }`}
                          >
                            <span>{nt.requestPickup || 'Request Volunteer Pickup'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Self Drop Information with Live Map Pin */}
                      {form.pickupType === 'SELF_DROP' && selectedNgo && (
                        <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${isDark ? 'bg-[#0F0F2A]/60 border-white/5' : 'bg-[#F9FAFF] border-[#13221B]/20 shadow-sm'
                          }`}>
                          <div>
                            <p className={`text-xs font-bold ${heroText}`}>{nt.ngoDropAddress || 'NGO Center Drop Address'}</p>
                            <p className={`text-xs mt-0.5 ${mutedText}`}>{selectedNgo.location || 'Address registered with center.'}</p>
                            {selectedNgo.phoneNumber && (
                              <p className={`text-[11px] mt-1 ${mutedText}`}>{nt.contactLabel || 'Contact'}: {selectedNgo.phoneNumber}</p>
                            )}
                          </div>
                          {selectedNgo.latitude && selectedNgo.longitude && (
                            <div className="flex flex-col gap-2">
                              <NgoMap lat={selectedNgo.latitude} lon={selectedNgo.longitude} name={selectedNgo.name} isDark={isDark} />
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedNgo.latitude},${selectedNgo.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#13221B]/10 border border-[#13221B]/30 text-[#2E7D59] text-xs font-bold hover:bg-[#13221B]/20 transition-all text-center"
                              >
                                <Navigation size={12} /> {nt.getDirections || 'Get Directions to NGO Center'}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Volunteer Pickup form fields */}
                      {form.pickupType === 'VOLUNTEER' && (
                        <div className={`flex flex-col gap-3 p-4 rounded-2xl border ${isDark ? 'bg-[#13221B]/5 border-[#13221B]/15' : 'bg-[#EEF2FF] border-[#13221B]/20'
                          }`}>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                              <label className={`text-xs font-semibold ${heroText}`}>{nt.pickupAddress || 'Pickup Address *'}</label>
                              <button
                                type="button"
                                onClick={handleGPS}
                                disabled={gpsLoading}
                                className="flex items-center gap-1 text-[11px] font-bold text-[#43E97B] bg-[#43E97B]/10 px-2 py-0.5 rounded border border-[#43E97B]/20 hover:bg-[#43E97B]/20 transition-all"
                              >
                                {gpsLoading ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  <Compass size={10} />
                                )}
                                {nt.locateGps || 'Locate GPS'}
                              </button>
                            </div>
                            <LocationAutocomplete
                              value={form.location}
                              onChange={(val) => setForm(f => ({ ...f, location: val }))}
                              onSelectLocation={({ locationStr, latitude, longitude }) => {
                                setForm(f => ({ ...f, location: locationStr, latitude, longitude }))
                              }}
                              placeholder={nt.collectFrom || 'Where should the volunteer collect from?'}
                              inputClass={inputClass}
                              isDark={isDark}
                            />
                            {gpsError && <p className="text-[10px] text-[#3D6A53] font-medium">⚠ {gpsError}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message of support */}
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>{nt.message || 'Message (optional)'}</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={change}
                      rows={2}
                      placeholder={nt.messagePlaceholder || 'Leave a message of support to the organization...'}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-[#3D6A53]/10 border border-[#3D6A53]/25 text-[#FF8FA3] text-xs flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white font-bold text-sm hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#13221B]/20"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    {form.type === 'MONEY' ? (nt.proceedPayment || 'Proceed to Payment') : (nt.submitRequest || 'Submit Donation Request')}
                  </button>
                </form>
              )}
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Impact Card */}
              <div className={`border rounded-2xl p-6 ${cardBg} ${isDark ? '' : 'shadow-sm'}`}>
                <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${heroText}`}>
                  <TrendingUp size={18} className="text-[#13221B]" />
                  <span>{nt.actionImpact || "Your Action's Impact"}</span>
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-[#13221B]/5 border border-[#13221B]/10">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-[#2E7D59]' : 'text-[#13221B]'}`}>{nt.impact1Title || '₹500 Donation'}</p>
                    <p className={`text-xs leading-relaxed ${mutedText}`}>
                      {nt.impact1Desc || 'Provides school bags, textbooks, and basic stationary for 2 underprivileged children.'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#43E97B]/5 border border-[#43E97B]/10">
                    <p className="text-xs font-bold text-[#43E97B] uppercase tracking-wider mb-1">{nt.impact2Title || '₹1,000 Donation'}</p>
                    <p className={`text-xs leading-relaxed ${mutedText}`}>
                      {nt.impact2Desc || 'Covers veterinary inspection, basic wound treatment, and feed for one rescued street puppy for 2 weeks.'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#3D6A53]/5 border border-[#3D6A53]/10">
                    <p className="text-xs font-bold text-[#FF8FA3] uppercase tracking-wider mb-1">{nt.impact3Title || 'General Goods'}</p>
                    <p className={`text-xs leading-relaxed ${mutedText}`}>
                      {nt.impact3Desc || 'Drop off blankets, spare clothes, or pantry staples. We deliver them to registered night shelters and care homes.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div className={`border rounded-2xl p-6 ${cardBg} ${isDark ? '' : 'shadow-sm'}`}>
                <h3 className={`font-['Poppins'] font-semibold text-base mb-4 flex items-center gap-2 ${heroText}`}>
                  <HelpCircle size={16} className="text-[#3D6A53]" />
                  <span>{nt.policyFaq || 'Donation Policy FAQ'}</span>
                </h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className={`text-xs font-bold mb-1 ${heroText}`}>{nt.policyFaq1Q || 'Is the payment gateway secure?'}</p>
                    <p className={`text-xs leading-relaxed ${mutedText}`}>
                      {nt.policyFaq1A || 'Absolutely. Payment gateways is dirctly open through NGOs UPI ID. We simulate payment processes successfully.'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs font-bold mb-1 ${heroText}`}>{nt.policyFaq2Q || 'How do volunteers confirm pickup?'}</p>
                    <p className={`text-xs leading-relaxed ${mutedText}`}>
                      {nt.policyFaq2A || 'Once you generate a pickup request, an OTP is generated. Present this code to the coordinator who visits to inspect and receive your goods.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-[#2E7D59] text-white text-xs font-bold shadow-lg flex items-center gap-2 transition-all duration-300">
          <CheckCircle size={16} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
