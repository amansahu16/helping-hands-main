import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useState } from 'react'
import Logo from './Logo'


const footerLinks = {
  platform: [
    { label: 'How It Works', path: '/how-it-works' },
    { label: 'Donate Items', path: '/donate' },
    { label: 'Animal Welfare', path: '/animals' },
    { label: 'NGOs', path: '/ngos' },
    { label: 'Volunteer', path: '/volunteer' },
  ],
  support: [
    { label: 'About Us', path: '/about' },
    { label: 'Contact Us', path: '/contact' },
    { label: 'FAQ', path: '/faq' },
    { label: 'NGO Registration', path: '/ngos/register' },
    { label: 'Start a Campaign', path: '/volunteer/start' },
  ],
}

export default function Footer() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [email, setEmail] = useState('')
  const [subbed, setSubbed] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email) { setSubbed(true); setEmail('') }
  }

  const footerBg = isDark ? 'bg-[#07071A] border-t border-[#13221B]/15' : 'bg-[#1E1B4B] border-t border-[#13221B]/30'
  const textMuted = isDark ? 'text-[#7777AA]' : 'text-[#A5B4FC]'
  const textHover = isDark ? 'hover:text-white' : 'hover:text-white'
  const inputCls = isDark
    ? 'bg-white/[0.04] border border-white/10 text-white placeholder-[#555577] focus:border-[#13221B]'
    : 'bg-white/[0.08] border border-white/15 text-white placeholder-[#A5B4FC] focus:border-[#A5B4FC]'
  const socialBtn = isDark
    ? 'bg-white/[0.05] border-white/10 text-[#7777AA] hover:text-[#2E7D59] hover:border-[#13221B]/30 hover:bg-[#13221B]/10'
    : 'bg-white/[0.07] border-white/15 text-[#A5B4FC] hover:text-white hover:border-white/30 hover:bg-white/10'

  return (
    <footer className={`${footerBg} pt-16 pb-6`}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Logo size={22} textClass="text-xl block text-white" isDarkOverride={true} />
            </Link>
            <p className={`text-sm leading-relaxed mb-5 ${textMuted}`}>Connecting hearts, transforming communities through compassion and action.</p>
            <div className={`flex flex-col gap-2 text-sm ${textMuted}`}>
              <a href="mailto:amansahuat799959@gmail.com" className={`flex items-center gap-2 ${textHover} transition-colors`}>
                <Mail size={14} className="text-[#13221w]" /> amansahuat799959@gmail.com
              </a>
              <a href="tel:+916267718876" className={`flex items-center gap-2 ${textHover} transition-colors`}>
                <Phone size={14} className="text-[#13221w]" /> +91 62677 18876
              </a>
              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-[#13221w]" /> Bharat
              </span>
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="font-['Poppins'] font-semibold text-white text-sm mb-4">Platform</h4>
            <ul className="flex flex-col gap-2.5">
              {footerLinks.platform.map(l => (
                <li key={l.path}>
                  <Link to={l.path} className={`text-sm ${textMuted} hover:text-white hover:translate-x-1 transition-all inline-block`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="font-['Poppins'] font-semibold text-white text-sm mb-4">Support</h4>
            <ul className="flex flex-col gap-2.5">
              {footerLinks.support.map(l => (
                <li key={l.path}>
                  <Link to={l.path} className={`text-sm ${textMuted} hover:text-white hover:translate-x-1 transition-all inline-block`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-['Poppins'] font-semibold text-white text-sm mb-2">Newsletter</h4>
            <p className={`text-sm mb-4 ${textMuted}`}>Stay updated with success stories & campaigns.</p>
            {subbed ? (
              <div className="p-3 rounded-xl bg-[#43E97B]/10 border border-[#43E97B]/25 text-[#43E97B] text-sm text-center">
                🎉 Subscribed successfully!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all ${inputCls}`}
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(108,99,255,0.4)] hover:-translate-y-0.5 transition-all"
                >
                  <Send size={14} /> Subscribe
                </button>
              </form>
            )}

            {/* Social */}
            <div className="flex items-center gap-2 mt-5">
              {[
                { icon: <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" /></svg>, href: '#', color: '#3B5998' },
                { icon: <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>, href: '#', color: '#1DA1F2' },
                { icon: <svg className="w-4 h-4 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>, href: '#', color: '#E1306C' },
                { icon: <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.507a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.507 9.388.507 9.388.507s7.517 0 9.388-.507a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>, href: '#', color: '#FF0000' },
              ].map((s, i) => (
                <a
                  key={i} href={s.href}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all hover:-translate-y-0.5 ${socialBtn}`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 ${isDark ? 'border-[#13221B]/10' : 'border-white/10'}`}>
          <p className={`text-xs ${textMuted}`}>© 2025 Helping-Hands. All rights reserved.</p>
          <div className={`flex items-center gap-4 text-xs ${textMuted}`}>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
