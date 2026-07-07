import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en')

  useEffect(() => {
    localStorage.setItem('app_lang', 'en')
    document.documentElement.setAttribute('lang', 'en')
    document.documentElement.setAttribute('data-lang', 'en')
  }, [])

  const setLang = () => {
    setLangState('en')
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
