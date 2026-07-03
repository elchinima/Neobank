import { useEffect, useState } from 'react'

export function usePublicFooter() {
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [selectedLang, setSelectedLang] = useState('en')

  useEffect(() => {
    if (!isInfoOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsInfoOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isInfoOpen])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return {
    isInfoOpen,
    setIsInfoOpen,
    selectedLang,
    setSelectedLang,
    scrollToTop,
  }
}
