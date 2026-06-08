import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, Phone, Mail, Award, CheckCircle, ExternalLink,
  Loader2, Star, MessageSquare, Heart, Shield, Calendar, Users,
  ArrowRight, Globe
} from 'lucide-react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import useScrollReveal from '../../hooks/useScrollReveal'
import bgImg from '../images/NGO_bg.jpg'


export default function NGODetails() {
  const { id } = useParams()
  useScrollReveal()
  const { user, role } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const navigate = useNavigate()

  // NGO profile state
  const [ngo, setNgo] = useState(null)
  const [posts, setPosts] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [reviews, setReviews] = useState([])

  // Loading states
  const [loading, setLoading] = useState(true)
  const [reviewLoading, setReviewLoading] = useState(false)

  // Review form state
  const [newReview, setNewReview] = useState({ rating: 5, content: '' })
  const [reviewSuccess, setReviewSuccess] = useState(false)

  const loadNgoDetails = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch NGO profile
      const { data: ngoData } = await api.get(`/ngos/${id}`)
      setNgo(ngoData)

      // Fetch NGO posts
      const { data: postsData } = await api.get(`/ngos/${id}/posts`)
      setPosts(postsData || [])

      // Fetch NGO campaigns
      const { data: campaignsData } = await api.get(`/campaigns?organizerNgoId=${id}`)
      setCampaigns(campaignsData || [])

      // Fetch NGO reviews
      const { data: reviewsData } = await api.get(`/ngos/${id}/reviews`)
      setReviews(reviewsData || [])

    } catch (err) {
      console.error('Error fetching NGO details:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadNgoDetails()
  }, [id, loadNgoDetails])

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      alert('Please log in to leave a review.')
      return
    }
    if (role !== 'user') {
      alert('Only regular users can rate NGOs.')
      return
    }
    setReviewLoading(true)
    setReviewSuccess(false)
    try {
      const { data } = await api.post(`/ngos/${id}/reviews`, newReview)
      setReviews(prev => [data, ...prev])
      setReviewSuccess(true)
      setNewReview({ rating: 5, content: '' })
      setTimeout(() => setReviewSuccess(false), 3000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setReviewLoading(false)
    }
  }

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 page-hero-bg">
        <Loader2 size={40} className="text-white animate-spin" />
        <p className="text-white text-sm font-semibold">Loading NGO Profile…</p>
      </div>
    )
  }

  if (!ngo) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center page-hero-bg">
        <div>
          <h2 className="text-4xl text-white font-bold mb-4">NGO Not Found</h2>
          <Link to="/ngos/listings" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white">Back to NGO Directory</Link>
        </div>
      </div>
    )
  }

  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const textMuted = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const sectionBg = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'
  const cardBg = isDark ? 'bg-[#16163A] border-white/8' : 'bg-white border-[#E0E7FF] shadow-sm'
  const inputClass = isDark
    ? "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-[#555577] text-sm focus:outline-none focus:border-[#3D6A53] transition-all"
    : "w-full px-4 py-3 rounded-xl bg-[#F9FAFF] border border-[#13221B]/20 text-[#1E1B4B] placeholder-[#8888AA] text-sm focus:outline-none focus:border-[#3D6A53] transition-all"

  return (
    <div className="page-enter">
      {/* Header Banner */}
      <section
        className="page-hero-bg pt-32 pb-16 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(var(--hero-overlay-start), var(--hero-overlay-end)), url(${bgImg})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 relative z-10 flex flex-col md:flex-row items-center gap-6">
          {ngo.photoUrl ? (
            <img src={ngo.photoUrl} alt={ngo.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-contain border-4 border-white/10 shadow-lg shrink-0" />
          ) : (
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center border-4 border-white/10 shadow-lg shrink-0">
              <span className="text-white font-black text-4xl sm:text-5xl">{ngo.name?.charAt(0) || 'N'}</span>
            </div>
          )}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className={`font-['Poppins'] font-black text-3xl sm:text-4xl ${heroText}`}>{ngo.name}</h1>
              {ngo.verified && (
                <span className="flex items-center gap-1 text-xs font-bold text-[#43E97B] bg-[#43E97B]/10 px-2.5 py-1 rounded-full border border-[#43E97B]/25">
                  <CheckCircle size={12} /> Verified
                </span>
              )}
            </div>
            <p className="text-[#2E7D59] font-bold text-sm sm:text-base mb-4">{ngo.areaOfWork || 'Registered NGO Partner'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs" style={{ color: isDark ? '#BBBBD8' : '#6366F1' }}>
              {ngo.location && <span className="flex items-center gap-1"><MapPin size={13} /> {ngo.location}</span>}
              {ngo.registrationNumber && <span className="flex items-center gap-1"><Award size={13} /> Reg: {ngo.registrationNumber}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Main Section */}
      <section className={`py-12 ${sectionBg}`}>
        <div className="max-w-[850px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-8">
            
            {/* Unified Info Card (About, Achievements, Donate, and Contact info) */}
            <div className={`border rounded-3xl p-8 flex flex-col gap-6 ${cardBg}`}>
              
              {/* About NGO */}
              <div>
                <h3 className={`font-['Poppins'] font-bold text-xl mb-3 ${heroText}`}>About Our NGO</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'}`}>{ngo.description || 'No description available yet.'}</p>
              </div>

              {/* Achievements & Work Done */}
              {(ngo.achievements || ngo.workDone) && (
                <div className="flex flex-col gap-4 border-t dark:border-white/5 pt-5">
                  <h4 className={`font-['Poppins'] font-bold text-sm flex items-center gap-2 ${heroText}`}>
                    <Award size={16} className="text-[#3D6A53]" />
                    <span>Achievements & Impact</span>
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {ngo.achievements && (
                      <div>
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-[#2E7D59] mb-1">Key Achievements</h5>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'}`}>{ngo.achievements}</p>
                      </div>
                    )}
                    {ngo.workDone && (
                      <div>
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-[#2E7D59] mb-1">Work Accomplished</h5>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'}`}>{ngo.workDone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lifted Donate Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                <div>
                  <h4 className="font-['Poppins'] font-bold text-base">Support Our Mission</h4>
                  <p className="text-xs text-white/80 max-w-md mt-1">Your contribution directly funds active campaigns, animal feeding drives, shelter maintenance, and emergency rescues.</p>
                </div>
                <button
                  onClick={() => navigate('/ngos/donate', { state: { ngoId: ngo.id } })}
                  className="px-6 py-3 rounded-full bg-white text-[#13221B] font-bold text-xs hover:bg-[#43E97B] hover:text-[#0A0F0C] transition-all flex items-center gap-1.5 shrink-0 shadow-md hover:scale-105 cursor-pointer"
                >
                  <Heart size={14} className="fill-[#13221B] text-[#13221B] animate-pulse" /> Donate to NGO
                </button>
              </div>

              {/* Contact Information rendered horizontally */}
              <div className="border-t dark:border-white/5 pt-6">
                <h4 className={`font-['Poppins'] font-bold text-sm mb-3 ${heroText}`}>📞 Contact Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  {ngo.phoneNumber && (
                    <a href={`tel:${ngo.phoneNumber}`} className={`flex items-center gap-2.5 p-3 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/5 text-[#BBBBD8] hover:text-white' : 'bg-gray-50 border-gray-100 text-[#4338CA] hover:text-[#13221B]'}`}>
                      <Phone size={14} className="text-[#3D6A53] shrink-0" /> 
                      <span className="truncate">{ngo.phoneNumber}</span>
                    </a>
                  )}
                  {ngo.email && (
                    <a href={`mailto:${ngo.email}`} className={`flex items-center gap-2.5 p-3 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/5 text-[#BBBBD8] hover:text-white' : 'bg-gray-50 border-gray-100 text-[#4338CA] hover:text-[#13221B]'}`}>
                      <Mail size={14} className="text-[#3D6A53] shrink-0" /> 
                      <span className="truncate">{ngo.email}</span>
                    </a>
                  )}
                  {ngo.location && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ngo.location + ' ' + ngo.name)}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2.5 p-3 rounded-xl border ${isDark ? 'bg-white/[0.02] border-white/5 text-[#BBBBD8] hover:text-white' : 'bg-gray-50 border-gray-100 text-[#4338CA] hover:text-[#13221B]'}`}>
                      <MapPin size={14} className="text-[#3D6A53] shrink-0" /> 
                      <span className="truncate">{ngo.location}</span>
                      <ExternalLink size={10} className="shrink-0 ml-auto" />
                    </a>
                  )}
                  {ngo.websiteUrl && (
                    <a href={ngo.websiteUrl.startsWith('http') ? ngo.websiteUrl : `https://${ngo.websiteUrl}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2.5 p-3 rounded-xl border sm:col-span-2 md:col-span-3 ${isDark ? 'bg-white/[0.02] border-white/5 text-[#BBBBD8] hover:text-white' : 'bg-gray-50 border-gray-100 text-[#4338CA] hover:text-[#13221B]'}`}>
                      <Globe size={14} className="text-[#3D6A53] shrink-0" /> 
                      <span className="truncate">{ngo.websiteUrl}</span>
                      <ExternalLink size={10} className="shrink-0 ml-auto" />
                    </a>
                  )}
                </div>
              </div>

            </div>

            {/* Drives & Campaigns section */}
            <div className={`border rounded-3xl p-8 ${cardBg}`}>
              <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${heroText}`}>
                <Calendar size={16} className="text-[#3D6A53]" />
                <span>Drives & Campaigns</span>
              </h3>

              {campaigns.length === 0 ? (
                <p className={`text-sm text-center py-6 ${textMuted}`}>No active campaigns by this NGO.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {campaigns.map(c => (
                    <div key={c.id} className={`p-4 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`font-semibold text-sm ${heroText}`}>{c.name}</h4>
                        <span className="text-[10px] font-bold bg-[#FFB347]/10 text-[#FFB347] border border-[#FFB347]/20 px-2 py-0.5 rounded-full uppercase shrink-0">{c.status}</span>
                      </div>
                      <p className={`text-xs ${textMuted}`}>{c.description?.slice(0, 120)}...</p>
                      <div className={`flex flex-wrap gap-3 text-xs mt-1 ${textMuted}`}>
                        <span className="flex items-center gap-1"><MapPin size={11} /> {c.location}</span>
                        <span className="flex items-center gap-1"><Users size={11} /> {c.currentParticipants} volunteers</span>
                      </div>
                      <Link to="/volunteer/join" className="text-xs font-bold text-[#2E7D59] hover:underline mt-2 self-start flex items-center gap-1">Join Campaign <ArrowRight size={10} /></Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* NGO Updates/Posts (horizontal/flex wrap or clean grid) */}
            {posts.length > 0 && (
              <div className={`border rounded-3xl p-8 ${cardBg}`}>
                <h3 className={`font-['Poppins'] font-bold text-lg mb-4 ${heroText}`}>NGO Community Posts</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  {posts.map(p => (
                    <div key={p.id} className={`p-4 rounded-xl border flex flex-col gap-2 ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#13221B]/10 text-[#2E7D59] text-[9px] font-bold uppercase">{p.postType}</span>
                        <span className={`text-[10px] ${textMuted}`}>{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className={`font-bold text-sm mb-1 ${heroText}`}>{p.title}</h4>
                      <p className={`text-xs leading-relaxed ${textMuted}`}>{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews and Ratings Section */}
            <div className={`border rounded-3xl p-8 ${cardBg}`}>
              <h3 className={`font-['Poppins'] font-bold text-lg mb-4 flex items-center gap-2 ${heroText}`}>
                <Star size={18} className="text-yellow-500" />
                <span>Reviews & Ratings</span>
              </h3>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Score Column */}
                <div className="md:col-span-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5 pb-6 md:pb-0 md:pr-6">
                  <div className="text-5xl font-extrabold text-[#FFB347] font-mono">{avgRating}</div>
                  <div className="flex text-[#FFB347] mt-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={16} className={star <= Math.round(Number(avgRating)) ? 'fill-[#FFB347] text-[#FFB347]' : 'text-gray-300'} />
                    ))}
                  </div>
                  <p className={`text-[10px] ${textMuted} mt-1`}>Based on {reviews.length} ratings</p>
                </div>

                {/* Reviews List & Form Column */}
                <div className="md:col-span-2 flex flex-col gap-6">
                  {/* Review Form */}
                  {user ? (
                    role === 'user' ? (
                      <form onSubmit={handleReviewSubmit} className="flex flex-col gap-3">
                        <p className={`text-xs font-bold ${heroText}`}>Rate this NGO</p>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setNewReview({ ...newReview, rating: star })}
                              className="focus:outline-none"
                            >
                              <Star size={16} className={star <= newReview.rating ? 'fill-[#FFB347] text-[#FFB347]' : 'text-gray-300'} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={newReview.content}
                          onChange={e => setNewReview({ ...newReview, content: e.target.value })}
                          placeholder="Write your feedback..."
                          rows={2}
                          required
                          className={`${inputClass} text-xs`}
                        />
                        {reviewSuccess && (
                          <p className="text-[#43E97B] text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle size={10} /> Review posted!
                          </p>
                        )}
                        <button type="submit" disabled={reviewLoading} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-[11px] font-bold self-start cursor-pointer">
                          {reviewLoading ? 'Submitting…' : 'Submit Review'}
                        </button>
                      </form>
                    ) : (
                      <p className="text-[10px] text-red-400 italic">Only logged in volunteers can review NGOs.</p>
                    )
                  ) : (
                    <p className={`text-xs ${textMuted}`}>Please log in to rate this NGO.</p>
                  )}

                  {/* Reviews List */}
                  <div className="flex flex-col gap-3">
                    <p className={`text-xs font-bold ${heroText}`}>Latest Reviews ({reviews.length})</p>
                    {reviews.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic">No reviews yet. Be the first to leave one!</p>
                    ) : (
                      <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1">
                        {reviews.map(r => (
                          <div key={r.id} className={`p-3 rounded-xl border text-[11px] ${isDark ? 'bg-white/[0.01] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className={`font-bold ${heroText}`}>{r.user?.name || 'Volunteer'}</span>
                              <div className="flex text-[#FFB347]">
                                {Array.from({ length: r.rating }).map((_, st) => (
                                  <Star key={st} size={8} className="fill-[#FFB347] text-[#FFB347]" />
                                ))}
                              </div>
                            </div>
                            <p className={textMuted}>{r.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
