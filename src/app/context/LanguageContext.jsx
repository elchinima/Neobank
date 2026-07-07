import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('app_lang') || 'en')

  useEffect(() => {
    localStorage.setItem('app_lang', lang)
    document.documentElement.setAttribute('lang', lang)
    document.documentElement.setAttribute('data-lang', lang)
  }, [lang])

  const setLang = (newLang) => {
    setLangState(newLang)
  }

  const t = (dict, key) => {
    if (!dict) return key
    if (dict[lang] && dict[lang][key] !== undefined) {
      return dict[lang][key]
    }
    if (dict.en && dict.en[key] !== undefined) {
      return dict.en[key]
    }
    return key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext
