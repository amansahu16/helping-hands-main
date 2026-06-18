import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, X, ChevronDown, LogOut, Sun, Moon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import AuthModal from './AuthModal'
import Logo from './Logo'

const navLinks = [
  { label: 'Home', path: '/' },
  {
    label: 'Donate Items', path: '/donate',
    children: [
      { label: 'Donation Form', path: '/donate/form' },
      { label: 'Browse Listings', path: '/donate/listings' },
    ]
  },
  {
    label: 'Animal Welfare', path: '/animals',
    children: [
      { label: 'Feed Street Animals', path: '/animals/feed' },
      { label: 'Rescue & Shelter', path: '/animals/rescue' },
      { label: 'Adopt a Pet', path: '/animals/adopt' },
    ]
  },
  {
    label: 'NGOs', path: '/ngos',
    children: [
      { label: 'NGO Registration', path: '/ngos/register' },
      { label: 'NGO Listings', path: '/ngos/listings' },
      { label: 'Donate to NGO', path: '/ngos/donate' },
    ]
  },
  {
    label: 'Volunteer', path: '/volunteer',
    children: [
      { label: 'Join Campaign', path: '/volunteer/join' },
      { label: 'Start a Campaign', path: '/volunteer/start' },
    ]
  },
]

export default function Navbar() {
  const { user, role, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDrop, setOpenDrop] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const closeTimer = useRef(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setOpenDrop(null)
  }, [location.pathname])

  const isDark = theme === 'dark'

  const openLogin = () => { setAuthTab('login'); setAuthOpen(true) }
  const openReg = () => { setAuthTab('register'); setAuthOpen(true) }
  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // Navbar background
  const navBg = scrolled
    ? isDark
      ? 'bg-[#0F0F2A]/20 backdrop-blur-md border-b border-white/5 shadow-[0_4px_32px_rgba(0,0,0,0.2)]'
      : 'bg-white/20 backdrop-blur-md border-b border-black/5 shadow-[0_4px_24px_rgba(99,102,241,0.03)]'
    : 'bg-transparent border-b border-transparent shadow-none'

  const textColor = isDark ? 'text-[#BAC9BF]' : 'text-[#2E4237]'
  const textHover = isDark ? 'hover:text-white' : 'hover:text-[#13221B]'
  const dropBg = isDark ? 'bg-[#16201B] border border-[#13221B]/20' : 'bg-white border border-[#13221B]/20'
  const mobileBg = isDark ? 'bg-[#0A0F0C]/98' : 'bg-white'

  const handleDropEnter = (path) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenDrop(path)
  }
  const handleDropLeave = () => {
    closeTimer.current = setTimeout(() => setOpenDrop(null), 120)
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo />
          </Link>


          {/* Desktop Nav */}
          <ul className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <li
                key={link.path}
                className="relative"
                onMouseEnter={() => link.children && handleDropEnter(link.path)}
                onMouseLeave={() => link.children && handleDropLeave()}
              >
                {link.children ? (
                  <>
                    {/* Clickable parent label + dropdown arrow */}
                    <div className={`flex items-center rounded-lg border transition-all duration-200 ${location.pathname.startsWith(link.path) || openDrop === link.path
                      ? isDark
                        ? 'bg-[#13221B]/10 border-[#13221B]/20'
                        : 'bg-[#EEF2FF] border-[#13221B]/20'
                      : `border-transparent hover:bg-[#13221B]/5 hover:border-[#13221B]/10`
                      }`}>
                      <Link
                        to={link.path}
                        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors duration-200 ${location.pathname.startsWith(link.path) || openDrop === link.path
                          ? isDark ? 'text-[#2E7D59]' : 'text-[#13221B]'
                          : `${textColor} ${textHover}`
                          }`}
                      >
                        {link.label}
                      </Link>
                      <button
                        className={`px-1.5 py-2 text-sm transition-colors duration-200 ${location.pathname.startsWith(link.path) || openDrop === link.path
                          ? isDark ? 'text-[#2E7D59]' : 'text-[#13221B]'
                          : `${textColor} ${textHover}`
                          }`}
                        onClick={() => setOpenDrop(openDrop === link.path ? null : link.path)}
                      >
                        <ChevronDown
                          size={13}
                          className={`transition-transform duration-200 ${openDrop === link.path ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                    {/* Dropdown with smooth CSS transitions */}
                    <div
                      className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50 transition-all duration-200 transform origin-top ${openDrop === link.path
                        ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                        : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
                        }`}
                      onMouseEnter={() => handleDropEnter(link.path)}
                      onMouseLeave={() => handleDropLeave()}
                    >
                      <div className={`${dropBg} rounded-xl py-2 min-w-[210px] shadow-[0_12px_40px_rgba(99,102,241,0.15)]`}>
                        {link.children
                          .filter(c => {
                            if (c.label.includes('Dashboard')) {
                              return !!user;
                            }
                            return true;
                          })
                          .map(c => {
                            const path = c.label.includes('Dashboard') && role === 'ngo' ? '/ngos/dashboard' : c.path;
                            return (
                              <Link
                                key={path} to={path}
                                className={`flex items-center px-4 py-2.5 text-sm transition-colors ${isDark
                                  ? 'text-[#BBBBD8] hover:text-white hover:bg-[#13221B]/10'
                                  : 'text-[#4338CA] hover:text-[#13221B] hover:bg-[#EEF2FF]'
                                  }`}
                              >
                                {c.label}
                              </Link>
                            );
                          })}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    to={link.path}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${location.pathname === link.path
                      ? isDark
                        ? 'text-[#2E7D59] bg-[#13221B]/10 border-[#13221B]/20'
                        : 'text-[#13221B] bg-[#EEF2FF] border-[#13221B]/20'
                      : `border-transparent ${textColor} ${textHover} hover:bg-[#13221B]/5 hover:border-[#13221B]/10`
                      }`}
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all ${isDark
                ? 'text-[#BBBBD8] hover:text-white hover:bg-white/5'
                : 'text-[#6366F1] hover:text-[#13221B] hover:bg-[#EEF2FF]'
                }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to={role === 'admin' ? '/admin/dashboard' : role === 'ngo' ? '/ngos/dashboard' : '/volunteer/dashboard'}
                  className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full hover:scale-[1.02] transition-all ${isDark
                    ? 'bg-[#13221B]/10 border border-[#13221B]/20 hover:bg-[#13221B]/20'
                    : 'bg-[#EEF2FF] border border-[#13221B]/20 hover:bg-[#E0E7FF]'
                    }`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(user.name || user.email || 'NGO').charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-sm max-w-[150px] truncate font-medium ${isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'}`}>
                    {role === 'admin' ? `Admin: ${user.name || user.email}` : (user.name || user.email || 'NGO')}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${isDark ? 'text-[#BBBBD8] hover:text-[#3D6A53]' : 'text-[#6366F1] hover:text-[#3D6A53]'}`}
                >
                  <LogOut size={15} />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={openLogin}
                  className={`hidden sm:block px-4 py-2 text-sm font-medium transition-colors ${isDark
                    ? 'text-[#EEF5F1] hover:text-white'
                    : 'text-[#2E4237] hover:text-[#13221B]'
                    }`}
                >
                  Login
                </button>

              </>
            )}

            {/* Mobile hamburger */}
            <button
              className={`lg:hidden p-2 rounded-lg transition-colors ${isDark
                ? 'text-[#BBBBD8] hover:text-white hover:bg-white/5'
                : 'text-[#4338CA] hover:text-[#13221B] hover:bg-[#EEF2FF]'
                }`}
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className={`lg:hidden border-t ${isDark ? 'border-[#13221B]/20' : 'border-[#EEF2FF]'} max-h-[80vh] overflow-y-auto ${mobileBg}`}>
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <div key={link.path}>
                  {link.children ? (
                    <>
                      <div className="flex items-center">
                        <Link
                          to={link.path}
                          className={`flex-1 px-3 py-3 rounded-lg text-sm font-semibold ${isDark ? 'text-[#BBBBD8] hover:bg-[#13221B]/10 hover:text-white' : 'text-[#4338CA] hover:bg-[#EEF2FF]'}`}
                        >
                          {link.label}
                        </Link>
                        <button
                          onClick={() => setOpenDrop(openDrop === link.path ? null : link.path)}
                          className={`px-3 py-3 rounded-lg text-sm ${isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'}`}
                        >
                          <ChevronDown size={14} className={`transition-transform ${openDrop === link.path ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      {openDrop === link.path && (
                        <div className={`ml-3 border-l-2 ${isDark ? 'border-[#13221B]/30' : 'border-[#C7D2FE]'} pl-3 flex flex-col gap-0.5 mt-1`}>
                          {link.children
                            .filter(c => {
                              if (c.label.includes('Dashboard')) {
                                return !!user;
                              }
                              return true;
                            })
                            .map(c => {
                              const path = c.label.includes('Dashboard') && role === 'ngo' ? '/ngos/dashboard' : c.path;
                              return (
                                <Link
                                  key={path} to={path}
                                  className={`py-2 px-2 text-sm transition-colors ${isDark ? 'text-[#7777AA] hover:text-white' : 'text-[#6366F1] hover:text-[#13221B]'}`}
                                >
                                  {c.label}
                                </Link>
                              );
                            })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={link.path}
                      className={`block px-3 py-3 rounded-lg text-sm font-medium ${isDark ? 'text-[#BBBBD8] hover:bg-[#13221B]/10 hover:text-white' : 'text-[#4338CA] hover:bg-[#EEF2FF]'}`}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}

              <div className={`mt-3 pt-3 border-t ${isDark ? 'border-[#13221B]/20' : 'border-[#EEF2FF]'} flex flex-col gap-2`}>
                {/* Theme toggle */}
                <div className="flex items-center justify-between px-3">
                  <button onClick={toggleTheme} className={`flex items-center gap-2 text-sm ${isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'}`}>
                    {isDark ? <><Sun size={14} /> Light Mode</> : <><Moon size={14} /> Dark Mode</>}
                  </button>
                </div>

                {!user && (
                  <>
                    <button
                      onClick={openLogin}
                      className={`w-full py-2.5 text-center text-sm font-semibold border rounded-xl hover:bg-[#13221B]/5 transition-colors ${isDark ? 'border-[#13221B]/30 text-[#BBBBD8]' : 'border-[#13221B]/25 text-[#4338CA]'}`}
                    >
                      Login
                    </button>
                    <button onClick={openReg} className="w-full py-2.5 text-center text-sm font-semibold rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white">
                      Register
                    </button>
                  </>
                )}
                {user && (
                  <div className="flex flex-col gap-2 w-full mt-2">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#13221B] to-[#3D6A53] flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {(user.name || user.email || 'NGO').charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-[#1E1B4B]'}`}>
                        {user.name || user.email}
                      </span>
                    </div>
                    <Link
                      to={role === 'admin' ? '/admin/dashboard' : role === 'ngo' ? '/ngos/dashboard' : '/volunteer/dashboard'}
                      className="w-full py-2.5 text-center text-sm font-semibold rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white hover:opacity-90 transition-all block"
                    >
                      Go to Dashboard
                    </Link>
                    <button onClick={handleLogout} className="w-full py-2.5 text-center text-sm text-[#FF8FA3] border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialTab={authTab} />
    </>
  )
}
