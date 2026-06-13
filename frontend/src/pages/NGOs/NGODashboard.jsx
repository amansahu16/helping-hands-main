import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Building, Phone, MapPin, Award, Shield, Save, Edit3, Trash2,
  CheckCircle, Loader2, Star, Calendar, Users, FileText, Bell,
  TrendingUp, ArrowRight, Heart, HeartHandshake, Check, X, AlertTriangle,
  Navigation, PawPrint
} from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import useScrollReveal from '../../hooks/useScrollReveal'
import LocationAutocomplete from '../../components/LocationAutocomplete'
import bgImg from '../images/NGO_bg.jpg'


export default function NGODashboard() {
  useScrollReveal()
  const { user, role, loading, updateUser } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()
  const location = useLocation()

  // Tab State
  const [activeTab, setActiveTab] = useState(() => {
    return location.state?.activeTab || 'profile'
  }) // 'profile' | 'campaigns' | 'rescues' | 'donations' | 'posts'

  // Loading States
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Data States
  const [profileForm, setProfileForm] = useState({
    name: '', phoneNumber: '', location: '', photoUrl: '',
    registrationNumber: '', areaOfWork: 'Animal Welfare', description: '',
    achievements: '', workDone: '', latitude: null, longitude: null,
    upiId: '', websiteUrl: ''
  })
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [campaigns, setCampaigns] = useState([])
  const [rescues, setRescues] = useState([])
  const [donations, setDonations] = useState([])
  const [posts, setPosts] = useState([])

  // Post CRUD form state
  const [newPost, setNewPost] = useState({ title: '', description: '', location: '', postType: 'GENERAL' })
  const [editingPost, setEditingPost] = useState(null)
  const [postActionLoading, setPostActionLoading] = useState(false)

  // Password edit state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const loadNgoData = useCallback(async () => {
    if (!user) return
    setLoadingData(true)
    try {
      // 1. Fetch Profile
      const { data: profile } = await api.get('/ngos/me/profile')
      setProfileForm({
        name: profile.name || '',
        phoneNumber: profile.phoneNumber || '',
        location: profile.location || '',
        photoUrl: profile.photoUrl || '',
        registrationNumber: profile.registrationNumber || '',
        areaOfWork: profile.areaOfWork || 'Animal Welfare',
        description: profile.description || '',
        achievements: profile.achievements || '',
        workDone: profile.workDone || '',
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        upiId: profile.upiId || '',
        websiteUrl: profile.websiteUrl || ''
      })

      // 2. Fetch Organized Campaigns
      const { data: campaignsData } = await api.get(`/campaigns?organizerNgoId=${user.id}`)
      setCampaigns(campaignsData || [])

      // 3. Fetch Rescue Requests (open & assigned)
      const { data: rescuesData } = await api.get('/ngos/me/rescue-requests')
      setRescues(rescuesData || [])

      // 4. Fetch Donations Received
      const { data: donationsData } = await api.get('/ngos/me/donations')
      setDonations(donationsData || [])

      // 5. Fetch Posts
      const { data: postsData } = await api.get(`/ngos/${user.id}/posts`)
      setPosts(postsData || [])

    } catch (err) {
      console.error('Error loading NGO dashboard data:', err)
    } finally {
      setLoadingData(false)
    }
  }, [user])

  useEffect(() => {
    if (loading) return
    if (!user || role !== 'ngo') {
      navigate('/')
      return
    }
    loadNgoData()
  }, [user, role, loading, loadNgoData, navigate])

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

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoadingProfile(true)
    setProfileSuccess(false)
    try {
      const { data } = await api.put('/ngos/me/profile', profileForm)
      setProfileSuccess(true)
      updateUser(data)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      alert(err.response?.data?.message || 'Profile update failed')
    } finally {
      setLoadingProfile(false)
    }
  }
  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Please fill all password fields')
      return
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_])[A-Za-z\d!@#$%^&*_]{8,16}$/.test(passwordForm.newPassword)) {
      setPasswordError('New password must be 8 to 16 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special symbol from !@#$%^&*_.')
      return
    }
    try {
      await api.put('/ngos/me/password', passwordForm)
      setPasswordSuccess('Password updated successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '' })
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Password update failed')
    }
  }

  // Claim a Rescue request
  const handleClaimRescue = async (rescueId) => {
    try {
      await api.patch(`/rescue/${rescueId}/status`, { status: 'ASSIGNED' })
      loadNgoData()
      alert('Rescue claimed successfully! Details can be viewed in your rescues list.')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim rescue request')
    }
  }

  // Resolve a Rescue request
  const handleResolveRescue = async (rescueId) => {
    if (!window.confirm('Are you sure you want to mark this rescue as resolved?')) return
    try {
      await api.patch(`/rescue/${rescueId}/status`, { status: 'RESOLVED' })
      loadNgoData()
      alert('Rescue request resolved! The animal is now safe.')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve rescue request')
    }
  }

  // Close a Rescue request (Mark Unsuccessful)
  const handleCloseRescue = async (rescueId) => {
    if (!window.confirm('Are you sure you want to close this rescue request as unsuccessful/closed?')) return
    try {
      await api.patch(`/rescue/${rescueId}/status`, { status: 'CLOSED' })
      loadNgoData()
      alert('Rescue request marked as closed/unsuccessful.')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close rescue request')
    }
  }

  // Update Donation status
  const handleUpdateDonationStatus = async (donationId, status) => {
    try {
      await api.patch(`/donations/${donationId}/status`, { status })
      loadNgoData()
      alert(`Donation status updated to ${status}!`)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update donation status')
    }
  }

  const handleNotifyReached = async (donationId) => {
    try {
      await api.patch(`/donations/${donationId}/reach`)
      loadNgoData()
      alert('Donor notified! Share the OTP code with them once you meet to confirm pickup.')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to notify reached.')
    }
  }

  // Post creation
  const handleCreatePost = async (e) => {
    e.preventDefault()
    setPostActionLoading(true)
    try {
      await api.post('/ngos/me/posts', newPost)
      setNewPost({ title: '', description: '', location: '', postType: 'GENERAL' })
      loadNgoData()
      alert('Post published successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create post')
    } finally {
      setPostActionLoading(false)
    }
  }

  // Delete Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    try {
      await api.delete(`/ngos/me/posts/${postId}`)
      loadNgoData()
      alert('Post deleted successfully')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post')
    }
  }

  // Quick stats
  const pendingDonations = donations.filter(d => d.status === 'PENDING').length
  const claimedRescues = rescues.filter(r => r.status === 'ASSIGNED' && r.nearbyCenterId === user?.id).length
  const alertRescues = rescues.filter(r => r.status === 'OPEN')

  // Theme-aware styles
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
          <div className="section-label mb-3">NGO Management Portal</div>
          <h1 className={`font-['Poppins'] font-black text-4xl sm:text-5xl mb-4 ${heroText}`}>
            NGO: <span className="gradient-text">{user?.name || 'Helper'}</span>
          </h1>
          <p className={`text-md max-w-md mx-auto ${subText}`}>Manage campaigns, process donations, handle local animal rescues, and post community updates.</p>
        </div>
      </section>

      {/* Main Section */}
      <section className={`py-12 min-h-[75vh] ${sectionBg}`}>
        <div className="max-w-[1250px] mx-auto px-4 sm:px-6">

          {/* Rescue Notification Banner Alert */}
          {role === 'ngo' && profileForm.areaOfWork === 'Animal Welfare' && alertRescues.length > 0 && (
            <div className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-2">
                <Bell size={18} className="shrink-0" />
                <span className="text-xs font-bold">EMERGENCY ALERTS: {alertRescues.length} unresolved animal rescues reported nearby!</span>
              </div>
              <button onClick={() => setActiveTab('rescues')} className="px-3.5 py-1.5 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-wider shrink-0">
                Rescue Now
              </button>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Pending Donations', val: pendingDonations, icon: <HeartHandshake size={20} />, color: '#13221B' },
              { label: 'Active Rescues Claims', val: claimedRescues, icon: <Shield size={20} />, color: '#3D6A53' },
              { label: 'Active Campaigns', val: campaigns.length, icon: <Calendar size={20} />, color: '#43E97B' },
              { label: 'Community Posts', val: posts.length, icon: <FileText size={20} />, color: '#FFB347' }
            ].map((metric, i) => (
              <div key={i} className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${cardBg}`}>
                <div>
                  <span className={`text-[10px] uppercase font-extrabold tracking-wider ${textMuted}`}>{metric.label}</span>
                  <p className={`text-2xl font-black font-mono mt-1 ${textTitle}`}>{metric.val}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center text-white shrink-0">
                  {metric.icon}
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-4 gap-8">

            {/* Sidebar Navigation */}
            <div className="lg:col-span-1 flex flex-col gap-2">
              <div className={`border rounded-2xl p-4 flex flex-col gap-1.5 ${cardBg}`}>
                <p className={`text-[10px] uppercase font-extrabold tracking-widest px-3 mb-2 ${textMuted}`}>NGO Navigation</p>
                <button onClick={() => setActiveTab('profile')} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${sidebarBtn(activeTab === 'profile')}`}>
                  <Building size={14} /> Profile & Achievements
                </button>
                <button onClick={() => setActiveTab('rescues')} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${sidebarBtn(activeTab === 'rescues')}`}>
                  <Shield size={14} /> Rescue Cases {alertRescues.length > 0 && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-ping" />}
                </button>
                <button onClick={() => setActiveTab('donations')} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${sidebarBtn(activeTab === 'donations')}`}>
                  <HeartHandshake size={14} /> Donations Received
                </button>
                <button onClick={() => setActiveTab('posts')} className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${sidebarBtn(activeTab === 'posts')}`}>
                  <FileText size={14} /> Updates & Posts
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">

              {loadingData ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 size={36} className="text-[#3D6A53] animate-spin" />
                  <p className={textMuted}>Loading NGO data…</p>
                </div>
              ) : (
                <>
                  {/* PROFILE TAB */}
                  {activeTab === 'profile' && (
                    <div className="flex flex-col gap-6 reveal">
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${textTitle}`}>
                          <Building size={16} className="text-[#3D6A53]" />
                          <span>NGO Institutional Information</span>
                        </h3>

                        <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>NGO Organization Name</label>
                              <input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required className={inputClass} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Government Registration Number</label>
                              <input value={profileForm.registrationNumber} onChange={e => setProfileForm({ ...profileForm, registrationNumber: e.target.value })} placeholder="e.g. NGO-10293-DL" className={inputClass} />
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Area of Work</label>
                              <select value={profileForm.areaOfWork} onChange={e => setProfileForm({ ...profileForm, areaOfWork: e.target.value })} className={selectClass}>
                                <option value="Animal Welfare">Animal Welfare</option>
                                <option value="Education">Education</option>
                                <option value="Elderly Care">Elderly Care</option>
                                <option value="Environment">Environment</option>
                                <option value="Disaster Relief">Disaster Relief</option>
                                <option value="Health">Health</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Operating Location (City, State)</label>
                              <LocationAutocomplete
                                value={profileForm.location}
                                onChange={(val) => setProfileForm({ ...profileForm, location: val })}
                                onSelectLocation={({ locationStr, latitude, longitude }) => {
                                  setProfileForm({ ...profileForm, location: locationStr, latitude, longitude })
                                }}
                                placeholder="e.g. Pune, Maharashtra"
                                inputClass={inputClass}
                                isDark={isDark}
                              />
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Contact Phone Number</label>
                              <input value={profileForm.phoneNumber} onChange={e => setProfileForm({ ...profileForm, phoneNumber: e.target.value })} placeholder="e.g. +91 99999 88888" className={inputClass} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>NGO UPI ID (for receiving donations)</label>
                              <input value={profileForm.upiId} onChange={e => setProfileForm({ ...profileForm, upiId: e.target.value })} placeholder="e.g. name@okaxis" className={inputClass} />
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Official Website URL</label>
                              <input value={profileForm.websiteUrl} onChange={e => setProfileForm({ ...profileForm, websiteUrl: e.target.value })} placeholder="e.g. www.myngo.org" className={inputClass} />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className={`text-xs font-bold ${textMuted}`}>Logo / Profile Photo</label>
                              <div className="flex items-center gap-4">
                                {profileForm.photoUrl ? (
                                  <img src={profileForm.photoUrl} alt="Logo Preview" className="w-14 h-14 rounded-2xl object-contain border border-[#13221B]/15 bg-white/[0.03]" />
                                ) : (
                                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center font-bold text-white text-base shadow-sm">
                                    {profileForm.name?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  id="ngo-logo-upload"
                                  onChange={handlePhotoUpload}
                                  className="hidden"
                                />
                                <label
                                  htmlFor="ngo-logo-upload"
                                  className="cursor-pointer px-4 py-2.5 rounded-xl border text-xs font-bold transition-all bg-[#13221B]/10 border-[#13221B]/25 text-[#2E7D59] hover:bg-[#13221B]/20"
                                >
                                  {uploadingPhoto ? 'Uploading...' : 'Choose Image'}
                                </label>
                                {uploadingPhoto && <span className="w-4 h-4 border-2 border-[#13221B] border-t-transparent rounded-full animate-spin" />}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className={`text-xs font-bold ${textMuted}`}>Detailed NGO Description</label>
                            <textarea value={profileForm.description} onChange={e => setProfileForm({ ...profileForm, description: e.target.value })} rows={4} placeholder="Describe the mission, objectives, and reach of your NGO..." className={`${inputClass} resize-none`} />
                          </div>

                          {/* Achievements & Work Done Edit */}
                          <div className="grid sm:grid-cols-2 gap-4 border-t pt-4 dark:border-white/5">
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Notable Achievements</label>
                              <textarea value={profileForm.achievements} onChange={e => setProfileForm({ ...profileForm, achievements: e.target.value })} rows={3} placeholder="E.g. Rescued 500+ animals, fed 2000 street puppies, etc." className={`${inputClass} resize-none`} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Work Done / Impact Description</label>
                              <textarea value={profileForm.workDone} onChange={e => setProfileForm({ ...profileForm, workDone: e.target.value })} rows={3} placeholder="E.g. Formed local rescue group, established veterinary support, etc." className={`${inputClass} resize-none`} />
                            </div>
                          </div>

                          {profileSuccess && (
                            <p className="text-[#43E97B] text-xs font-bold flex items-center gap-1.5">
                              <CheckCircle size={13} /> NGO Details updated successfully!
                            </p>
                          )}

                          <button type="submit" disabled={loadingProfile} className="mt-2 self-start px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold hover:shadow-lg transition-all flex items-center gap-1.5">
                            {loadingProfile ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            Save NGO Profile
                          </button>
                        </form>
                      </div>

                      {/* Password Security Change */}
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
                              <input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} minLength={8} maxLength={16} className={inputClass} />
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

                  {/* RESCUES TAB */}
                  {activeTab === 'rescues' && (
                    <div className="flex flex-col gap-6 reveal">
                      {/* Emergency Rescue Alerts (OPEN Rescues) */}
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className="font-['Poppins'] font-bold text-lg text-red-500 mb-4 flex items-center gap-2">
                          <AlertTriangle size={18} />
                          <span>Emergency Open Rescue Alerts (Nearby Cases)</span>
                        </h3>

                        {alertRescues.length === 0 ? (
                          <p className={`text-xs text-center py-6 ${textMuted}`}>No open rescue reports right now. Good job!</p>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {alertRescues.map(r => (
                              <div key={r.id} className={`p-4 rounded-xl border flex flex-col gap-2 border-red-500/20 bg-red-500/[0.02]`}>
                                <div className="flex justify-between items-start gap-2 flex-wrap">
                                  <div>
                                    <h4 className={`font-bold text-sm ${textTitle}`}>{r.animalType} - {r.condition}</h4>
                                    <p className={`text-[10px] ${textMuted}`}>Reported: {new Date(r.createdAt).toLocaleString()}</p>
                                  </div>
                                  <button onClick={() => handleClaimRescue(r.id)} className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all flex items-center gap-1">
                                    Claim Rescue
                                  </button>
                                </div>
                                <p className={`text-xs ${textTitle}`}><strong>Description:</strong> {r.description}</p>
                                <p className={`text-xs font-bold ${textTitle}`}> Location: {r.location} {r.distance ? `(${r.distance} km away)` : ''}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Claimed/Assigned Rescues */}
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${textTitle}`}>
                          <Shield size={16} className="text-[#3D6A53]" />
                          <span>My Claimed Rescue Cases</span>
                        </h3>

                        {rescues.filter(r => r.status === 'ASSIGNED').length === 0 ? (
                          <p className={`text-sm text-center py-6 ${textMuted}`}>You haven't claimed any active rescue cases yet.</p>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {rescues.filter(r => r.status === 'ASSIGNED').map(r => (
                              <div key={r.id} className={`p-4 rounded-xl border flex flex-col gap-3 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                {r.photos && r.photos.length > 0 ? (
                                  <div className="flex gap-2 overflow-x-auto py-1">
                                    {r.photos.map((photo, index) => (
                                      <div key={index} className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                        <img src={photo} alt="" className="w-full h-full object-contain" />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="w-24 h-24 rounded-lg bg-[#3D6A53]/10 flex items-center justify-center shrink-0 border border-[#3D6A53]/20">
                                    <PawPrint size={24} className="text-[#3D6A53]/30" />
                                  </div>
                                )}
                                <div className="flex justify-between items-start gap-2 flex-wrap">
                                  <div>
                                    <h4 className={`font-bold text-sm ${textTitle}`}>{r.animalType} - {r.condition}</h4>
                                    <p className={`text-[10px] ${textMuted}`}>Reporter: <strong className={textTitle}>{r.reporter?.name || 'Anonymous'}</strong> ({r.reporter?.phoneNumber || 'No phone'})</p>
                                  </div>
                                </div>
                                <p className={`text-xs ${textTitle}`}><strong>Details:</strong> {r.description}</p>
                                <p className={`text-xs font-semibold ${textTitle}`}> Location: {r.location}</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <a
                                    href={r.latitude && r.longitude
                                      ? `https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}`
                                      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(r.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-2 rounded-xl bg-[#3D6A53] hover:bg-[#2E7D59] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Navigation size={12} /> Get Directions
                                  </a>
                                  <button onClick={() => handleResolveRescue(r.id)} className="px-3.5 py-2 rounded-xl bg-[#43E97B] text-white text-xs font-bold hover:bg-[#3D6A53] transition-all flex items-center gap-1 cursor-pointer">
                                    <Check size={12} /> Mark Resolved (Success)
                                  </button>
                                  <button onClick={() => handleCloseRescue(r.id)} className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center gap-1 cursor-pointer">
                                    <X size={12} /> Mark Unsuccessful / Close
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DONATIONS TAB */}
                  {activeTab === 'donations' && (
                    <div className={`border rounded-2xl p-6 ${cardBg} reveal`}>
                      <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${textTitle}`}>
                        <HeartHandshake size={16} className="text-[#3D6A53]" />
                        <span>Donations Received</span>
                      </h3>

                      {donations.length === 0 ? (
                        <p className={`text-sm text-center py-10 ${textMuted}`}>No donations received yet.</p>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {donations.map(d => (
                            <div key={d.id} className={`p-4 rounded-xl border flex flex-col gap-3 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                              <div className="flex justify-between items-start gap-2 flex-wrap">
                                <div>
                                  <h4 className={`font-semibold text-sm ${textTitle}`}>{d.title || `${d.category} Donation`}</h4>
                                  <p className={`text-[10px] ${textMuted}`}>
                                    Donor: <strong className={textTitle}>{d.donor?.name || d.donorNgo?.name || 'Anonymous'}</strong>
                                    {(d.donor?.phoneNumber || d.donorNgo?.phoneNumber) && (
                                      <span className="ml-1.5">
                                        ( <strong className={textTitle}>{d.donor?.phoneNumber || d.donorNgo?.phoneNumber}</strong>)
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${d.status === 'DELIVERED' ? 'bg-[#43E97B]/10 text-[#43E97B]' :
                                  d.status === 'PENDING' ? 'bg-[#FFB347]/10 text-[#FFB347]' : 'bg-blue-500/10 text-blue-400'
                                  }`}>
                                  {d.status}
                                </span>
                              </div>

                              <p className={`text-xs ${textTitle}`}><strong>Description/Details:</strong> {d.description}</p>

                              <div className={`grid sm:grid-cols-2 gap-2 text-[11px] p-2.5 rounded-lg ${isDark ? 'bg-black/20' : 'bg-white border border-gray-100'} ${textMuted}`}>
                                <span> Category: <strong className={textTitle}>{d.category}</strong></span>
                                <span> Quantity: <strong className={textTitle}>{d.quantity || 1}</strong></span>
                                {d.location && <span className="sm:col-span-2"> Location: <strong className={textTitle}>{d.location}</strong></span>}
                                {d.pickupAddress && <span className="sm:col-span-2"> Pickup Address: <strong className={textTitle}>{d.pickupAddress}</strong></span>}
                              </div>

                              {/* Status updating actions */}
                              <div className="flex flex-wrap gap-2 justify-end mt-1">
                                {(d.status !== 'DELIVERED' && d.status !== 'CANCELLED') && (d.location || d.pickupAddress) && (
                                  <a
                                    href={d.latitude && d.longitude
                                      ? `https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}`
                                      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(d.pickupAddress || d.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-1.5 rounded-lg bg-[#3D6A53] hover:bg-[#2E7D59] text-white text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer mr-auto"
                                  >
                                    <Navigation size={11} /> Get Directions
                                  </a>
                                )}
                                {d.status === 'PENDING' && (
                                  <button onClick={() => handleUpdateDonationStatus(d.id, 'ACCEPTED')} className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-[#2E7D59] hover:bg-green-500/20 text-[11px] font-bold">Accept Request</button>
                                )}
                                {d.status === 'ACCEPTED' && d.pickupType !== 'VOLUNTEER' && (
                                  <button onClick={() => handleUpdateDonationStatus(d.id, 'PICKED_UP')} className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20 text-[11px] font-bold">Mark Picked Up</button>
                                )}
                                {d.status === 'ACCEPTED' && d.pickupType === 'VOLUNTEER' && (
                                  <div className="flex items-center gap-3">
                                    <span className="px-2.5 py-1.5 text-[11px] font-mono font-bold bg-[#13221B]/15 text-[#2E7D59] rounded-lg">Share OTP: {d.otp}</span>
                                    {!d.reachedDonor ? (
                                      <button onClick={() => handleNotifyReached(d.id)} className="px-3 py-1.5 rounded-lg bg-[#13221B] text-white hover:bg-[#3D6A53] text-[11px] font-bold">Notify Reached</button>
                                    ) : (
                                      <span className="px-3 py-1.5 text-[11px] font-bold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">Reached Donor</span>
                                    )}
                                  </div>
                                )}
                                {(d.status === 'ACCEPTED' || d.status === 'PICKED_UP') && (
                                  <button onClick={() => handleUpdateDonationStatus(d.id, 'DELIVERED')} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-[11px] font-bold">Mark Delivered</button>
                                )}
                                {d.status !== 'DELIVERED' && d.status !== 'CANCELLED' && (
                                  <button onClick={() => handleUpdateDonationStatus(d.id, 'CANCELLED')} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[11px] font-bold">Cancel Donation</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* UPDATES / POSTS TAB */}
                  {activeTab === 'posts' && (
                    <div className="flex flex-col gap-6 reveal">
                      {/* Create Post */}
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-3 ${textTitle}`}>Publish Community Update</h3>
                        <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Post Title</label>
                              <input value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} required placeholder="E.g. Puppy feeding drive this Sunday!" className={inputClass} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Post Type</label>
                              <select value={newPost.postType} onChange={e => setNewPost({ ...newPost, postType: e.target.value })} className={selectClass}>
                                <option value="GENERAL">General Update</option>
                                <option value="URGENT"> Urgent Call</option>
                                <option value="ACHIEVEMENT"> Achievement / Success</option>
                                <option value="EVENT"> Scheduled Event</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className={`text-xs font-bold ${textMuted}`}>Post Message / Description</label>
                            <textarea value={newPost.description} onChange={e => setNewPost({ ...newPost, description: e.target.value })} rows={3} required placeholder="What updates or alerts would you like to share?" className={`${inputClass} resize-none`} />
                          </div>

                          <button type="submit" disabled={postActionLoading} className="self-start px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold hover:shadow-lg transition-all flex items-center gap-1.5">
                            {postActionLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            Publish Update
                          </button>
                        </form>
                      </div>

                      {/* Existing Posts list */}
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-4 ${textTitle}`}>My Published Posts</h3>

                        {posts.length === 0 ? (
                          <p className={`text-sm text-center py-6 ${textMuted}`}>No posts published yet.</p>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {posts.map(p => (
                              <div key={p.id} className={`p-4 rounded-xl border flex justify-between items-start gap-4 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="px-2 py-0.5 rounded bg-[#13221B]/10 text-[#2E7D59] text-[9px] font-bold uppercase">{p.postType}</span>
                                    <span className={`text-[10px] ${textMuted}`}>{new Date(p.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <h4 className={`font-bold text-sm mb-1 ${textTitle}`}>{p.title}</h4>
                                  <p className={`text-xs leading-relaxed ${textMuted}`}>{p.description}</p>
                                </div>
                                <button onClick={() => handleDeletePost(p.id)} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20" title="Delete post">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
