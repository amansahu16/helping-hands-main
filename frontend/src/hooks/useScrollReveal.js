import { useEffect, useRef } from 'react'

/* Attach a MutationObserver/IntersectionObserver to animate elements
   with class `reveal`, `reveal-left`, `reveal-right` when they scroll into view */
export default function useScrollReveal() {
  const observerRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    observerRef.current = observer

    // Observe elements currently in DOM
    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    elements.forEach(el => observer.observe(el))

    // Set up a MutationObserver to watch for dynamically added elements
    const mutationObserver = new MutationObserver(() => {
      const newElements = document.querySelectorAll('.reveal:not(.visible), .reveal-left:not(.visible), .reveal-right:not(.visible)')
      newElements.forEach(el => observer.observe(el))
    })

    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [])
}
