import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Calendar, MapPin, Users, CheckCircle, Clock,
  XCircle, User, Shield, Briefcase, FileText, Check, X, Loader2, Sparkles
} from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import useScrollReveal from '../../hooks/useScrollReveal'
import bgImg from '../images/Volunteer.jpg'


// Calculate Age from Date of Birth
function calculateAge(dobString) {
  if (!dobString) return 'N/A'
  const dob = new Date(dobString)
  if (isNaN(dob.getTime())) return 'N/A'
  const diffMs = Date.now() - dob.getTime()
  const ageDate = new Date(diffMs)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

export default function JoinCampaign() {
  useScrollReveal()
  const { user, role } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()

  // State
  const [activeTab, setActiveTab] = useState('browse') // 'browse' | 'dashboard'
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'cleanup', 'animal_welfare', 'health', 'food_drive'
  
  // Dashboard state
  const [myOrganized, setMyOrganized] = useState([])
  const [myJoined, setMyJoined] = useState([])
  const [dashLoading, setDashLoading] = useState(false)
  const [selectedCampaignForManage, setSelectedCampaignForManage] = useState(null)
  const [participants, setParticipants] = useState([])
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [codes, setCodes] = useState({}) // { [participantId]: code }
  const [actionLoading, setActionLoading] = useState({}) // { [participantId]: true/false }

  // Joined campaign statuses maps for one-click join states on Browse tab
  const [joinedStatuses, setJoinedStatuses] = useState({}) // { [campaignId]: { status, code } }

  // Categories definition
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'cleanup', label: 'Cleanup' },
    { id: 'animal_welfare', label: 'Animal Welfare' },
    { id: 'health', label: 'Health' },
    { id: 'food_drive', label: 'Food Drive' }
  ]

  // Load campaigns (Planned/Ongoing)
  const loadCampaigns = useCallback(() => {
    setLoading(true)
    api.get('/campaigns?limit=200')
      .then(({ data }) => {
        const raw = Array.isArray(data) ? data : (data.data || data.campaigns || [])
        // Keep running (ONGOING) or going to start (PLANNED) campaigns
        const active = raw.filter(c => c.status === 'ONGOING' || c.status === 'PLANNED')
        setCampaigns(active)
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false))
  }, [])

  // Load user dashboard stats (organized & joined campaigns)
  const loadDashboard = useCallback(() => {
    if (!user) return
    setDashLoading(true)

    if (role === 'user') {
      api.get('/users/campaigns')
        .then(({ data }) => {
          setMyOrganized(data.organized || [])
          setMyJoined(data.joined || [])

          // Map joined statuses for browse page
          const statuses = {}
          data.joined.forEach(item => {
            statuses[item.campaignId] = { status: item.status, code: item.code }
          })
          setJoinedStatuses(statuses)
        })
        .catch(() => {})
        .finally(() => setDashLoading(false))
    } else if (role === 'ngo') {
      // NGO organizes campaigns, but cannot join them
      api.get(`/campaigns?organizerNgoId=${user.id}`)
        .then(({ data }) => {
          const list = Array.isArray(data) ? data : (data.data || data.campaigns || [])
          setMyOrganized(list)
          setMyJoined([])
        })
        .catch(() => {})
        .finally(() => setDashLoading(false))
    }
  }, [user, role])

  useEffect(() => {
    loadCampaigns()
    if (user) {
      loadDashboard()
    }
  }, [user, loadCampaigns, loadDashboard])

  // One-click join handler
  const handleJoin = async (campaignId) => {
    if (!user) {
      alert('Please login/register to join a campaign!')
      return
    }
    try {
      await api.post(`/campaigns/${campaignId}/join`)
      
      // Optimistically update status to PENDING
      setJoinedStatuses(prev => ({
        ...prev,
        [campaignId]: { status: 'PENDING', code: null }
      }))
      
      // Reload dashboard list to reflect the new campaign joined
      loadDashboard()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join campaign.')
    }
  }

  // Fetch participants when managing a campaign
  const handleManageCampaign = async (campaign) => {
    setSelectedCampaignForManage(campaign)
    setParticipantsLoading(true)
    try {
      const { data } = await api.get(`/campaigns/${campaign.id}/participants`)
      setParticipants(data || [])
      
      // Initialize volunteer codes inputs
      const initialCodes = {}
      data.forEach(p => {
        // Pre-fill with a default code format, e.g., VOL-ORGANIZER_ID-INDEX
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

  // Approve volunteer handler with code
  const handleApprove = async (participantId, index) => {
    const codeVal = codes[participantId] || ''
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
      
      // Update local participants state
      setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, status: 'APPROVED', code: codeVal } : p))
      loadDashboard() // refresh campaign counts
    } catch (err) {
      alert('Failed to approve volunteer.')
    } finally {
      setActionLoading(prev => ({ ...prev, [participantId]: false }))
    }
  }

  // Reject volunteer handler
  const handleReject = async (participantId) => {
    if (!window.confirm('Are you sure you want to reject this volunteer?')) return
    setActionLoading(prev => ({ ...prev, [participantId]: true }))
    try {
      await api.patch(`/campaigns/${selectedCampaignForManage.id}/participants/${participantId}/status`, {
        status: 'REJECTED'
      })
      
      // Update local participants state
      setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, status: 'REJECTED' } : p))
      loadDashboard()
    } catch (err) {
      alert('Failed to reject volunteer.')
    } finally {
      setActionLoading(prev => ({ ...prev, [participantId]: false }))
    }
  }

  // Campaign type mapping for filters
  const filteredCampaigns = campaigns.filter(c => {
    if (filter === 'all') return true
    if (filter === 'cleanup') return c.type === 'CLEANUP'
    if (filter === 'animal_welfare') return c.type === 'ANIMAL_WELFARE'
    if (filter === 'health') return c.type === 'HEALTH' || c.type === 'BLOOD_DONATION'
    if (filter === 'food_drive') return c.type === 'FOOD_DRIVE'
    return true
  })

  // Theme-aware styles
  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const sectionBg = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'
  const cardBg = isDark ? 'bg-[#16163A] border-white/8' : 'bg-white border-[#E0E7FF] shadow-sm'
  const textTitle = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const textMuted = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const filterBtn = (active) => active
    ? 'bg-[#13221B] border-[#13221B] text-white shadow-md shadow-[#13221B]/35'
    : isDark ? 'border-white/10 text-[#8888AA] hover:border-[#13221B]/30 hover:text-white' : 'border-[#C7D2FE] text-[#6366F1] hover:border-[#13221B] hover:text-[#13221B]'
  const tabBtn = (active) => active
    ? 'bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white border-[#13221B] shadow-md shadow-[#13221B]/20'
    : isDark ? 'bg-white/5 border-white/8 text-[#7777AA] hover:text-white' : 'bg-white border-[#C7D2FE] text-[#6366F1] hover:text-[#13221B] shadow-sm'

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
          <div className="section-label mb-4">Volunteer Ecosystem</div>
          <h1 className={`font-['Poppins'] font-black text-5xl mb-4 ${heroText}`}>
            Empower the <span className="gradient-text">Community</span>
          </h1>
          <p className={`text-lg ${subText}`}>Join ongoing cleanup drives, animal welfare initiatives, and food collection drives near you.</p>
        </div>
      </section>

      {/* Main Section */}
      <section className={`py-12 min-h-[60vh] ${sectionBg}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2 items-center mb-8 reveal">
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${filterBtn(filter === c.id)}`}
              >
                {c.label}
              </button>
            ))}

            <Link
              to="/volunteer/start"
              className="ml-auto px-5 py-2.5 rounded-full bg-gradient-to-r from-[#43E97B] to-[#13221B] text-white text-xs font-bold hover:-translate-y-0.5 transition-all shadow-sm"
            >
              + Start a Campaign
            </Link>
          </div>

          {/* Grid listings grouped by Type */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={36} className="text-[#13221B] animate-spin" />
              <p className={textMuted}>Loading active campaigns…</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-20 reveal">
              <div className="text-6xl mb-4">🙌</div>
              <h3 className={`font-bold text-xl mb-2 ${heroText}`}>No active campaigns found</h3>
              <p className={`text-sm mb-5 ${textMuted}`}>Try checking another filter category or start your own campaign!</p>
              <Link to="/volunteer/start" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-sm font-bold hover:-translate-y-0.5 transition-all">
                Create Campaign <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {[
                { id: 'CLEANUP', label: '🧹 Clean-up Drives' },
                { id: 'ANIMAL_WELFARE', label: '🐾 Animal Welfare Drives' },
                { id: 'HEALTH', label: '❤️ Health & Blood Donation Drives' },
                { id: 'FOOD_DRIVE', label: '🍏 Food Collection Drives' },
                { id: 'OTHER', label: '✨ Other Volunteer Drives' }
              ]
                .filter(group => {
                  if (filter === 'all') return true;
                  if (filter === 'cleanup') return group.id === 'CLEANUP';
                  if (filter === 'animal_welfare') return group.id === 'ANIMAL_WELFARE';
                  if (filter === 'health') return group.id === 'HEALTH';
                  if (filter === 'food_drive') return group.id === 'FOOD_DRIVE';
                  return true;
                })
                .map(group => {
                  const groupCampaigns = filteredCampaigns.filter(c => {
                    if (group.id === 'OTHER') {
                      return !['CLEANUP', 'ANIMAL_WELFARE', 'HEALTH', 'FOOD_DRIVE'].includes(c.type);
                    }
                    if (group.id === 'HEALTH') {
                      return c.type === 'HEALTH' || c.type === 'BLOOD_DONATION';
                    }
                    return c.type === group.id;
                  });

                  if (groupCampaigns.length === 0) return null;

                  return (
                    <div key={group.id} className="reveal mb-6">
                      <h3 className={`font-['Poppins'] font-bold text-xl mb-6 flex items-center gap-2 pb-2 border-b ${
                        isDark ? 'text-white border-white/5' : 'text-[#1E1B4B] border-[#E0E7FF]'
                      }`}>
                        <span>{group.label}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#13221B]/10 text-[#2E7D59]">
                          {groupCampaigns.length} active
                        </span>
                      </h3>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupCampaigns.map((c, i) => {
                          const spots = c.maxParticipants
                          const filled = c.currentParticipants
                          const pct = spots ? Math.min(100, Math.round((filled / spots) * 100)) : 0

                          const userJoinInfo = joinedStatuses[c.id]
                          const statusText = userJoinInfo ? userJoinInfo.status : null
                          const approvalCode = userJoinInfo ? userJoinInfo.code : null

                          return (
                            <div key={c.id || i} className={`border rounded-2xl p-6 flex flex-col hover:-translate-y-1 transition-all duration-300 ${cardBg}`}>
                              <div className="flex items-start justify-between mb-3">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#13221B]/10 border border-[#13221B]/20 text-[#2E7D59] uppercase">
                                  {c.type?.replace('_', ' ')}
                                </span>
                                <span className="text-xs font-bold text-[#FFB347] bg-[#FFB347]/10 px-2 py-0.5 rounded-full border border-[#FFB347]/20 uppercase">
                                  {c.status}
                                </span>
                              </div>

                              <h3 className={`font-['Poppins'] font-bold text-base mb-2 line-clamp-1 ${textTitle}`}>{c.name}</h3>
                              <p className={`text-xs mb-2 ${textMuted}`}>Organized by: <span className="font-semibold">{c.organizerUser?.name || c.organizerNgo?.name || 'Anonymous'}</span></p>
                              <p className={`text-xs leading-relaxed mb-4 flex-1 line-clamp-3 ${textMuted}`}>{c.description}</p>

                              <div className={`flex flex-col gap-1.5 text-xs mb-4 ${textMuted}`}>
                                <span className="flex items-center gap-2">
                                  <Calendar size={11} className="text-[#13221B]" />
                                  {c.timeFrom ? new Date(c.timeFrom).toLocaleDateString() : 'Date TBD'}
                                </span>
                                <span className="flex items-center gap-2">
                                  <MapPin size={11} className="text-[#13221B]" />
                                  {c.location || 'Location TBD'}
                                </span>
                                <span className="flex items-center gap-2">
                                  <Users size={11} className="text-[#13221B]" />
                                  {filled} / {spots || '∞'} volunteers joined
                                </span>
                              </div>

                              {spots > 0 && (
                                <div className="mb-5">
                                  <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-white/5' : 'bg-[#EEF2FF]'}`}>
                                    <div className="h-full bg-gradient-to-r from-[#13221B] to-[#43E97B] rounded-full progress-fill" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              )}

                              {/* Join Campaign Logic */}
                              {!statusText ? (
                                <button
                                  onClick={() => handleJoin(c.id)}
                                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-xs font-bold hover:shadow-lg transition-all"
                                >
                                  🤝 Join Campaign
                                </button>
                              ) : statusText === 'PENDING' ? (
                                <div className="w-full py-2.5 rounded-xl border border-[#FFB347]/30 bg-[#FFB347]/10 text-[#FFB347] text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                                  <Clock size={13} className="animate-pulse" /> Pending Approval 🕒
                                </div>
                              ) : statusText === 'APPROVED' ? (
                                <div className="w-full p-3 rounded-xl border border-[#43E97B]/30 bg-[#43E97B]/10 text-center">
                                  <p className="text-[#43E97B] text-xs font-bold flex items-center justify-center gap-1.5 mb-1">
                                    <CheckCircle size={13} /> Approved Volunteer 🎉
                                  </p>
                                  {approvalCode && (
                                    <p className="text-xs font-mono font-bold" style={{ color: isDark ? '#FFF' : '#13221B' }}>
                                      Code: <span className="bg-[#13221B] text-[#43E97B] px-2 py-0.5 rounded font-mono font-bold text-sm tracking-wider">{approvalCode}</span>
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="w-full py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                                  <XCircle size={13} /> Request Declined ❌
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
