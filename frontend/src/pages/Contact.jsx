import { useState, useEffect } from 'react'
import useScrollReveal from '../hooks/useScrollReveal'
import api from '../api/axios'
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

function FAQAccordion({ items, isDark }) {
  const [open, setOpen] = useState(null)
  const borderBase = isDark ? 'border-white/8' : 'border-[#E0E7FF]'
  const borderOpen = isDark ? 'border-[#13221B]/50' : 'border-[#13221B]/40'
  const btnText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const answerText = isDark ? 'text-[#8888AA]' : 'text-[#6366F1]'
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${open === i ? borderOpen : borderBase}`}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className={`w-full flex justify-between items-center px-5 py-4 text-left text-sm font-semibold ${btnText} ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-[#EEF2FF]'}`}
          >
            {item.q} <span className={`text-[#13221B] text-xl ml-4 ${open === i ? 'rotate-45' : ''} transition-transform`}>+</span>
          </button>
          <div className={`accordion-body ${open === i ? 'open' : ''}`}>
            <p className={`px-5 pb-4 text-sm leading-relaxed ${answerText}`}>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Contact() {
  useScrollReveal()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [locations, setLocations] = useState([])

  useEffect(() => {
    let active = true
    api.get('/public/locations')
      .then(res => {
        if (active) {
          setLocations(res.data || [])
        }
      })
      .catch(err => {
        console.error('Error fetching locations:', err)
      })
    return () => {
      active = false
    }
  }, [])

  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    await new Promise(r => setTimeout(r, 1200))
    setSuccess(true); setLoading(false)
  }

  const contactInfo = [
    { icon: <Mail size={22} />, title: 'Email Us', value: 'amansahuat799959@gmail.com', href: 'mailto:amansahuat799959@gmail.com', color: 'text-[#13221B]', bg: isDark ? 'bg-white/5 border-white/8' : 'bg-[#EEF2FF] border-[#C7D2FE]' },
    { icon: <Phone size={22} />, title: 'Call Us', value: '+91 62677 18876', href: 'tel:+916267718876', color: 'text-[#43E97B]', bg: isDark ? 'bg-white/5 border-white/8' : 'bg-green-50 border-green-100' },
    { icon: <MapPin size={22} />, title: 'Our Network', value: 'Bharat', href: '#', color: 'text-[#3D6A53]', bg: isDark ? 'bg-white/5 border-white/8' : 'bg-pink-50 border-pink-100' },
  ]

  const faqs = [
    { q: 'How quickly will I get a response?', a: 'We typically respond within 24 hours on business days. For urgent animal rescue, call the emergency line.' },
    { q: 'Can NGOs contact you for partnerships?', a: 'Absolutely! Email us at partnerships@helpinghands.org with your NGO details.' },
    { q: 'I have a complaint. What should I do?', a: 'Use the contact form with subject "Complaint" and our team will prioritize your case.' },
  ]



  // Theme classes
  const heroText = isDark ? 'text-white' : 'text-[#1E1B4B]'
  const subText = isDark ? 'text-[#BBBBD8]' : 'text-[#4338CA]'
  const mutedText = isDark ? 'text-[#7777AA]' : 'text-[#6366F1]'
  const sectionA = isDark ? 'bg-[#0F0F2A]' : 'bg-[#F8FAFF]'
  const sectionB = isDark ? 'bg-[#07071A]' : 'bg-white'
  const cardBg = isDark ? 'bg-[#16163A] border-white/8 hover:border-[#13221B]/30' : 'bg-white border-[#E0E7FF] hover:border-[#13221B]/30 shadow-sm hover:shadow-md'
  const formBg = isDark ? 'bg-[#16163A] border-white/8' : 'bg-white border-[#E0E7FF] shadow-sm'

  const inputCls = isDark
    ? 'px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-[#555577] text-sm focus:outline-none focus:border-[#13221B] transition-all'
    : 'px-4 py-3 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] text-[#1E1B4B] placeholder-[#A5B4FC] text-sm focus:outline-none focus:border-[#13221B] transition-all'
  const selectCls = isDark
    ? 'px-4 py-3 rounded-xl bg-[#0F0F2A] border border-white/10 text-white text-sm focus:outline-none focus:border-[#13221B] transition-all'
    : 'px-4 py-3 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] text-[#1E1B4B] text-sm focus:outline-none focus:border-[#13221B] transition-all'
  const labelCls = isDark ? 'text-[#8888AA] text-xs' : 'text-[#6366F1] text-xs font-medium'
  const iconBg = isDark ? 'bg-[#13221B]/12 border-[#13221B]/20 text-[#2E7D59]' : 'bg-[#EEF2FF] border-[#C7D2FE] text-[#13221B]'

  return (
    <div className="page-enter">
      <section className="page-hero-bg pt-32 pb-16 text-center relative overflow-hidden">
        <div className="max-w-[700px] mx-auto px-4 relative z-10">
          <div className="section-label mb-4">Get in Touch</div>
          <h1 className={`font-['Poppins'] font-black text-5xl mb-4 ${heroText}`}>
            Contact <span className="gradient-text">Us</span>
          </h1>
          <p className={`text-lg ${subText}`}>Have a question, feedback, or partnership inquiry? We'd love to hear from you.</p>
        </div>
      </section>

      {/* Contact cards */}
      <section className={`py-14 ${sectionA}`}>
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-5 reveal">
            {contactInfo.map((c, i) => (
              <a key={i} href={c.href} className={`border rounded-2xl p-5 text-center hover:-translate-y-1 transition-all ${cardBg}`}>
                <div className={`${c.color} w-12 h-12 rounded-xl border flex items-center justify-center mx-auto mb-3 ${c.bg}`}>{c.icon}</div>
                <p className={`text-xs mb-1 ${mutedText}`}>{c.title}</p>
                <p className={`font-semibold text-sm ${heroText}`}>{c.value}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form + locations */}
      <section className={`py-14 ${sectionB}`}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Form */}
            <div className="lg:col-span-3 reveal-left">
              {success ? (
                <div className={`border border-[#43E97B]/30 rounded-3xl p-10 text-center ${isDark ? 'bg-[#16163A]' : 'bg-green-50 shadow-md'}`}>
                  <CheckCircle size={52} className="text-[#43E97B] mx-auto mb-4" />
                  <h3 className={`font-['Poppins'] font-bold text-2xl mb-2 ${heroText}`}>
                    Message Sent! 🎉
                  </h3>
                  <p className={mutedText}>
                    We'll get back to you within 24 hours. Thank you for reaching out!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={`border rounded-3xl p-8 flex flex-col gap-4 ${formBg} ${isDark ? '' : 'shadow-md'}`}>
                  <h2 className={`font-['Poppins'] font-bold text-2xl mb-1 ${heroText}`}>
                    Send Us a Message
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className={labelCls}>Your Name *</label>
                      <input name="name" value={form.name} onChange={change} required placeholder="Full Name" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelCls}>Email *</label>
                      <input name="email" type="email" value={form.email} onChange={change} required placeholder="your@email.com" className={inputCls} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Subject</label>
                    <select name="subject" value={form.subject} onChange={change} className={selectCls}>
                      <option value="">Select a subject…</option>
                      {['General Inquiry', 'NGO Partnership', 'Donation Support', 'Volunteer Help', 'Technical Issue', 'Complaint', 'Media'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Message *</label>
                    <textarea name="message" value={form.message} onChange={change} required rows={5} placeholder="Write your message here…" className={`${inputCls} resize-none`} />
                  </div>

                  {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">⚠ {error}</div>}

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#13221B] to-[#3D6A53] text-white font-bold text-sm hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
                    {loading ? 'Sending…' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>

            {/* Locations */}
            <div className="lg:col-span-2 flex flex-col gap-4 reveal-right">

              {locations.map((l, i) => (
                <div key={i} className={`border rounded-2xl p-4 flex gap-3 ${cardBg}`}>
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${heroText}`}>{l.name}</p>
                    <p className="text-[#2E7D59] text-xs">{l.type}</p>
                    <p className={`text-xs mt-0.5 ${mutedText}`}>{l.address}</p>
                  </div>
                </div>
              ))}

              <div className={`border rounded-2xl p-5 text-center ${isDark
                ? 'bg-gradient-to-br from-[#13221B]/15 to-[#3D6A53]/10 border-[#13221B]/25'
                : 'bg-white border-[#C7D2FE] shadow-sm'
                }`}>
                <p className={`font-bold mb-1 ${heroText}`}>
                  Emergency Rescue
                </p>
                <p className={`text-xs mb-2 ${mutedText}`}>
                  For urgent animal rescue cases
                </p>
                <a href="tel:1962" className="text-[#3D6A53] font-bold text-lg hover:text-[#13221B] transition-colors">1962</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={`py-14 ${sectionA}`}>
        <div className="max-w-[700px] mx-auto px-4 sm:px-6">
          <h2 className={`font-['Poppins'] font-bold text-2xl text-center mb-6 ${heroText}`}>Contact FAQ</h2>
          <div className="reveal"><FAQAccordion items={faqs} isDark={isDark} /></div>
        </div>
      </section>
    </div>
  )
}
