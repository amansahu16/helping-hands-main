import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Users, Building, Heart, Calendar, ShieldAlert,
  Save, Trash2, CheckCircle, Loader2, Mail, Phone, MapPin,
  MessageSquare, Settings, AlertOctagon, Plus, X, Globe, Star
} from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import useScrollReveal from '../../hooks/useScrollReveal'
import LocationAutocomplete from '../../components/LocationAutocomplete'
import bgImg from '../images/admin.png'

export default function AdminDashboard() {
  useScrollReveal()
  const { user, role, loading: authLoading } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()

  // Tab State
  const [activeTab, setActiveTab] = useState('stats') // 'stats' | 'ngos' | 'operations' | 'settings' | 'complaints'

  // Loading States
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Data States
  const [stats, setStats] = useState(null)
  const [ngos, setNgos] = useState([])
  const [operations, setOperations] = useState({ campaigns: [], donations: [], rescues: [], users: [], ngos: [] })
  const [contactSettings, setContactSettings] = useState({ contact_email: '', contact_phone: '', contact_network: '' })
  const [locations, setLocations] = useState([])
  const [feedbackData, setFeedbackData] = useState({ testimonials: [], contactMessages: [], complaints: [] })

  // Search/Filter states for operations moderator
  const [opSearch, setOpSearch] = useState('')
  const [opType, setOpType] = useState('campaign') // 'campaign' | 'donation' | 'rescue' | 'user' | 'ngo'

  // New Location form state
  const [newLoc, setNewLoc] = useState({ name: '', address: '', latitude: '', longitude: '', type: 'GENERAL' })

  // Load Dashboard Data
  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      // Execute all dashboard queries in parallel to drastically improve loading speed and responsiveness
      const [
        statsRes,
        ngosRes,
        opsRes,
        settingsRes,
        locsRes,
        feedsRes
      ] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/ngos'),
        api.get('/admin/operations'),
        api.get('/admin/contact-settings'),
        api.get('/public/locations'),
        api.get('/admin/feedbacks')
      ])

      // 1. Stats
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data)
      } else {
        console.error('Error loading admin stats:', statsRes.reason)
      }

      // 2. NGOs pending verification
      if (ngosRes.status === 'fulfilled') {
        setNgos(ngosRes.value.data || [])
      } else {
        console.error('Error loading admin NGOs:', ngosRes.reason)
      }

      // 3. Operations for moderation
      if (opsRes.status === 'fulfilled') {
        setOperations(opsRes.value.data || { campaigns: [], donations: [], rescues: [], users: [], ngos: [] })
      } else {
        console.error('Error loading admin operations:', opsRes.reason)
      }

      // 4. Contact settings
      if (settingsRes.status === 'fulfilled') {
        setContactSettings(settingsRes.value.data || { contact_email: '', contact_phone: '', contact_network: '' })
      } else {
        console.error('Error loading admin contact settings:', settingsRes.reason)
      }

      // 5. Locations list
      if (locsRes.status === 'fulfilled') {
        setLocations(locsRes.value.data || [])
      } else {
        console.error('Error loading locations:', locsRes.reason)
      }

      // 6. Feedbacks & Complaints
      if (feedsRes.status === 'fulfilled') {
        setFeedbackData(feedsRes.value.data || { testimonials: [], contactMessages: [], complaints: [] })
      } else {
        console.error('Error loading admin feedbacks:', feedsRes.reason)
      }

    } catch (err) {
      console.error('Error loading admin dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user || role !== 'admin') {
      navigate('/')
      return
    }
    loadDashboardData()
  }, [user, role, authLoading, loadDashboardData, navigate])

  // NGO Verification handlers
  const handleVerifyNgo = async (ngoId, verified) => {
    setActionLoading(true)
    try {
      await api.put(`/admin/ngos/${ngoId}/verify`, { verified })
      await loadDashboardData()
      alert(`NGO verification status updated successfully!`)
    } catch (err) {
      alert(err.response?.data?.message || 'Verification update failed')
    } finally {
      setActionLoading(false)
    }
  }

  // Operation Moderation delete
  const handleDeleteOperation = async (type, id) => {
    if (!window.confirm(`Are you sure you want to discard/delete this ${type}? This action is irreversible.`)) return
    setActionLoading(true)
    try {
      await api.delete(`/admin/operations/${type}/${id}`)
      await loadDashboardData()
      alert(`${type} has been deleted/discarded.`)
    } catch (err) {
      alert(err.response?.data?.message || 'Delete operation failed')
    } finally {
      setActionLoading(false)
    }
  }

  // Update Contact Info settings
  const handleUpdateSettings = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      await api.put('/admin/contact-settings', contactSettings)
      alert('Contact settings updated successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update contact settings')
    } finally {
      setActionLoading(false)
    }
  }

  // Add Location
  const handleAddLocation = async (e) => {
    e.preventDefault()
    if (!newLoc.name || !newLoc.address) {
      alert('Location name and address are required')
      return
    }
    setActionLoading(true)
    try {
      await api.post('/admin/locations', newLoc)
      setNewLoc({ name: '', address: '', latitude: '', longitude: '', type: 'GENERAL' })
      // Reload locations
      const { data: locsData } = await api.get('/public/locations')
      setLocations(locsData || [])
      alert('Office location added successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add office location')
    } finally {
      setActionLoading(false)
    }
  }

  // Delete Location
  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this office location?')) return
    setActionLoading(true)
    try {
      await api.delete(`/admin/locations/${id}`)
      // Reload locations
      const { data: locsData } = await api.get('/public/locations')
      setLocations(locsData || [])
      alert('Office location deleted successfully')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete location')
    } finally {
      setActionLoading(false)
    }
  }

  // Resolve Complaint status
  const handleResolveComplaint = async (id, status) => {
    setActionLoading(true)
    try {
      await api.put(`/admin/complaints/${id}/resolve`, { status })
      await loadDashboardData()
      alert(`Complaint status updated to ${status}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update complaint status')
    } finally {
      setActionLoading(false)
    }
  }

  // Delete Testimony/Message
  const handleDeleteFeedback = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type === 'testimonial' ? 'review' : 'message'}?`)) return
    setActionLoading(true)
    try {
      await api.delete(`/admin/feedbacks/${type}/${id}`)
      await loadDashboardData()
      alert('Feedback deleted successfully')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete feedback')
    } finally {
      setActionLoading(false)
    }
  }

  // Theme styling tokens
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={36} className="text-[#3D6A53] animate-spin" />
      </div>
    )
  }

  return (
    <div className="page-enter">
      {/* Hero Header */}
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
          <div className="section-label mb-3 bg-[#43E97B]/20 text-[#43E97B] border-none">Administrator Core</div>
          <h1 className={`font-['Poppins'] font-black text-4xl sm:text-5xl mb-4 ${heroText}`}>
            Helping Hands <span className="gradient-text">Admin Panel</span>
          </h1>
          <p className={`text-md max-w-md mx-auto ${subText}`}>Moderation portal to approve/reject NGOs, view system analytics, dynamic contact details, resolve complaints, and manage platform safety.</p>
        </div>
      </section>

      {/* Main Container */}
      <section className={`py-12 min-h-[75vh] ${sectionBg}`}>
        <div className="max-w-[1250px] mx-auto px-4 sm:px-6">

          <div className="grid lg:grid-cols-4 gap-8">

            {/* Sidebar Controls */}
            <div className="lg:col-span-1 flex flex-col gap-2">
              <div className={`border rounded-2xl p-4 flex flex-row flex-wrap lg:flex-col gap-2 ${cardBg}`}>
                <p className={`text-[10px] uppercase font-extrabold tracking-widest px-3 mb-2 w-full lg:w-auto ${textMuted}`}>Admin Controls</p>
                <button onClick={() => setActiveTab('stats')} className={`flex-1 min-w-[150px] lg:min-w-0 lg:w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${sidebarBtn(activeTab === 'stats')}`}>
                  <Shield size={14} /> System Analytics
                </button>
                <button onClick={() => setActiveTab('ngos')} className={`flex-1 min-w-[150px] lg:min-w-0 lg:w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${sidebarBtn(activeTab === 'ngos')}`}>
                  <Building size={14} /> NGO Verifications
                  {ngos.filter(n => !n.verified).length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#43E97B] text-[#0A0F0C] font-black text-[9px] px-1.5 py-0.5 rounded-full">
                      {ngos.filter(n => !n.verified).length}
                    </span>
                  )}
                </button>
                <button onClick={() => setActiveTab('operations')} className={`flex-1 min-w-[150px] lg:min-w-0 lg:w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${sidebarBtn(activeTab === 'operations')}`}>
                  <AlertOctagon size={14} /> Operations Moderator
                </button>
                <button onClick={() => setActiveTab('settings')} className={`flex-1 min-w-[150px] lg:min-w-0 lg:w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${sidebarBtn(activeTab === 'settings')}`}>
                  <Settings size={14} /> System & Office Settings
                </button>
                <button onClick={() => setActiveTab('complaints')} className={`flex-1 min-w-[150px] lg:min-w-0 lg:w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${sidebarBtn(activeTab === 'complaints')}`}>
                  <ShieldAlert size={14} /> Complaints & Messages
                  {feedbackData.complaints.filter(c => c.status === 'PENDING').length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">
                      {feedbackData.complaints.filter(c => c.status === 'PENDING').length}
                    </span>
                  )}
                </button>
                <button onClick={() => setActiveTab('donations')} className={`flex-1 min-w-[150px] lg:min-w-0 lg:w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${sidebarBtn(activeTab === 'donations')}`}>
                  <Heart size={14} /> Donation Records
                </button>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 size={36} className="text-[#3D6A53] animate-spin" />
                  <p className={textMuted}>Gathering system metrics...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: SYSTEM STATS & METRICS */}
                  {activeTab === 'stats' && stats && (
                    <div className="flex flex-col gap-8 reveal">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {[
                          { label: 'Registered Users', val: stats.core.users, icon: <Users size={18} /> },
                          { label: 'Registered NGOs', val: stats.core.ngos, icon: <Building size={18} /> },
                          { label: 'Total Donations', val: stats.core.donations, icon: <Heart size={18} /> },
                          { label: 'Animals Rescued', val: stats.rescues.resolved, icon: <Shield size={18} /> },
                          { label: 'Animals Adopted', val: stats.welfare.adopted, icon: <CheckCircle size={18} /> },
                          { label: 'Animals Fed', val: stats.welfare.fed, icon: <Calendar size={18} /> },
                        ].map((m, i) => (
                          <div key={i} className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${cardBg}`}>
                            <div>
                              <span className={`text-[10px] uppercase font-black tracking-wider ${textMuted}`}>{m.label}</span>
                              <p className={`text-3xl font-black font-mono mt-1.5 ${textTitle}`}>{m.val}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center text-white shrink-0">
                              {m.icon}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Financial Transactions stats */}
                      {stats.transactions && (
                        <div className={`p-6 rounded-2xl border ${cardBg}`}>
                          <h4 className={`font-['Poppins'] font-bold text-sm mb-4 ${textTitle}`}> Monetary Transactions Overview</h4>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                              <span className="text-[10px] uppercase font-bold text-green-500">Transaction Count</span>
                              <p className="text-2xl font-black font-mono mt-1 text-green-400">{stats.transactions.count}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-[#43E97B]/10 border border-[#43E97B]/20">
                              <span className="text-[10px] uppercase font-bold text-[#43E97B]">Total Amount Circulated</span>
                              <p className="text-2xl font-black font-mono mt-1 text-[#43E97B]">₹{stats.transactions.sum.toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Operation details stats */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className={`p-6 rounded-2xl border ${cardBg}`}>
                          <h4 className={`font-['Poppins'] font-bold text-sm mb-4 ${textTitle}`}>Campaign Operations</h4>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-3 rounded-xl bg-[#13221B]/10 border border-[#13221B]/20">
                              <span className="text-[10px] uppercase font-bold text-green-500">Completed</span>
                              <p className="text-xl font-bold font-mono mt-1">{stats.campaigns.completed}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-[#FFB347]/10 border border-[#FFB347]/20">
                              <span className="text-[10px] uppercase font-bold text-yellow-500">Ongoing</span>
                              <p className="text-xl font-bold font-mono mt-1">{stats.campaigns.ongoing}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                              <span className="text-[10px] uppercase font-bold text-blue-400">Planned</span>
                              <p className="text-xl font-bold font-mono mt-1">{stats.campaigns.planned}</p>
                            </div>
                          </div>
                        </div>

                        <div className={`p-6 rounded-2xl border ${cardBg}`}>
                          <h4 className={`font-['Poppins'] font-bold text-sm mb-4 ${textTitle}`}>Rescue Requests Log</h4>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                              <span className="text-[10px] uppercase font-bold text-red-500">Open Alerts</span>
                              <p className="text-xl font-bold font-mono mt-1">{stats.rescues.open}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-[#FFB347]/10 border border-[#FFB347]/20">
                              <span className="text-[10px] uppercase font-bold text-yellow-500">Active Claims</span>
                              <p className="text-xl font-bold font-mono mt-1">{stats.rescues.active}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                              <span className="text-[10px] uppercase font-bold text-green-500">Resolved Cases</span>
                              <p className="text-xl font-bold font-mono mt-1">{stats.rescues.resolved}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${cardBg}`}>
                        <div>
                          <span className={`text-[10px] uppercase font-black tracking-wider ${textMuted}`}>Circulated Goods Value (Active/Delivered Donations)</span>
                          <p className={`text-2xl font-black font-mono mt-1 ${textTitle}`}>{stats.goods.circulated} Active Operations</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center text-white shrink-0">
                          <Globe size={18} />
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'stats' && !stats && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 reveal">
                      <AlertOctagon size={36} className="text-red-500" />
                      <p className={textMuted}>Failed to gather system metrics.</p>
                      <button onClick={loadDashboardData} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold hover:shadow-md transition-all">
                        Retry Loading
                      </button>
                    </div>
                  )}

                  {/* TAB 2: NGO VERIFICATION CERTIFICATE REVIEW */}
                  {activeTab === 'ngos' && (
                    <div className="flex flex-col gap-6 reveal">
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-4 ${textTitle}`}>NGO Approval Queue</h3>

                        {ngos.filter(n => !n.verified).length === 0 ? (
                          <p className={`text-sm text-center py-10 ${textMuted}`}>No pending NGO approvals at the moment.</p>
                        ) : (
                          <div className="flex flex-col gap-6">
                            {ngos.filter(n => !n.verified).map(n => (
                              <div key={n.id} className={`p-5 rounded-xl border flex flex-col gap-4 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex justify-between items-start flex-wrap gap-3">
                                  <div>
                                    <h4 className={`font-bold text-md ${textTitle}`}>{n.name}</h4>
                                    <p className={`text-xs ${textMuted}`}>Reg Number: <strong className={textTitle}>{n.registrationNumber}</strong></p>
                                    <p className={`text-xs ${textMuted}`}>Email: <strong className={textTitle}>{n.email}</strong> | Phone: <strong className={textTitle}>{n.phoneNumber || 'N/A'}</strong></p>
                                    <p className={`text-xs mt-1 ${textTitle}`}><strong>Focus Area:</strong> {n.areaOfWork || 'General welfare'}</p>
                                    {n.description && <p className={`text-xs mt-1.5 max-w-xl leading-relaxed ${textMuted}`}><strong>Description:</strong> {n.description}</p>}
                                  </div>

                                  <div className="flex gap-2">
                                    <button onClick={() => handleVerifyNgo(n.id, true)} disabled={actionLoading} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold hover:shadow-md transition-all">
                                      Approve / Verify
                                    </button>
                                    <button onClick={() => handleVerifyNgo(n.id, false)} disabled={actionLoading} className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all">
                                      Reject
                                    </button>
                                  </div>
                                </div>

                                {n.certificateUrl ? (
                                  <div className="border border-dashed rounded-lg p-3 dark:border-white/10 dark:bg-black/20">
                                    <p className={`text-xs font-bold mb-2 ${textTitle}`}>Uploaded Registration Certificate:</p>
                                    {n.certificateUrl.toLowerCase().endsWith('.pdf') ? (
                                      <a href={n.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-[#2E7D59] hover:underline text-xs font-bold flex items-center gap-1">
                                        View Certificate PDF Document ↗
                                      </a>
                                    ) : (
                                      <div className="max-w-md overflow-hidden rounded-lg">
                                        <img src={n.certificateUrl} alt="NGO Certificate" className="max-h-60 object-contain hover:scale-105 transition-all" />
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500 text-xs">
                                    ⚠ NGO registered without uploading a verification certificate.
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* All Registered NGOs */}
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-4 ${textTitle}`}>All Registered NGOs</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className={`border-b dark:border-white/5 ${textMuted} font-bold`}>
                                <th className="pb-2">NGO Name</th>
                                <th className="pb-2">Reg Number</th>
                                <th className="pb-2">Status</th>
                                <th className="pb-2">Joined Date</th>
                                <th className="pb-2 text-right">Certificate</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ngos.map(n => (
                                <tr key={n.id} className="border-b last:border-0 dark:border-white/5 hover:bg-white/[0.01]">
                                  <td className={`py-3 font-semibold ${textTitle}`}>{n.name}</td>
                                  <td className={`py-3 ${textMuted}`}>{n.registrationNumber}</td>
                                  <td className="py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${n.verified ? 'bg-[#43E97B]/10 text-[#43E97B]' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                      {n.verified ? 'Verified ✓' : 'Pending Verification'}
                                    </span>
                                  </td>
                                  <td className={`py-3 ${textMuted}`}>{new Date(n.createdAt).toLocaleDateString()}</td>
                                  <td className="py-3 text-right">
                                    {n.certificateUrl ? (
                                      <a href={n.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-[#2E7D59] hover:underline font-bold">
                                        View ↗
                                      </a>
                                    ) : 'None'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: OPERATIONS MODERATOR */}
                  {activeTab === 'operations' && (
                    <div className="flex flex-col gap-6 reveal">
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-2 ${textTitle}`}>Operations Moderator</h3>
                        <p className={`text-xs mb-5 ${textMuted}`}>Search and discard any violations, exploitation, or misbehaviour by deleting campaigns, donations, rescues, users, or NGOs.</p>

                        {/* Filters bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                          <div className="flex rounded-full p-1 border dark:border-white/10 dark:bg-white/[0.02]">
                            {['campaign', 'donation', 'rescue', 'user', 'ngo'].map(type => (
                              <button
                                key={type}
                                onClick={() => { setOpType(type); setOpSearch(''); }}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${opType === type
                                  ? 'bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white'
                                  : isDark ? 'text-[#8888AA] hover:text-white' : 'text-[#6366F1] hover:text-[#13221B]'
                                  }`}
                              >
                                {type}s
                              </button>
                            ))}
                          </div>

                          <input
                            value={opSearch}
                            onChange={e => setOpSearch(e.target.value)}
                            placeholder={`Search ${opType}s by title, name or details...`}
                            className={`${inputClass} max-w-xs`}
                          />
                        </div>

                        {/* List according to type */}
                        <div className="flex flex-col gap-4">
                          {/* CAMPAIGNS */}
                          {opType === 'campaign' && (
                            operations.campaigns
                              .filter(c => (c.name || '').toLowerCase().includes(opSearch.toLowerCase()) || (c.organizerUser?.name || c.organizerNgo?.name || '').toLowerCase().includes(opSearch.toLowerCase()))
                              .map(c => (
                                <div key={c.id} className={`p-4 rounded-xl border flex justify-between items-start gap-4 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 uppercase`}>{c.type}</span>
                                      <span className={`text-[10px] ${textMuted}`}>Organizer: <strong className={textTitle}>{c.organizerUser?.name || c.organizerNgo?.name || 'Anonymous'}</strong></span>
                                    </div>
                                    <h4 className={`font-bold text-sm ${textTitle}`}>{c.name}</h4>
                                    <p className={`text-xs mt-1 ${textMuted}`}>{c.description}</p>
                                    <p className={`text-[10px] mt-1 font-bold ${textTitle}`}>📍 Location: {c.location} | Volunteers: {c.currentParticipants || 0} / {c.maxParticipants || 'Unlimited'}</p>
                                  </div>
                                  <button onClick={() => handleDeleteOperation('campaign', c.id)} className="p-2 text-red-500 bg-red-500/10 hover:bg-red-500/25 rounded-xl border border-red-500/20 shrink-0">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))
                          )}

                          {/* DONATIONS */}
                          {opType === 'donation' && (
                            operations.donations
                              .filter(d => (d.title || d.category || '').toLowerCase().includes(opSearch.toLowerCase()) || (d.donor?.name || d.donorNgo?.name || '').toLowerCase().includes(opSearch.toLowerCase()))
                              .map(d => (
                                <div key={d.id} className={`p-4 rounded-xl border flex justify-between items-start gap-4 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-[#43E97B]/10 text-[#43E97B] uppercase`}>{d.status}</span>
                                      <span className={`text-[10px] ${textMuted}`}>Donor: <strong className={textTitle}>{d.donor?.name || d.donorNgo?.name || 'Anonymous'}</strong></span>
                                    </div>
                                    <h4 className={`font-bold text-sm ${textTitle}`}>{d.title || `${d.category} Donation`}</h4>
                                    {d.amount && (
                                      <p className="text-xs font-black text-green-500 mt-1">Amount: ₹{d.amount} (UPI Direct)</p>
                                    )}
                                    <p className={`text-xs mt-1 ${textMuted}`}>{d.description}</p>
                                    {d.transactionId && (
                                      <p className="text-[10px] text-yellow-500 font-mono mt-0.5">Transaction ID: {d.transactionId}</p>
                                    )}
                                    <p className={`text-[10px] mt-1 font-bold ${textTitle}`}>
                                      {d.amount ? `UPI ID: ${d.recipientNgo?.upiId || 'platform'}` : `Qty: ${d.quantity || 1}`} | Recipient: {d.recipientNgo?.name || 'None'}
                                    </p>
                                  </div>
                                  <button onClick={() => handleDeleteOperation('donation', d.id)} className="p-2 text-red-500 bg-red-500/10 hover:bg-red-500/25 rounded-xl border border-red-500/20 shrink-0">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))
                          )}

                          {/* RESCUES */}
                          {opType === 'rescue' && (
                            operations.rescues
                              .filter(r => (r.animalType || '').toLowerCase().includes(opSearch.toLowerCase()) || (r.reporter?.name || r.reporterNgo?.name || '').toLowerCase().includes(opSearch.toLowerCase()))
                              .map(r => (
                                <div key={r.id} className={`p-4 rounded-xl border flex justify-between items-start gap-4 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 uppercase`}>{r.status}</span>
                                      <span className={`text-[10px] ${textMuted}`}>Reporter: <strong className={textTitle}>{r.reporter?.name || r.reporterNgo?.name || 'Anonymous'}</strong></span>
                                      {r.nearbyCenter && (
                                        <span className={`text-[10px] ${textMuted}`}> | Assigned NGO: <strong className={textTitle}>{r.nearbyCenter.name}</strong></span>
                                      )}
                                    </div>
                                    <h4 className={`font-bold text-sm ${textTitle}`}>{r.animalType} ({r.condition})</h4>
                                    <p className={`text-xs mt-1 ${textMuted}`}>{r.description}</p>
                                    <p className={`text-[10px] mt-1 font-bold ${textTitle}`}>📍 Location: {r.location}</p>
                                  </div>
                                  <button onClick={() => handleDeleteOperation('rescue', r.id)} className="p-2 text-red-500 bg-red-500/10 hover:bg-red-500/25 rounded-xl border border-red-500/20 shrink-0">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))
                          )}

                          {/* USERS */}
                          {opType === 'user' && (
                            operations.users
                              .filter(u => (u.name || '').toLowerCase().includes(opSearch.toLowerCase()) || (u.email || '').toLowerCase().includes(opSearch.toLowerCase()))
                              .map(u => (
                                <div key={u.id} className={`p-4 rounded-xl border flex justify-between items-start gap-4 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                  <div>
                                    <h4 className={`font-bold text-sm ${textTitle}`}>{u.name}</h4>
                                    <p className={`text-xs ${textMuted}`}>Email: {u.email} | Phone: {u.phoneNumber || 'N/A'}</p>
                                    <p className={`text-[10px] mt-1 ${textMuted}`}>Registered: {new Date(u.createdAt).toLocaleDateString()}</p>
                                  </div>
                                  <button onClick={() => handleDeleteOperation('user', u.id)} className="p-2 text-red-500 bg-red-500/10 hover:bg-red-500/25 rounded-xl border border-red-500/20 shrink-0">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))
                          )}

                          {/* NGOS */}
                          {opType === 'ngo' && (
                            operations.ngos
                              .filter(n => (n.name || '').toLowerCase().includes(opSearch.toLowerCase()) || (n.email || '').toLowerCase().includes(opSearch.toLowerCase()))
                              .map(n => (
                                <div key={n.id} className={`p-4 rounded-xl border flex justify-between items-start gap-4 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${n.verified ? 'bg-[#43E97B]/10 text-[#43E97B]' : 'bg-yellow-500/10 text-yellow-500'} uppercase`}>{n.verified ? 'Verified' : 'Unverified'}</span>
                                    </div>
                                    <h4 className={`font-bold text-sm ${textTitle}`}>{n.name}</h4>
                                    <p className={`text-xs ${textMuted}`}>Reg Number: {n.registrationNumber} | Email: {n.email}</p>
                                  </div>
                                  <button onClick={() => handleDeleteOperation('ngo', n.id)} className="p-2 text-red-500 bg-red-500/10 hover:bg-red-500/25 rounded-xl border border-red-500/20 shrink-0">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))
                          )}
                        </div>

                      </div>
                    </div>
                  )}

                  {/* TAB 4: SYSTEM CONTACT SETTINGS & LOCATIONS */}
                  {activeTab === 'settings' && (
                    <div className="flex flex-col gap-6 reveal">
                      {/* Dynamic Contact settings */}
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${textTitle}`}>
                          <Settings size={16} className="text-[#3D6A53]" />
                          <span>Configure Contact Settings</span>
                        </h3>

                        <form onSubmit={handleUpdateSettings} className="flex flex-col gap-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Contact Us Email</label>
                              <input value={contactSettings.contact_email} onChange={e => setContactSettings({ ...contactSettings, contact_email: e.target.value })} required className={inputClass} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-bold ${textMuted}`}>Contact Us Phone</label>
                              <input value={contactSettings.contact_phone} onChange={e => setContactSettings({ ...contactSettings, contact_phone: e.target.value })} required className={inputClass} />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className={`text-xs font-bold ${textMuted}`}>Operating Network Title</label>
                            <input value={contactSettings.contact_network} onChange={e => setContactSettings({ ...contactSettings, contact_network: e.target.value })} required className={inputClass} />
                          </div>

                          <button type="submit" className="self-start px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold hover:shadow-md transition-all">
                            Save Settings
                          </button>
                        </form>
                      </div>

                      {/* Locations Manager */}
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${textTitle}`}>
                          <MapPin size={16} className="text-[#3D6A53]" />
                          <span>Office Locations Directory</span>
                        </h3>

                        {/* List existing */}
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                          {locations.map(loc => (
                            <div key={loc.id} className={`p-4 rounded-xl border flex justify-between items-center ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                              <div>
                                <p className={`font-bold text-sm ${textTitle}`}>{loc.name}</p>
                                <p className={`text-xs ${textMuted}`}>{loc.address}</p>
                                {loc.latitude && <p className="text-[10px] text-green-500 font-mono">📍 {loc.latitude}, {loc.longitude}</p>}
                              </div>
                              <button onClick={() => handleDeleteLocation(loc.id)} className="p-2 text-red-500 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 rounded-xl">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add new */}
                        <form onSubmit={handleAddLocation} className="border-t dark:border-white/5 pt-5 flex flex-col gap-4">
                          <p className={`text-xs font-bold ${textTitle}`}>Add New Office Location</p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-semibold ${textMuted}`}>Location Name</label>
                              <input value={newLoc.name} onChange={e => setNewLoc({ ...newLoc, name: e.target.value })} placeholder="e.g. Pune Central Office" required className={inputClass} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-semibold ${textMuted}`}>Office Type</label>
                              <select value={newLoc.type} onChange={e => setNewLoc({ ...newLoc, type: e.target.value })} className={selectClass}>
                                <option value="GENERAL">General Office</option>
                                <option value="HEADQUARTERS">Headquarters</option>
                                <option value="SHELTER">Center / Shelter</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className={`text-xs font-semibold ${textMuted}`}>Full Address</label>
                            <LocationAutocomplete
                              value={newLoc.address}
                              onChange={(val) => setNewLoc({ ...newLoc, address: val })}
                              onSelectLocation={({ locationStr, latitude, longitude }) => {
                                setNewLoc({ ...newLoc, address: locationStr, latitude, longitude })
                              }}
                              placeholder="City, Area, Road..."
                              inputClass={inputClass}
                              isDark={isDark}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-semibold ${textMuted}`}>Latitude (optional)</label>
                              <input type="number" step="any" value={newLoc.latitude} onChange={e => setNewLoc({ ...newLoc, latitude: e.target.value })} placeholder="e.g. 18.520" className={inputClass} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className={`text-xs font-semibold ${textMuted}`}>Longitude (optional)</label>
                              <input type="number" step="any" value={newLoc.longitude} onChange={e => setNewLoc({ ...newLoc, longitude: e.target.value })} placeholder="e.g. 73.856" className={inputClass} />
                            </div>
                          </div>

                          <button type="submit" className="self-start px-5 py-2 flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold hover:shadow-md transition-all">
                            <Plus size={14} /> Add Location
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: COMPLAINTS & FEEDBACK RESOLUTION */}
                  {activeTab === 'complaints' && (
                    <div className="flex flex-col gap-6 reveal">
                      {/* Complaints */}
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${textTitle}`}>
                          <ShieldAlert size={16} className="text-red-500" />
                          <span>Complaints Log & Safety reports</span>
                        </h3>

                        {feedbackData.complaints.length === 0 ? (
                          <p className={`text-sm text-center py-6 ${textMuted}`}>No complaints filed yet. Platform safety is solid!</p>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {feedbackData.complaints.map(comp => (
                              <div key={comp.id} className={`p-4 rounded-xl border flex flex-col gap-2 ${comp.status === 'PENDING' ? 'border-red-500/20 bg-red-500/[0.01]' : 'dark:bg-white/[0.01] dark:border-white/5'}`}>
                                <div className="flex justify-between items-start flex-wrap gap-2">
                                  <div>
                                    <h4 className={`font-bold text-sm ${textTitle}`}>{comp.title}</h4>
                                    <p className={`text-[10px] ${textMuted}`}>Reporter: <strong className={textTitle}>{comp.reporter?.name || 'Guest'}</strong> ({comp.reporter?.email || 'N/A'})</p>
                                    <p className={`text-[10px] ${textMuted}`}>Target: <strong className="text-red-400">{comp.targetType} (ID: {comp.targetId})</strong></p>
                                  </div>

                                  <div className="flex gap-2">
                                    {comp.status === 'PENDING' ? (
                                      <>
                                        <button onClick={() => handleResolveComplaint(comp.id, 'RESOLVED')} className="px-3 py-1.5 rounded-lg bg-green-500 text-white text-[10px] font-bold hover:bg-green-600">Resolve</button>
                                        <button onClick={() => handleResolveComplaint(comp.id, 'DISMISSED')} className="px-3 py-1.5 rounded-lg bg-gray-500 text-white text-[10px] font-bold hover:bg-gray-600">Dismiss</button>
                                      </>
                                    ) : (
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${comp.status === 'RESOLVED' ? 'bg-[#43E97B]/10 text-[#43E97B]' : 'bg-gray-500/10 text-gray-400'}`}>
                                        {comp.status}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className={`text-xs mt-1 ${textTitle}`}><strong>Description:</strong> {comp.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Contact messages */}
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${textTitle}`}>
                          <Mail size={16} className="text-[#3D6A53]" />
                          <span>Contact Us Inbound Messages</span>
                        </h3>

                        {feedbackData.contactMessages.length === 0 ? (
                          <p className={`text-sm text-center py-6 ${textMuted}`}>No incoming contact messages.</p>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {feedbackData.contactMessages.map(msg => (
                              <div key={msg.id} className={`p-4 rounded-xl border flex justify-between items-start gap-4 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="font-bold text-xs">{msg.name}</span>
                                    <span className={`text-[10px] ${textMuted}`}>({msg.email} | {msg.phone || 'No phone'})</span>
                                  </div>
                                  <p className={`text-xs leading-relaxed ${textTitle}`}>{msg.message}</p>
                                  <p className={`text-[9px] mt-1 ${textMuted}`}>{new Date(msg.createdAt).toLocaleString()}</p>
                                </div>
                                <button onClick={() => handleDeleteFeedback('message', msg.id)} className="p-2 text-red-500 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 rounded-xl shrink-0">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Testimonials */}
                      <div className={`border rounded-2xl p-6 ${cardBg}`}>
                        <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${textTitle}`}>
                          <Star size={16} className="text-yellow-500" />
                          <span>Reviews & Testimonials Suggestions</span>
                        </h3>

                        {feedbackData.testimonials.length === 0 ? (
                          <p className={`text-sm text-center py-6 ${textMuted}`}>No reviews submitted yet.</p>
                        ) : (
                          <div className="flex flex-col gap-4">
                            {feedbackData.testimonials.map(test => (
                              <div key={test.id} className={`p-4 rounded-xl border flex justify-between items-start gap-4 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <span className="font-bold text-xs">{test.user?.name || 'Anonymous'}</span>
                                    <span className={`text-[10px] ${textMuted}`}>({test.user?.email || 'N/A'})</span>
                                    <div className="flex items-center gap-0.5 ml-2 text-yellow-500">
                                      {Array.from({ length: test.rating || 5 }).map((_, idx) => <Star key={idx} size={10} className="fill-yellow-500" />)}
                                    </div>
                                  </div>
                                  <p className={`text-xs leading-relaxed ${textTitle}`}>{test.content}</p>
                                </div>
                                <button onClick={() => handleDeleteFeedback('testimonial', test.id)} className="p-2 text-red-500 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 rounded-xl shrink-0">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: DONATIONS RECORDS */}
                  {activeTab === 'donations' && (() => {
                    const moneyDonations = (operations.donations || []).filter(d => d.category === 'MONEY');
                    const totalDonationAmount = moneyDonations.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
                    
                    const uniqueNgos = new Set();
                    moneyDonations.forEach(d => {
                      if (d.recipientNgoId) uniqueNgos.add(d.recipientNgoId);
                      else if (d.ngoId) uniqueNgos.add(d.ngoId);
                    });
                    const totalUniqueNgos = uniqueNgos.size;

                    const uniqueDonors = new Set();
                    moneyDonations.forEach(d => {
                      if (d.donorId) uniqueDonors.add(d.donorId);
                    });
                    const totalUniqueDonors = uniqueDonors.size;

                    return (
                      <div className="flex flex-col gap-6 reveal">
                        <div className={`border rounded-2xl p-6 ${cardBg}`}>
                          <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${textTitle}`}>
                            <Heart size={16} className="text-[#3D6A53]" />
                            <span>Monetary Donation Transactions</span>
                          </h3>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                              <span className={`text-[10px] uppercase font-bold tracking-wider ${textMuted}`}>Total Transactions</span>
                              <p className={`text-xl font-extrabold mt-1 font-mono ${textTitle}`}>{moneyDonations.length}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                              <span className={`text-[10px] uppercase font-bold tracking-wider ${textMuted}`}>Total Funds Received</span>
                              <p className="text-xl font-extrabold mt-1 font-mono text-[#43E97B]">₹{totalDonationAmount.toLocaleString()}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                              <span className={`text-[10px] uppercase font-bold tracking-wider ${textMuted}`}>Total Active NGOs</span>
                              <p className={`text-xl font-extrabold mt-1 font-mono ${textTitle}`}>{totalUniqueNgos}</p>
                            </div>
                            <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                              <span className={`text-[10px] uppercase font-bold tracking-wider ${textMuted}`}>Total Direct Donors</span>
                              <p className={`text-xl font-extrabold mt-1 font-mono ${textTitle}`}>{totalUniqueDonors}</p>
                            </div>
                          </div>

                          {/* Transactions Table */}
                          {moneyDonations.length === 0 ? (
                            <p className={`text-sm text-center py-10 ${textMuted}`}>No monetary transaction records found.</p>
                          ) : (
                            <div className="overflow-x-auto w-full">
                              <table className="w-full border-collapse text-left text-xs">
                                <thead>
                                  <tr className={`border-b ${isDark ? 'border-white/5' : 'border-gray-200'} ${textMuted} font-bold`}>
                                    <th className="py-3 px-4">Donor Name</th>
                                    <th className="py-3 px-4">NGO Recipient</th>
                                    <th className="py-3 px-4">Amount</th>
                                    <th className="py-3 px-4">Payment UTR</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {moneyDonations.map(d => (
                                    <tr key={d.id} className={`border-b ${isDark ? 'border-white/5 hover:bg-white/[0.02]' : 'border-gray-100 hover:bg-gray-50/50'} transition-all`}>
                                      <td className={`py-3.5 px-4 font-semibold ${textTitle}`}>{d.donor?.name || d.donorNgo?.name || 'Anonymous'}</td>
                                      <td className={`py-3.5 px-4 font-semibold ${textTitle}`}>{d.recipientNgo?.name || 'Helping Hands'}</td>
                                      <td className="py-3.5 px-4 font-mono font-bold text-[#43E97B]">₹{Number(d.amount).toLocaleString()}</td>
                                      <td className={`py-3.5 px-4 font-mono text-[10px] ${textMuted}`}>{d.transactionId || 'N/A'}</td>
                                      <td className="py-3.5 px-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${d.status === 'DELIVERED' ? 'bg-[#43E97B]/10 text-[#43E97B]' :
                                          d.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-400'
                                          }`}>
                                          {d.status}
                                        </span>
                                      </td>
                                      <td className={`py-3.5 px-4 font-mono text-[10px] ${textMuted}`}>
                                        {d.transactionDate ? new Date(d.transactionDate).toLocaleDateString() : new Date(d.createdAt).toLocaleDateString()}
                                      </td>
                                      <td className="py-3.5 px-4 text-right">
                                        <button onClick={() => handleDeleteOperation('donation', d.id)} className="p-1.5 text-red-400 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 rounded-lg" title="Discard/Delete transaction">
                                          <Trash2 size={12} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

          </div>

        </div>
      </section>
    </div>
  )
}
