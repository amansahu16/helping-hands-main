import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User, Mail, Phone, Calendar, MapPin, Briefcase, Award, Heart,
  Sparkles, Shield, Edit3, Trash2, CheckCircle, Clock, XCircle,
  Loader2, Star, Save, Plus, ArrowRight, MessageSquare, Clipboard, List
} from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import useScrollReveal from '../../hooks/useScrollReveal'
import LocationAutocomplete from '../../components/LocationAutocomplete'
import bgImg from '../images/Volunteer.jpg'


function calculateAge(dobString) {
  if (!dobString) return 'N/A'
  const dob = new Date(dobString)
  if (isNaN(dob.getTime())) return 'N/A'
  const diffMs = Date.now() - dob.getTime()
  const ageDate = new Date(diffMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

export default function VolunteerDashboard() {
  useScrollReveal()
  const { user, role, loading, updateUser } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()

  // Navigation / Tabs within Dashboard
  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'campaigns' | 'donations' | 'rescues' | 'adoptions' | 'feedback'

  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Operations data states
  const [profileForm, setProfileForm] = useState({
    name: '', phoneNumber: '', dateOfBirth: '', location: '', occupation: '', photoUrl: '',
    latitude: null, longitude: null
  })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [myOrganized, setMyOrganized] = useState([])
  const [myJoined, setMyJoined] = useState([])
  const [myDonations, setMyDonations] = useState([])
  const [myRescues, setMyRescues] = useState([])
  const [myAdoptions, setMyAdoptions] = useState([])
  const [enteredOtps, setEnteredOtps] = useState({})
  const [verifyingOtp, setVerifyingOtp] = useState({})

  // Leaderboard / Volunteer points state
  const [points, setPoints] = useState(0)

  // Feedback State
  const [feedback, setFeedback] = useState({ rating: 5, content: '' })
  const [feedbackSuccess, setFeedbackSuccess] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  // Campaign management state (from JoinCampaign)
  const [selectedCampaignForManage, setSelectedCampaignForManage] = useState(null)
  const [participants, setParticipants] = useState([])
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [codes, setCodes] = useState({})
  const [actionLoading, setActionLoading] = useState({})

  // Operation Edit Modals State
  const [editingDonation, setEditingDonation] = useState(null)
  const [editingRescue, setEditingRescue] = useState(null)
  const [editingCampaign, setEditingCampaign] = useState(null)

  // Fetch all user operations
  const loadUserData = useCallback(async () => {
    if (!user) return
    setLoadingData(true)
    try {
      // 1. Fetch Profile
      const { data: profile } = await api.get('/users')
      setProfileForm({
        name: profile.name || '',
        phoneNumber: profile.phoneNumber || '',
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
        location: profile.location || '',
        occupation: profile.occupation || '',
        photoUrl: profile.photoUrl || '',
        latitude: profile.latitude || null,
        longitude: profile.longitude || null
      })

      // 2. Fetch Donations
      const { data: donations } = await api.get('/users/donations')
      setMyDonations(donations || [])

      // 3. Fetch Adoptions
      const { data: adoptions } = await api.get('/users/adoptions')
      setMyAdoptions(adoptions || [])

      // 4. Fetch Rescues
      const { data: rescues } = await api.get('/users/rescues')
      setMyRescues(rescues || [])

      // 5. Fetch Campaigns
      const { data: campaigns } = await api.get('/users/campaigns')
      setMyOrganized(campaigns.organized || [])
      setMyJoined(campaigns.joined || [])

      // 6. Calculate Points
      const organizedCount = (campaigns.organized || []).length
      const joinedCount = (campaigns.joined || []).filter(j => j.status === 'APPROVED' || j.status === 'ATTENDED').length
      const donationsCount = (donations || []).length
      const rescuesCount = (rescues || []).length
      const adoptionsCount = (adoptions || []).filter(a => a.status === 'COMPLETED').length
      const pendingAdoptionsCount = (adoptions || []).filter(a => a.status === 'IN_PROGRESS').length

      const calculatedPoints = (organizedCount * 10) + (joinedCount * 5) + (donationsCount * 5) + (rescuesCount * 8) + (adoptionsCount * 10) + (pendingAdoptionsCount * 2)
      setPoints(calculatedPoints)

    } catch (err) {
      console.error('Error loading user dashboard data:', err)
    } finally {
      setLoadingData(false)
    }
  }, [user])

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/')
      return
    }
    loadUserData()
  }, [user, loading, loadUserData, navigate])

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const { data } = await api.post('/auth/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setProfileForm(f => ({ ...f, photoUrl: data.url }))
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Profile update submit
  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoadingProfile(true)
    setProfileSuccess(false)
    try {
      const { data } = await api.put('/users', profileForm)
      setProfileSuccess(true)
      // Update local storage auth user
      updateUser(data)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      alert(err.response?.data?.message || 'Profile update failed')
    } finally {
      setLoadingProfile(false)
    }
  }

  // Password change submit
  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Please fill all password fields')
      return
    }
    try {
      await api.put('/users/password', passwordForm)
      setPasswordSuccess('Password updated successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '' })
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Password update failed')
    }
  }

  // Platform Testimonial Feedback submit
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    setFeedbackLoading(true)
    setFeedbackSuccess(false)
    try {
      await api.post('/public/testimonials', feedback)
      setFeedbackSuccess(true)
      setFeedback({ rating: 5, content: '' })
      setTimeout(() => setFeedbackSuccess(false), 3000)
    } catch (err) {
      alert(err.response?.data?.message || 'Feedback submission failed')
    } finally {
      setFeedbackLoading(false)
    }
  }

  // Manage campaign volunteers (same as JoinCampaign)
  const handleManageCampaign = async (campaign) => {
    setSelectedCampaignForManage(campaign)
    setParticipantsLoading(true)
    try {
      const { data } = await api.get(`/campaigns/${campaign.id}/participants`)
      setParticipants(data || [])
      const initialCodes = {}
      data.forEach(p => {
        initialCodes[p.id] = p.code || `V-${campaign.name.substring(0,3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
      })
      setCodes(initialCodes)
    } catch (err) {
      console.error(err)
      setParticipants([])
    } finally {
      setParticipantsLoading(false)
    }
  }

  const handleApprove = async (participantId, codeVal) => {
    if (!codeVal.trim()) {
      alert('Please provide a volunteer number/code before approving!')
      return
    }
    setActionLoading(prev => ({ ...prev, [participantId]: true }))
    try {
      await api.patch(`/campaigns/${selectedCampaignForManage.id}/participants/${participantId}/status`, {
        status: 'APPROVED',
        code: codeVal
      })
      setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, status: 'APPROVED', code: codeVal } : p))
      loadUserData()
    } catch (err) {
      alert('Failed to approve volunteer.')
    } finally {
      setActionLoading(prev => ({ ...prev, [participantId]: false }))
    }
  }

  const handleReject = async (participantId) => {
    if (!window.confirm('Are you sure you want to reject this volunteer?')) return
    setActionLoading(prev => ({ ...prev, [participantId]: true }))
    try {
      await api.patch(`/campaigns/${selectedCampaignForManage.id}/participants/${participantId}/status`, {
        status: 'REJECTED'
      })
      setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, status: 'REJECTED' } : p))
      loadUserData()
    } catch (err) {
      alert('Failed to reject volunteer.')
    } finally {
      setActionLoading(prev => ({ ...prev, [participantId]: false }))
    }
  }

  // Edit Donation request handler
  const handleEditDonationSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/donations/${editingDonation.id}`, {
        category: editingDonation.category,
        quantity: Number(editingDonation.quantity),
        location: editingDonation.location,
        pickupAddress: editingDonation.pickupAddress,
        timeFrom: editingDonation.timeFrom,
        timeTo: editingDonation.timeTo
      })
      setEditingDonation(null)
      loadUserData()
      alert('Donation updated successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update donation.')
    }
  }

  // Delete Donation request handler
  const handleDeleteDonation = async (donationId) => {
    if (!window.confirm('Are you sure you want to cancel and delete this donation?')) return
    try {
      await api.delete(`/donations/${donationId}`)
      loadUserData()
      alert('Donation cancelled successfully.')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel donation.')
    }
  }

  const handleVerifyOtpSubmit = async (donationId) => {
    const otp = enteredOtps[donationId]
    if (!otp || otp.trim().length !== 6) {
      alert('Please enter a valid 6-digit OTP code.')
      return
    }
    setVerifyingOtp(prev => ({ ...prev, [donationId]: true }))
    try {
      await api.post(`/donations/${donationId}/verify-otp`, { otp })
      loadUserData()
      alert('OTP verified successfully! Donation marked as PICKED_UP.')
    } catch (err) {
      alert(err.response?.data?.message || 'OTP verification failed.')
    } finally {
      setVerifyingOtp(prev => ({ ...prev, [donationId]: false }))
    }
  }

  // Edit Rescue request handler
  const handleEditRescueSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/rescues/${editingRescue.id}`, {
        condition: editingRescue.condition,
        description: editingRescue.description,
        location: editingRescue.location
      })
      setEditingRescue(null)
      loadUserData()
      alert('Rescue request updated successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update rescue request.')
    }
  }

  // Delete Rescue request handler
  const handleDeleteRescue = async (rescueId) => {
    if (!window.confirm('Are you sure you want to delete this rescue request?')) return
    try {
      await api.delete(`/rescues/${rescueId}`)
      loadUserData()
      alert('Rescue request deleted successfully.')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete rescue request.')
    }
  }

  // Edit Campaign request handler
  const handleEditCampaignSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/campaigns/${editingCampaign.id}`, {
        name: editingCampaign.name,
        description: editingCampaign.description,
        location: editingCampaign.location,
        timeFrom: editingCampaign.timeFrom,
        timeTo: editingCampaign.timeTo,
        maxParticipants: Number(editingCampaign.maxParticipants)
      })
      setEditingCampaign(null)
      loadUserData()
      alert('Campaign details updated successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update campaign.')
    }
  }

  // Delete Campaign request handler
  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return
    try {
      await api.delete(`/campaigns/${campaignId}`)
      loadUserData()
      alert('Campaign deleted successfully.')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete campaign.')
    }
  }

  // Download Donation Receipt handler for monetary contributions
  const handleDownloadReceipt = (d) => {
    if (!d) return

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

    drawRow('NGO Name', d.recipientNgo?.name || 'Verified NGO', true)
    drawRow('Registration No', d.recipientNgo?.registrationNumber || 'N/A')
    drawRow('UPI ID', d.recipientNgo?.upiId || 'N/A')

    // Donation Info
    y += 12
    ctx.textAlign = 'left'
    ctx.fillStyle = '#43E97B'
    ctx.font = 'bold 11px "Inter", -apple-system, sans-serif'
    ctx.fillText('DONATION SUMMARY', 40, y)
    y += 24

    drawRow('Date', d.createdAt ? new Date(d.createdAt).toLocaleString() : new Date().toLocaleString())
    drawRow('Transaction ID', d.transactionId || 'N/A', true)
    drawRow('Support Message', d.description || 'None')

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
    ctx.fillText(`₹${d.amount || 0}`, 445, y + 42)

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
    link.download = `helping_hands_receipt_${d.transactionId || 'receipt'}.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Styles
  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const sectionBg = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'
  const cardBg = isDark ? 'bg-[#16163A] border-white/8' : 'bg-white border-[#E0E7FF] shadow-sm'
  const textTitle = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const textMuted = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const sidebarBtn = (active) => active
    ? 'bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white shadow-md'
    : isDark ? 'text-[#8888AA] hover:bg-white/[0.03] hover:text-white' : 'text-[#6366F1] hover:bg-[#EEF2FF] hover:text-[#13221B]'
  const inputClass = isDark
    ? "w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-[#555577] text-sm focus:outline-none focus:border-[#3D6A53] transition-all"
    : "w-full px-4 py-2.5 rounded-xl bg-[#F9FAFF] border border-[#13221B]/20 text-[#1E1B4B] placeholder-[#8888AA] text-sm focus:outline-none focus:border-[#3D6A53] transition-all"
  const selectClass = isDark
    ? "px-4 py-2.5 rounded-xl bg-[#0F0F2A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#3D6A53] transition-all"
    : "px-4 py-2.5 rounded-xl bg-[#F9FAFF] border border-[#13221B]/20 text-[#1E1B4B] text-sm focus:outline-none focus:border-[#3D6A53] transition-all"

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={36} className="text-[#3D6A53] animate-spin" />
      </div>
    )
  }

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
        <div className="max-w-[800px] mx-auto px-4 relative z-10">
          <div className="section-label mb-3">Volunteer Dashboard</div>
          <h1 className={`font-['Poppins'] font-black text-4xl sm:text-5xl mb-4 ${heroText}`}>
            Welcome back, <span className="gradient-text">{user?.name || 'Helper'}</span>
          </h1>
          <p className={`text-md max-w-md mx-auto ${subText}`}>Manage your volunteering, donations, animal rescues, and impact score all in one place.</p>
        </div>
      </section>

      {/* Main Section */}
      <section className={`py-12 min-h-[75vh] ${sectionBg}`}>
        <div className="max-w-[1250px] mx-auto px-4 sm:px-6">

          {/* Points Highlight Card */}
          <div className={`mb-10 p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 reveal shadow-md ${
            isDark ? 'bg-[#16163A]/80 border-[#3D6A53]/30' : 'bg-white border-[#C7D2FE]'
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#43E97B] to-[#13221B] flex items-center justify-center text-white shadow-lg shrink-0">
                <Award size={36} />
              </div>
              <div>
                <h3 className={`font-['Poppins'] font-bold text-2xl ${textTitle}`}>Total Impact Points</h3>
                <p className={`text-xs ${textMuted}`}>Earned from donations, rescues, and volunteering drives.</p>
              </div>
            </div>
            <div className="text-center sm:text-right shrink-0">
              <span className="text-5xl font-extrabold font-mono gradient-text">{points}</span>
              <span className={`text-lg font-bold ml-1 ${textTitle}`}>pts</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">

            {/* Sidebar Navigation */}
            <div className="lg:col-span-1 flex flex-col gap-2">
              <div className={`border rounded-2xl p-4 flex flex-col gap-1.5 ${cardBg}`}>
                <p className={`text-[10px] uppercase font-extrabold tracking-widest px-3 mb-2 ${textMuted}`}>Dashboard Sections</p>
                <button onClick={() => { setActiveTab('profile'); setSelectedCampaignForManage(null) }} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${sidebarBtn(activeTab === 'profile')}`}>
                  <User size={14} /> Edit Profile Details
                </button>
                <button onClick={() => { setActiveTab('campaigns'); setSelectedCampaignForManage(null) }} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${sidebarBtn(activeTab === 'campaigns')}`}>
                  <List size={14} /> My Campaigns & Drives
                </button>
                <button onClick={() => { setActiveTab('donations'); setSelectedCampaignForManage(null) }} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${sidebarBtn(activeTab === 'donations')}`}>
                  <Heart size={14} /> My Donation Listings
                </button>
                <button onClick={() => { setActiveTab('rescues'); setSelectedCampaignForManage(null) }} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${sidebarBtn(activeTab === 'rescues')}`}>
                  <Shield size={14} /> Reported Rescues
                </button>
                <button onClick={() => { setActiveTab('adoptions'); setSelectedCampaignForManage(null) }} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${sidebarBtn(activeTab === 'adoptions')}`}>
                  <Sparkles size={14} /> Pet Adoptions
                </button>
                <button onClick={() => { setActiveTab('feedback'); setSelectedCampaignForManage(null) }} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${sidebarBtn(activeTab === 'feedback')}`}>
                  <MessageSquare size={14} /> Rate Platform
                </button>
              </div>
            </div>

            {/* Dashboard Content Area */}
            <div className="lg:col-span-3">

              {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 size={36} className="text-[#3D6A53] animate-spin" />
                  <p className={textMuted}>Loading your impact activities…</p>
                </div>
              ) : (
                <>
                  {/* PROFILE TAB */}
                  {activeTab === 'profile' && (
                    <div className="flex flex-col gap-6 reveal">
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${textTitle}`}>
                          <User size={16} className="text-[#3D6A53]" />
                          <span>My Personal Details</span>
                        </h3>

                        <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Full Name</label>
                              <input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required className={inputClass} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Email Address (Read-only)</label>
                              <input value={user?.email || ''} readOnly className={`${inputClass} opacity-60 cursor-not-allowed`} />
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Phone Number</label>
                              <input value={profileForm.phoneNumber} onChange={e => setProfileForm({ ...profileForm, phoneNumber: e.target.value })} placeholder="e.g. +91 9876543210" className={inputClass} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Date of Birth</label>
                              <input type="date" value={profileForm.dateOfBirth} onChange={e => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })} className={inputClass} />
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Occupation / Skillset</label>
                              <input value={profileForm.occupation} onChange={e => setProfileForm({ ...profileForm, occupation: e.target.value })} placeholder="e.g. Doctor, Student, Vet, Software Engineer" className={inputClass} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Location (City, Area)</label>
                              <LocationAutocomplete
                                value={profileForm.location}
                                onChange={(val) => setProfileForm({ ...profileForm, location: val })}
                                onSelectLocation={({ locationStr, latitude, longitude }) => {
                                  setProfileForm({ ...profileForm, location: locationStr, latitude, longitude })
                                }}
                                placeholder="e.g. Bandra, Mumbai"
                                inputClass={inputClass}
                                isDark={isDark}
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className={`text-xs font-bold ${textMuted}`}>Profile Photo</label>
                            <div className="flex items-center gap-4">
                              {profileForm.photoUrl ? (
                                <img src={profileForm.photoUrl} alt="Profile Preview" className="w-14 h-14 rounded-2xl object-contain border border-[#13221B]/15 bg-white/[0.03]" />
                              ) : (
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center font-bold text-white text-base shadow-sm">
                                  {profileForm.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                id="profile-photo-upload"
                                onChange={handlePhotoUpload}
                                className="hidden"
                              />
                              <label
                                htmlFor="profile-photo-upload"
                                className="cursor-pointer px-4 py-2.5 rounded-xl border text-xs font-bold transition-all bg-[#13221B]/10 border-[#13221B]/25 text-[#2E7D59] hover:bg-[#13221B]/20"
                              >
                                {uploadingPhoto ? 'Uploading...' : 'Choose Image'}
                              </label>
                              {uploadingPhoto && <span className="w-4 h-4 border-2 border-[#13221B] border-t-transparent rounded-full animate-spin" />}
                            </div>
                          </div>

                          {profileSuccess && (
                            <p className="text-[#43E97B] text-xs font-bold flex items-center gap-1.5">
                              <CheckCircle size={13} /> Profile updated successfully!
                            </p>
                          )}

                          <button type="submit" disabled={loadingProfile} className="mt-2 self-start px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-1.5">
                            {loadingProfile ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            Save Personal Details
                          </button>
                        </form>
                      </div>

                      {/* Change Password Card */}
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${textTitle}`}>
                          <Shield size={16} className="text-[#3D6A53]" />
                          <span>Change Security Password</span>
                        </h3>

                        <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Current Password</label>
                              <input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className={inputClass} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>New Password</label>
                              <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className={inputClass} />
                            </div>
                          </div>

                          {passwordError && <p className="text-red-400 text-xs font-semibold">{passwordError}</p>}
                          {passwordSuccess && <p className="text-[#43E97B] text-xs font-bold">{passwordSuccess}</p>}

                          <button type="submit" className="self-start px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold hover:shadow-md transition-all">
                            Update Password
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* CAMPAIGNS TAB */}
                  {activeTab === 'campaigns' && (
                    <div className="flex flex-col gap-6 reveal">
                      {/* Organized Campaigns */}
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className={`font-['Poppins'] font-bold text-lg flex items-center gap-2 ${textTitle}`}>
                            <Clipboard size={16} className="text-[#3D6A53]" />
                            <span>Campaigns I Organise (Head)</span>
                          </h3>
                          <Link to="/volunteer/start" className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#43E97B] to-[#13221B] text-white text-xs font-bold hover:-translate-y-0.5 transition-all">
                            + New Campaign
                          </Link>
                        </div>

                        {myOrganized.length === 0 ? (
                          <div className="text-center py-10">
                            <p className={`text-sm ${textMuted}`}>You haven't organized any campaigns yet.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {myOrganized.map(c => (
                              <div key={c.id} className={`p-4 rounded-xl border flex flex-wrap justify-between items-center gap-3 transition-colors ${
                                selectedCampaignForManage?.id === c.id
                                  ? 'bg-[#13221B]/5 border-[#3D6A53]'
                                  : isDark ? 'bg-white/[0.02] border-white/5' : 'bg-gray-50 border-gray-100 hover:bg-gray-100/50'
                              }`}>
                                <div className="flex-1 min-w-[200px]">
                                  <h4 className={`font-semibold text-sm ${textTitle}`}>{c.name}</h4>
                                  <p className={`text-[11px] mt-0.5 ${textMuted}`}>
                                    📍 {c.location} • 📅 {c.timeFrom ? new Date(c.timeFrom).toLocaleDateString() : 'TBD'}
                                  </p>
                                  <p className="text-[10px] text-[#43E97B] font-bold mt-1">
                                    {c.currentParticipants || 0} approved volunteers
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => setEditingCampaign(c)} className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20" title="Edit details">
                                    <Edit3 size={13} />
                                  </button>
                                  <button onClick={() => handleDeleteCampaign(c.id)} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20" title="Delete campaign">
                                    <Trash2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleManageCampaign(c)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                      selectedCampaignForManage?.id === c.id
                                        ? 'bg-[#13221B] border-[#13221B] text-white'
                                        : 'border-[#13221B]/20 text-[#2E7D59] hover:bg-[#13221B]/5'
                                    }`}
                                  >
                                    👥 Manage Volunteers
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Volunteer Coordinator section */}
                      {selectedCampaignForManage && (
                        <div className={`border rounded-2xl p-6 ${cardBg} animate-fade-in`}>
                          <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <div>
                              <h3 className={`font-['Poppins'] font-bold text-base ${textTitle}`}>
                                Volunteers for: {selectedCampaignForManage.name}
                              </h3>
                              <p className={`text-[11px] ${textMuted}`}>Review volunteer applications and issue status codes.</p>
                            </div>
                            <button onClick={() => setSelectedCampaignForManage(null)} className={`text-xs ${textMuted} hover:text-[#13221B] font-bold`}>
                              ✕ Close
                            </button>
                          </div>

                          {participantsLoading ? (
                            <div className="flex items-center gap-2 py-8 justify-center">
                              <Loader2 size={20} className="animate-spin text-[#13221B]" />
                              <span className={`text-xs ${textMuted}`}>Fetching volunteer applications…</span>
                            </div>
                          ) : participants.length === 0 ? (
                            <p className={`text-xs text-center py-10 ${textMuted}`}>No volunteers have applied to join this campaign yet.</p>
                          ) : (
                            <div className="flex flex-col gap-4">
                              {participants.map((p, idx) => {
                                const v = p.user
                                const ageVal = v ? calculateAge(v.dateOfBirth) : 'N/A'
                                return (
                                  <div key={p.id} className={`p-4 rounded-xl border flex flex-col gap-3 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="flex justify-between items-start gap-2">
                                      <div>
                                        <h4 className={`font-bold text-sm ${textTitle}`}>{v?.name}</h4>
                                        <p className={`text-xs ${textMuted}`}>{v?.occupation || 'Volunteer'} • Age: {ageVal}</p>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                                        p.status === 'APPROVED' ? 'bg-[#43E97B]/10 text-[#43E97B]' :
                                        p.status === 'PENDING' ? 'bg-[#FFB347]/10 text-[#FFB347]' : 'bg-red-500/10 text-red-400'
                                      }`}>
                                        {p.status}
                                      </span>
                                    </div>
                                    <div className={`grid sm:grid-cols-2 gap-2 text-[11px] p-2.5 rounded-lg ${isDark ? 'bg-black/20' : 'bg-white border border-gray-100'} ${textMuted}`}>
                                      <span>📧 Email: <strong className={textTitle}>{v?.email}</strong></span>
                                      <span>📞 Phone: <strong className={textTitle}>{v?.phoneNumber || 'N/A'}</strong></span>
                                      <span className="sm:col-span-2">📍 Location: <strong className={textTitle}>{v?.location || 'N/A'}</strong></span>
                                    </div>

                                    {p.status === 'PENDING' ? (
                                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                                        <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
                                          <span className={`text-[10px] font-bold ${textMuted}`}>CODE:</span>
                                          <input
                                            value={codes[p.id] || ''}
                                            onChange={e => setCodes({ ...codes, [p.id]: e.target.value })}
                                            placeholder="e.g. V-101"
                                            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold w-full ${isDark ? 'bg-[#0F0F2A] border-white/10 text-white' : 'bg-white border-[#C7D2FE]'}`}
                                          />
                                        </div>
                                        <div className="flex gap-2">
                                          <button onClick={() => handleReject(p.id)} disabled={actionLoading[p.id]} className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20"><XCircle size={14} /></button>
                                          <button onClick={() => handleApprove(p.id, codes[p.id])} disabled={actionLoading[p.id]} className="px-4 py-2 rounded-xl bg-[#43E97B] text-white text-xs font-bold hover:bg-[#3D6A53]">Approve</button>
                                        </div>
                                      </div>
                                    ) : p.status === 'APPROVED' ? (
                                      <div className="flex items-center justify-between p-2 bg-[#43E97B]/5 rounded-lg border border-[#43E97B]/20">
                                        <p className="text-[11px] text-[#43E97B] font-semibold">Approved Code: <span className="font-mono font-bold bg-[#13221B] text-white px-2 py-0.5 rounded">{p.code}</span></p>
                                        <button onClick={() => handleReject(p.id)} className="text-[10px] text-red-400 hover:underline font-bold">Decline</button>
                                      </div>
                                    ) : (
                                      <p className="text-[11px] text-red-400 italic">This application has been declined.</p>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Campaigns Joined */}
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${textTitle}`}>
                          <Clipboard size={16} className="text-[#3D6A53]" />
                          <span>Campaigns I Joined (Volunteered)</span>
                        </h3>

                        {myJoined.length === 0 ? (
                          <p className={`text-sm text-center py-10 ${textMuted}`}>You haven't joined any volunteer campaigns yet.</p>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {myJoined.map(j => {
                              const c = j.campaign
                              return (
                                <div key={j.id} className={`p-4 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className={`font-semibold text-sm ${textTitle}`}>{c?.name}</h4>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${
                                      j.status === 'APPROVED' ? 'bg-[#43E97B]/10 text-[#43E97B]' :
                                      j.status === 'PENDING' ? 'bg-[#FFB347]/10 text-[#FFB347]' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                      {j.status}
                                    </span>
                                  </div>
                                  <p className={`text-[10px] ${textMuted}`}>
                                    📍 {c?.location} • 📅 {c?.timeFrom ? new Date(c.timeFrom).toLocaleDateString() : 'TBD'}
                                  </p>

                                  {j.status === 'APPROVED' && (
                                    <div className="p-3 bg-[#43E97B]/5 rounded-xl border border-[#43E97B]/20 text-center mt-1">
                                      <p className={`text-xs ${textMuted} mb-1`}>Show this Joining Code to campaign coordinator:</p>
                                      <p className="font-mono font-black text-base text-[#43E97B] bg-[#13221B] px-3 py-1 rounded inline-block tracking-widest">
                                        {j.code}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DONATIONS TAB */}
                  {activeTab === 'donations' && (
                    <div className={`border rounded-2xl p-6 ${cardBg} reveal`}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className={`font-['Poppins'] font-bold text-lg flex items-center gap-2 ${textTitle}`}>
                          <Heart size={16} className="text-[#3D6A53]" />
                          <span>My Donation Listings</span>
                        </h3>
                        <Link to="/ngos/donate" className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold hover:-translate-y-0.5 transition-all">
                          + Donate to NGO
                        </Link>
                      </div>

                      {myDonations.length === 0 ? (
                        <p className={`text-sm text-center py-10 ${textMuted}`}>You haven't listed any donations yet.</p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {myDonations.map(d => (
                            <div key={d.id} className={`p-4 rounded-xl border flex flex-col gap-3 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                              <div className="flex justify-between items-start gap-2 flex-wrap">
                                <div>
                                  <h4 className={`font-semibold text-sm ${textTitle}`}>{d.title || `Donation of ${d.category}`}</h4>
                                  <p className={`text-[10px] ${textMuted}`}>NGO Recipient: <strong className={textTitle}>{d.recipientNgo?.name || 'Any Verified NGO'}</strong></p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  d.status === 'DELIVERED' ? 'bg-[#43E97B]/10 text-[#43E97B]' :
                                  d.status === 'PENDING' ? 'bg-[#FFB347]/10 text-[#FFB347]' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {d.status}
                                </span>
                              </div>

                              <div className={`grid sm:grid-cols-3 gap-2 text-[11px] p-2.5 rounded-lg ${isDark ? 'bg-black/20' : 'bg-white border border-gray-100'} ${textMuted}`}>
                                <span>📦 Category: <strong className={textTitle}>{d.category}</strong></span>
                                {d.category === 'MONEY' ? (
                                  <span>💰 Amount: <strong className="text-[#43E97B] font-black">₹{d.amount}</strong></span>
                                ) : (
                                  <span>🔢 Quantity: <strong className={textTitle}>{d.quantity || 1}</strong></span>
                                )}
                                <span>📍 Location: <strong className={textTitle}>{d.location || 'N/A'}</strong></span>
                                {d.pickupAddress && <span className="sm:col-span-3">🏠 Pickup Address: <strong className={textTitle}>{d.pickupAddress}</strong></span>}
                              </div>

                              {d.pickupType === 'VOLUNTEER' && d.status === 'ACCEPTED' && (
                                <div className="p-4 rounded-xl border flex flex-col gap-3 border-yellow-500/20 bg-yellow-500/[0.02] text-xs">
                                  <div className="flex justify-between items-center flex-wrap gap-2">
                                    <div>
                                      <p className={`font-bold text-[#FFB347]`}>
                                        {d.reachedDonor ? '🚨 NGO Volunteer Has Reached!' : '🚗 Volunteer Pickup Scheduled'}
                                      </p>
                                      <p className={textMuted}>
                                        {d.reachedDonor 
                                          ? 'Ask the volunteer for their OTP code to verify pickup.' 
                                          : 'When the volunteer meets you, they will share their OTP.'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {d.reachedDonor && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <input
                                        type="text"
                                        maxLength={6}
                                        value={enteredOtps[d.id] || ''}
                                        onChange={e => setEnteredOtps({ ...enteredOtps, [d.id]: e.target.value })}
                                        placeholder="Enter 6-digit OTP code"
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold w-48 ${isDark ? 'bg-[#0F0F2A] border-white/10 text-white' : 'bg-white border-[#C7D2FE]'}`}
                                      />
                                      <button
                                        onClick={() => handleVerifyOtpSubmit(d.id)}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold hover:shadow-md transition-all cursor-pointer"
                                      >
                                        Verify & Handover
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {d.status === 'PENDING' && d.category !== 'MONEY' && (
                                <div className="flex justify-end gap-2 mt-1">
                                  <button onClick={() => setEditingDonation(d)} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-[11px] font-bold flex items-center gap-1">
                                    <Edit3 size={11} /> Edit details
                                  </button>
                                  <button onClick={() => handleDeleteDonation(d.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[11px] font-bold flex items-center gap-1">
                                    <Trash2 size={11} /> Cancel Donation
                                  </button>
                                </div>
                              )}

                              {d.category === 'MONEY' && (
                                <div className="flex justify-end gap-2 mt-1">
                                  <button
                                    onClick={() => handleDownloadReceipt(d)}
                                    className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-[#2E7D59] hover:bg-green-500/20 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    📥 Download Receipt
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* RESCUES TAB */}
                  {activeTab === 'rescues' && (
                    <div className={`border rounded-2xl p-6 ${cardBg} reveal`}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className={`font-['Poppins'] font-bold text-lg flex items-center gap-2 ${textTitle}`}>
                          <Shield size={16} className="text-[#3D6A53]" />
                          <span>Animal Rescues Reported</span>
                        </h3>
                        <Link to="/animals/rescue" className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold hover:-translate-y-0.5 transition-all">
                          + Report Emergency
                        </Link>
                      </div>

                      {myRescues.length === 0 ? (
                        <p className={`text-sm text-center py-10 ${textMuted}`}>You haven't reported any rescues yet.</p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {myRescues.map(r => (
                            <div key={r.id} className={`p-4 rounded-xl border flex flex-col gap-3 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                              <div className="flex justify-between items-start gap-2 flex-wrap">
                                <div>
                                  <h4 className={`font-semibold text-sm ${textTitle}`}>{r.animalType || 'Animal'} Rescue Request</h4>
                                  <p className={`text-[10px] ${textMuted}`}>Assigned NGO: <strong className={textTitle}>{r.nearbyCenter?.name || 'Searching Nearby shelter...'}</strong></p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  r.status === 'RESOLVED' ? 'bg-[#43E97B]/10 text-[#43E97B]' :
                                  r.status === 'CLOSED' ? 'bg-red-500/10 text-red-400' :
                                  r.status === 'ASSIGNED' ? 'bg-[#FFB347]/10 text-[#FFB347]' : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {r.status === 'RESOLVED' ? 'RESOLVED (SUCCESS)' : 
                                   r.status === 'CLOSED' ? 'CLOSED (UNSUCCESSFUL)' : 
                                   r.status === 'ASSIGNED' ? 'NGO DISPATCHED' : 
                                   'PENDING CLAIM'}
                                </span>
                              </div>

                              <p className={`text-xs leading-relaxed ${textTitle}`}>{r.description}</p>

                              <div className={`grid sm:grid-cols-2 gap-2 text-[11px] p-2.5 rounded-lg ${isDark ? 'bg-black/20' : 'bg-white border border-gray-100'} ${textMuted}`}>
                                <span>🩺 Condition: <strong className={textTitle}>{r.condition || 'N/A'}</strong></span>
                                <span>📍 Location: <strong className={textTitle}>{r.location || 'N/A'}</strong></span>
                                {r.nearbyHospital && <span className="sm:col-span-2">🏥 Nearby Hospital: <strong className={textTitle}>{r.nearbyHospital}</strong></span>}
                              </div>

                              {/* Operation Status Notification Banner */}
                              <div className={`p-3 rounded-xl border text-[11px] leading-normal ${
                                r.status === 'RESOLVED' ? 'bg-[#43E97B]/10 border-[#43E97B]/20 text-[#43E97B]' :
                                r.status === 'CLOSED' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                r.status === 'ASSIGNED' ? 'bg-[#FFB347]/10 border-[#FFB347]/20 text-[#FFB347]' :
                                'bg-blue-500/10 border-blue-500/20 text-blue-400'
                              }`}>
                                {r.status === 'RESOLVED' && (
                                  <p className="flex items-center gap-1.5 font-bold">
                                    <span>🎉</span> Rescue Operation Successful! {r.nearbyCenter?.name || 'The NGO'} has successfully resolved this case and the animal is now safe.
                                  </p>
                                )}
                                {r.status === 'CLOSED' && (
                                  <p className="flex items-center gap-1.5 font-bold">
                                    <span>⚠️</span> Rescue Operation Closed: The rescue case was closed/unsuccessful (the animal could not be found or was already relocated).
                                  </p>
                                )}
                                {r.status === 'ASSIGNED' && (
                                  <p className="flex items-center gap-1.5 font-bold">
                                    <span>🚨</span> NGO Dispatched: {r.nearbyCenter?.name || 'An NGO'} has claimed this rescue request and their team is en route! {r.nearbyCenter?.phoneNumber ? `(Phone: ${r.nearbyCenter.phoneNumber})` : ''}
                                  </p>
                                )}
                                {r.status === 'OPEN' && (
                                  <p className="flex items-center gap-1.5">
                                    <span>⏳</span> Pending: Your report is live. Registered NGOs & shelters within 10 km have been alerted.
                                  </p>
                                )}
                              </div>

                              {r.status === 'OPEN' && (
                                <div className="flex justify-end gap-2 mt-1">
                                  <button onClick={() => setEditingRescue(r)} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-[11px] font-bold flex items-center gap-1">
                                    <Edit3 size={11} /> Edit details
                                  </button>
                                  <button onClick={() => handleDeleteRescue(r.id)} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[11px] font-bold flex items-center gap-1">
                                    <Trash2 size={11} /> Delete Request
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ADOPTIONS TAB */}
                  {activeTab === 'adoptions' && (
                    <div className={`border rounded-2xl p-6 ${cardBg} reveal`}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className={`font-['Poppins'] font-bold text-lg flex items-center gap-2 ${textTitle}`}>
                          <Sparkles size={16} className="text-[#3D6A53]" />
                          <span>My Pet Adoptions</span>
                        </h3>
                        <Link to="/animals/adopt" className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold hover:-translate-y-0.5 transition-all">
                          + Browse Pets
                        </Link>
                      </div>

                      {myAdoptions.length === 0 ? (
                        <p className={`text-sm text-center py-10 ${textMuted}`}>You haven't requested any pet adoptions yet.</p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {myAdoptions.map(a => (
                            <div key={a.id} className={`p-4 rounded-xl border flex justify-between items-center gap-3 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                              <div>
                                <h4 className={`font-semibold text-sm ${textTitle}`}>Adoption Request: {a.animal?.name || 'Unnamed Pet'}</h4>
                                <p className={`text-xs ${textMuted}`}>Category: {a.animal?.category} • Location: {a.animal?.location}</p>
                                <p className={`text-[10px] mt-1 ${textMuted}`}>Shelter: {a.ngo?.name || 'Verified Shelter Partner'}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase shrink-0 ${
                                a.status === 'COMPLETED' ? 'bg-[#43E97B]/10 text-[#43E97B]' :
                                a.status === 'IN_PROGRESS' ? 'bg-[#FFB347]/10 text-[#FFB347]' : 'bg-red-500/10 text-red-400'
                              }`}>
                                {a.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* FEEDBACK TAB */}
                  {activeTab === 'feedback' && (
                    <div className={`border rounded-2xl p-6 ${cardBg} reveal`}>
                      <h3 className={`font-['Poppins'] font-bold text-lg mb-2 flex items-center gap-2 ${textTitle}`}>
                        <Star size={16} className="text-[#3D6A53]" />
                        <span>Rate Helping Hands</span>
                      </h3>
                      <p className={`text-xs mb-5 ${textMuted}`}>Share your experience with the community. Your reviews appear on our homepage!</p>

                      <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${textMuted}`}>Rating:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(val => (
                              <button
                                type="button"
                                key={val}
                                onClick={() => setFeedback({ ...feedback, rating: val })}
                                className="focus:outline-none transition-transform active:scale-95"
                              >
                                <Star
                                  size={20}
                                  className={val <= feedback.rating ? 'text-[#FFB347] fill-[#FFB347]' : 'text-gray-400'}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className={`text-xs font-bold ${textMuted}`}>Write Your Review</label>
                          <textarea
                            value={feedback.content}
                            onChange={e => setFeedback({ ...feedback, content: e.target.value })}
                            required
                            rows={4}
                            placeholder="Share how Helping Hands helped you feed street dogs, donate clothes, or find rescues..."
                            className={`${inputClass} resize-none`}
                          />
                        </div>

                        {feedbackSuccess && (
                          <p className="text-[#43E97B] text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle size={13} /> Thank you! Your review is posted.
                          </p>
                        )}

                        <button type="submit" disabled={feedbackLoading} className="self-start px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold hover:shadow-md transition-all flex items-center gap-1.5">
                          {feedbackLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          Submit Platform Review
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* EDIT DONATION MODAL */}
      {editingDonation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleEditDonationSubmit} className={`border rounded-3xl p-6 max-w-md w-full flex flex-col gap-4 shadow-xl ${
            isDark ? 'bg-[#16163A] border-white/10' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`font-['Poppins'] font-bold text-lg ${textTitle}`}>Edit Donation Details</h3>

            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${textMuted}`}>Donation Category</label>
              <select value={editingDonation.category} onChange={e => setEditingDonation({ ...editingDonation, category: e.target.value })} className={selectClass}>
                <option value="CLOTHES">Clothes & Blankets</option>
                <option value="FOOD">Food & Grains</option>
                <option value="GOODS">General Goods / Utensils</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${textMuted}`}>Quantity</label>
              <input type="number" min="1" value={editingDonation.quantity || 1} onChange={e => setEditingDonation({ ...editingDonation, quantity: e.target.value })} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${textMuted}`}>Location (City, Area)</label>
              <input value={editingDonation.location || ''} onChange={e => setEditingDonation({ ...editingDonation, location: e.target.value })} className={inputClass} />
            </div>

            {editingDonation.pickupType === 'VOLUNTEER' && (
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-bold ${textMuted}`}>Pickup Address</label>
                <input value={editingDonation.pickupAddress || ''} onChange={e => setEditingDonation({ ...editingDonation, pickupAddress: e.target.value })} className={inputClass} />
              </div>
            )}

            <div className="flex gap-3 justify-end mt-2">
              <button type="button" onClick={() => setEditingDonation(null)} className={`px-4 py-2 rounded-xl text-xs font-bold border ${isDark ? 'border-white/10 text-white' : 'border-gray-200 text-gray-700'}`}>Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT RESCUE MODAL */}
      {editingRescue && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleEditRescueSubmit} className={`border rounded-3xl p-6 max-w-md w-full flex flex-col gap-4 shadow-xl ${
            isDark ? 'bg-[#16163A] border-white/10' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`font-['Poppins'] font-bold text-lg ${textTitle}`}>Edit Rescue Details</h3>

            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${textMuted}`}>Animal Condition</label>
              <input value={editingRescue.condition || ''} onChange={e => setEditingRescue({ ...editingRescue, condition: e.target.value })} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${textMuted}`}>Rescue Description</label>
              <textarea rows={3} value={editingRescue.description || ''} onChange={e => setEditingRescue({ ...editingRescue, description: e.target.value })} className={`${inputClass} resize-none`} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${textMuted}`}>Rescue Location</label>
              <input value={editingRescue.location || ''} onChange={e => setEditingRescue({ ...editingRescue, location: e.target.value })} className={inputClass} />
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button type="button" onClick={() => setEditingRescue(null)} className={`px-4 py-2 rounded-xl text-xs font-bold border ${isDark ? 'border-white/10 text-white' : 'border-gray-200 text-gray-700'}`}>Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT CAMPAIGN MODAL */}
      {editingCampaign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleEditCampaignSubmit} className={`border rounded-3xl p-6 max-w-md w-full flex flex-col gap-4 shadow-xl ${
            isDark ? 'bg-[#16163A] border-white/10' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`font-['Poppins'] font-bold text-lg ${textTitle}`}>Edit Campaign details</h3>

            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${textMuted}`}>Campaign Name</label>
              <input value={editingCampaign.name || ''} onChange={e => setEditingCampaign({ ...editingCampaign, name: e.target.value })} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${textMuted}`}>Description</label>
              <textarea rows={3} value={editingCampaign.description || ''} onChange={e => setEditingCampaign({ ...editingCampaign, description: e.target.value })} className={`${inputClass} resize-none`} />
            </div>

            <div className="flex flex-col gap-1">
              <label className={`text-xs font-bold ${textMuted}`}>Location</label>
              <input value={editingCampaign.location || ''} onChange={e => setEditingCampaign({ ...editingCampaign, location: e.target.value })} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-bold ${textMuted}`}>Max Volunteers</label>
                <input type="number" min="1" value={editingCampaign.maxParticipants || 10} onChange={e => setEditingCampaign({ ...editingCampaign, maxParticipants: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button type="button" onClick={() => setEditingCampaign(null)} className={`px-4 py-2 rounded-xl text-xs font-bold border ${isDark ? 'border-white/10 text-white' : 'border-gray-200 text-gray-700'}`}>Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
