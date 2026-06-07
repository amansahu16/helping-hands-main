import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

/**
 * FeatureCard Component
 * Implements hardware-accelerated, anti-aliased transitions to prevent jagged/distorted edges
 * on hover-scaling, matching the high-quality cream/forest-green aesthetic.
 */
export default function FeatureCard({ title, desc, link, image, icon, revealDelay = '0s', showAction = true }) {
  const CardContainer = link ? Link : 'div'
  const containerProps = link ? { to: link } : {}

  return (
    <CardContainer
      {...containerProps}
      className="group relative block w-full h-[290px] rounded-3xl overflow-hidden border border-[#2E7D59]/15 shadow-[0_8px_30px_rgba(19,34,27,0.03)] hover:shadow-[0_20px_50px_rgba(19,34,27,0.12)] hover:-translate-y-2 transition-all duration-500 ease-out transform-gpu reveal"
      style={{
        transitionDelay: revealDelay,
        WebkitTransform: 'translate3d(0, 0, 0)',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
    >
      {/* Background Image with hardware-accelerated zoom */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
        style={{
          backgroundImage: `linear-gradient(to top, rgba(7, 7, 26, 0.95) 0%, rgba(7, 7, 26, 0.45) 60%, rgba(7, 7, 26, 0.1) 100%), url(${image})`,
          willChange: 'transform',
          WebkitTransform: 'translate3d(0, 0, 0)',
          transform: 'translate3d(0, 0, 0)'
        }}
      />

      {/* Glassmorphic border overlay reflection */}
      <div className="absolute inset-0 z-10 rounded-3xl border border-white/5 pointer-events-none group-hover:border-[#43E97B]/20 transition-colors duration-300" />

      {/* Content Container */}
      <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
        <div
          className="transition-transform duration-500 ease-out group-hover:translate-y-[-6px]"
          style={{
            willChange: 'transform',
            WebkitTransform: 'translate3d(0, 0, 0)',
            transform: 'translate3d(0, 0, 0)'
          }}
        >
          {/* Optional Icon */}
          {icon && (
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center mb-4 text-[#43E97B] transition-transform duration-300 group-hover:scale-110 shadow-sm">
              {icon}
            </div>
          )}

          <h3 className="font-['Poppins'] font-black text-xl text-white mb-2 tracking-wide leading-tight">
            {title}
          </h3>
          <p className="text-xs leading-relaxed text-[#BBBBD8] mb-4 opacity-90 group-hover:opacity-100 transition-opacity">
            {desc}
          </p>
          {showAction && (
            <div className="flex items-center gap-1.5 text-[#43E97B] text-xs font-bold uppercase tracking-wider group-hover:gap-2.5 transition-all duration-300">
              <span>Learn more</span>
              <ArrowRight size={15} />
            </div>
          )}
        </div>
      </div>
    </CardContainer>
  )
}
