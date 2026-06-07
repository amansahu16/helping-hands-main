import React from 'react'
import { useTheme } from '../context/ThemeContext'
import logoImg from '../pages/images/logo.png'

export function LogoIcon({ size = 50, className = "" }) {
  return (
    <img
      src={logoImg}
      alt="Helping Hands"
      style={{ width: size, height: size }}
      className={`object-contain ${className}`}
    />
  )
}

export default function Logo({ size = 100, textClass = "text-lg", isDarkOverride }) {
  const { theme } = useTheme()
  const isDark = isDarkOverride !== undefined ? isDarkOverride : theme === 'dark'

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-15 h-15 flex items-center justify-center transition-all duration-300 hover:scale-105">
        <LogoIcon size={size} className="rounded-x1" />
      </div>
      <span className={`brand-font font-black tracking-tight ${textClass}`} style={{ color: isDark ? '#fff' : '#13221B' }}>
        Helping Hands
      </span>
    </div>
  )
}

