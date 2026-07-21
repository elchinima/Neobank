import { useEffect, useMemo, useState } from 'react'

export const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')

let publicContentCache = null

const defaultContent = {
  pages: [],
  footerLinks: [],
  footerContacts: [],
  footerSocials: [],
  footerDocuments: [],
}

export function usePublicContent() {
  const [content, setContent] = useState(publicContentCache || defaultContent)
  const [loading, setLoading] = useState(!publicContentCache)

  useEffect(() => {
    let ignore = false

    async function loadContent() {
      try {
        const response = await fetch(`${API_BASE_URL}/public`)
        if (!response.ok) {
          throw new Error('Failed to load public content')
        }

        const data = await response.json()
        const nextContent = {
          pages: Array.isArray(data.pages) ? data.pages : [],
          footerLinks: Array.isArray(data.footerLinks) ? data.footerLinks : [],
          footerContacts: Array.isArray(data.footerContacts) ? data.footerContacts : [],
          footerSocials: Array.isArray(data.footerSocials) ? data.footerSocials : [],
          footerDocuments: Array.isArray(data.footerDocuments) ? data.footerDocuments : [],
        }

        publicContentCache = nextContent
        if (!ignore) {
          setContent(nextContent)
        }
      } catch (err) {
        console.warn(err)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadContent()

    return () => {
      ignore = true
    }
  }, [])

  return { ...content, loading }
}

import { useLanguage } from '../context/LanguageContext'

export function usePublicPageSetting(pageKey) {
  const content = usePublicContent()
  const { lang } = useLanguage()

  const setting = useMemo(() => {
    const page = content.pages.find((p) => p.pageKey === pageKey)
    if (!page) return null
    return page.translations && page.translations[lang] ? page.translations[lang] : null
  }, [content.pages, pageKey, lang])

  return { setting, loading: content.loading }
}
