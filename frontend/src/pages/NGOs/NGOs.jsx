import { Link } from 'react-router-dom'
import useScrollReveal from '../../hooks/useScrollReveal'
import { useState, useEffect } from 'react'
import { ArrowRight, Search, MapPin, CheckCircle } from 'lucide-react'
import api from '../../api/axios'
import { useTheme } from '../../context/ThemeContext'
import bgImg from '../images/NGO_bg.jpg'
import imgRegister from '../images/ngo_register.png'
import imgDonate from '../images/ngo_donate.png'
import imgBrowse from '../images/ngo_browse.png'
import FeatureCard from '../../components/FeatureCard'



export default function NGOs() {
  useScrollReveal()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [ngos, setNgos] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/ngos').then(({ data }) => {
      setNgos(Array.isArray(data) ? data : (data.data || data.ngos || sampleNgos))
    }).catch(() => setNgos(sampleNgos)).finally(() => setLoading(false))
  }, [])

  const sampleNgos = [
    { id: '1', name: 'Animal Aid Society', location: 'Mumbai', area: 'Animal Rescue', verified: true, description: 'Rescue and rehabilitation of injured animals.', donors: 120, volunteers: 45 },
    { id: '2', name: 'Child Hope Foundation', location: 'Delhi', area: 'Education', verified: true, description: 'Free education for underprivileged children.', donors: 200, volunteers: 80 },
    { id: '3', name: 'Elder Care Trust', location: 'Pune', area: 'Elderly Care', verified: true, description: 'Support and daily care for senior citizens.', donors: 75, volunteers: 30 },
    { id: '4', name: 'Green Earth NGO', location: 'Bangalore', area: 'Environment', verified: false, description: 'Tree plantation and waste management drives.', donors: 90, volunteers: 55 },
  ]

  const features = [
    { img: imgRegister, title: 'Register Your NGO', desc: 'Join as a verified NGO to accept donations and post campaigns.', link: '/ngos/register' },
    { img: imgDonate, title: 'Donate to NGOs', desc: 'Support verified NGOs with monetary or goods donations.', link: '/ngos/donate' },
    { img: imgBrowse, title: 'Browse Verified NGOs', desc: 'Discover trusted organizations working for your community.', link: '/ngos/listings' },
  ]



  const filtered = ngos.filter(n => !search || n.name?.toLowerCase().includes(search.toLowerCase()) || n.location?.toLowerCase().includes(search.toLowerCase()))

  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const textMuted = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  const sectionBgA = isDark ? 'bg-[#0F0F2A]' : 'bg-white'
  const sectionBgB = isDark ? 'bg-[#07071A]' : 'bg-[#F0F4FF]'
  const cardBg = isDark ? 'bg-[#16163A] border-white/8 hover:border-[#13221B]/30' : 'bg-white border-[#E0E7FF] hover:border-[#13221B]/45 shadow-sm hover:shadow-md'
  const searchInput = isDark
    ? 'bg-white/[0.05] border-white/10 text-white placeholder-[#555577] text-sm focus:outline-none focus:border-[#13221B] transition-all'
    : 'bg-[#EEF2FF] border-[#C7D2FE] text-[#1E1B4B] placeholder-[#A5B4FC] text-sm focus:outline-none focus:border-[#13221B] transition-all'

  return (
    <div className="page-enter">
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
          <div className="section-label mb-4">NGO Network</div>
          <h1 className={`font-['Poppins'] font-black text-5xl mb-4 ${heroText}`}>
            Trusted <span className="gradient-text">NGOs</span>
          </h1>
          <p className={`text-lg ${subText}`}>Connect with verified non-profit organizations making real impact in communities and animal welfare.</p>
        </div>
      </section>

      {/* Features */}
      <section className={`py-16 ${sectionBgA}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-6 reveal">
            {features.map((f, i) => (
              <FeatureCard
                key={i}
                title={f.title}
                desc={f.desc}
                link={f.link}
                image={f.img}
                revealDelay={`${i * 0.1}s`}
              />
            ))}
          </div>
        </div>
      </section>


    </div>
  )
}
