import { useEffect, useState } from 'react'
import { useLanguage } from '../../app/context/LanguageContext'

export function usePublicFooter() {
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const { lang, setLang } = useLanguage()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return {
    isInfoOpen,
    setIsInfoOpen,
    selectedLang: lang,
    setSelectedLang: setLang,
    scrollToTop,
  }
}
