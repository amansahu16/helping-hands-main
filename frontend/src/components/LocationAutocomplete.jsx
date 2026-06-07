import { useState, useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search address...',
  inputClass = '',
  isDark = false,
  onSelectLocation
}) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  // Sync internal query state with parent value
  useEffect(() => {
    setQuery(value || '')
  }, [value])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = async (searchVal) => {
    if (searchVal.trim().length <= 2) {
      setSuggestions([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchVal
        )}&format=json&limit=5&addressdetails=1`
      )
      const data = await res.json()
      setSuggestions(data || [])
    } catch (err) {
      console.error('Error fetching address suggestions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)
    setIsOpen(true)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val)
    }, 400)
  }

  const handleSelect = (item) => {
    // Generate clean label
    const addr = item.address || {}
    const landmark = addr.amenity || addr.tourism || addr.shop || addr.building || addr.man_made || addr.leisure || null
    const road = addr.house_number ? `${addr.house_number}, ${addr.road || ''}`.trim() : addr.road
    const area = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.county
    const city = addr.city || addr.town || addr.village || addr.district
    
    const formattedLabel = [landmark, road, area, city, addr.state, addr.country]
      .filter(Boolean)
      .join(', ') || item.display_name

    setQuery(formattedLabel)
    setIsOpen(false)
    setSuggestions([])

    if (onSelectLocation) {
      onSelectLocation({
        locationStr: formattedLabel,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      })
    }
  }

  const dropdownBg = isDark
    ? 'bg-[#16163A] border-white/10 text-white'
    : 'bg-white border-[#E0E7FF] text-[#1E1B4B] shadow-lg'

  const itemHover = isDark
    ? 'hover:bg-white/[0.05] border-white/5'
    : 'hover:bg-[#EEF2FF] border-[#E0E7FF]'

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555577] z-10" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`${inputClass} pl-9 pr-4 w-full`}
        />
      </div>

      {isOpen && (suggestions.length > 0 || loading) && (
        <div
          className={`absolute left-0 right-0 mt-1.5 rounded-xl border max-h-60 overflow-y-auto z-[9999] p-1 flex flex-col gap-0.5 ${dropdownBg}`}
        >
          {loading && (
            <div className="p-3 text-xs text-[#8888AA] flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-[#8888AA]/30 border-t-[#2E7D59] rounded-full animate-spin" />
              Searching locations...
            </div>
          )}
          {!loading &&
            suggestions.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onClick={() => handleSelect(item)}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs leading-relaxed transition-colors border-b last:border-b-0 cursor-pointer ${itemHover}`}
              >
                <div className="font-semibold truncate">
                  {item.address?.amenity || item.address?.road || item.display_name.split(',')[0]}
                </div>
                <div className="text-[10px] text-[#8888AA] truncate mt-0.5">
                  {item.display_name}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
