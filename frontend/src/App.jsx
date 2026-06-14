import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

/* ── Scroll to top on route change ──────────────────────── */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

// Pages
import Home from './pages/Home'
import About from './pages/About'

import Contact from './pages/Contact'
import FAQ from './pages/FAQ'

// Donate
import DonateItems from './pages/Donate/DonateItems'
import DonationForm from './pages/Donate/DonationForm'
import ItemListings from './pages/Donate/ItemListings'

// Animals
import AnimalWelfare from './pages/Animals/AnimalWelfare'
import FeedAnimals from './pages/Animals/FeedAnimals'
import RescueShelter from './pages/Animals/RescueShelter'
import AdoptPet from './pages/Animals/AdoptPet'

// NGOs
import NGOs from './pages/NGOs/NGOs'
import NGORegistration from './pages/NGOs/NGORegistration'
import NGOListings from './pages/NGOs/NGOListings'
import DonateToNGO from './pages/NGOs/DonateToNGO'
import NGODashboard from './pages/NGOs/NGODashboard'
import NGODetails from './pages/NGOs/NGODetails'

// Volunteer
import Volunteer from './pages/Volunteer/Volunteer'
import JoinCampaign from './pages/Volunteer/JoinCampaign'
import StartCampaign from './pages/Volunteer/StartCampaign'
import VolunteerDashboard from './pages/Volunteer/VolunteerDashboard'

// Admin
import AdminDashboard from './pages/Admin/AdminDashboard'

/* ── 404 ─────────────────────────────────────────────────────── */
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center page-hero-bg">
      <div className="px-4">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="font-['Poppins'] font-black text-6xl text-white mb-3">404</h1>
        <p className="text-[#8888AA] text-lg mb-6">This page doesn't exist yet.</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white font-bold text-sm hover:-translate-y-1 transition-all"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  )
}

/* ── Shared layout ───────────────────────────────────────────── */
function Layout({ children }) {
  return (
    <>
      <ScrollToTop />
      {/* Navbar manages its own AuthModal internally */}
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}

/* ══════════════════════════════════════════════════════════════
   APP + ROUTER
══════════════════════════════════════════════════════════════ */
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Layout>
            <Routes>
              {/* Core pages */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />

              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />

              {/* Donate */}
              <Route path="/donate" element={<DonateItems />} />
              <Route path="/donate/form" element={<DonationForm />} />
              <Route path="/donate/listings" element={<ItemListings />} />

              {/* Animal Welfare */}
              <Route path="/animals" element={<AnimalWelfare />} />
              <Route path="/animals/feed" element={<FeedAnimals />} />
              <Route path="/animals/rescue" element={<RescueShelter />} />
              <Route path="/animals/adopt" element={<AdoptPet />} />

              {/* NGOs */}
              <Route path="/ngos" element={<NGOs />} />
              <Route path="/ngos/register" element={<NGORegistration />} />
              <Route path="/ngos/listings" element={<NGOListings />} />
              <Route path="/ngos/donate" element={<DonateToNGO />} />
              <Route path="/ngos/dashboard" element={<NGODashboard />} />
              <Route path="/ngos/:id" element={<NGODetails />} />

              {/* Volunteer */}
              <Route path="/volunteer" element={<Volunteer />} />
              <Route path="/volunteer/join" element={<JoinCampaign />} />
              <Route path="/volunteer/start" element={<StartCampaign />} />
              <Route path="/volunteer/listings" element={<VolunteerDashboard />} />
              <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />

              {/* Admin */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
