import { useEffect, useMemo, useState } from 'react'

export const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')

let publicContentCache = null

const defaultContent = {
  pages: [],
  footerLinks: [],
  footerContacts: [],
}

export function usePublicContent() {
  const [content, setContent] = useState(publicContentCache || defaultContent)
  const [loading, setLoading] = useState(!publicContentCache)

  useEffect(() => {
    let ignore = false

    async function loadContent() {
      try {
        const response = await fetch(`${API_BASE_URL}/public-content`)
        if (!response.ok) {
          throw new Error('Failed to load public content')
        }

        const data = await response.json()
        const nextContent = {
          pages: Array.isArray(data.pages) ? data.pages : [],
          footerLinks: Array.isArray(data.footerLinks) ? data.footerLinks : [],
          footerContacts: Array.isArray(data.footerContacts) ? data.footerContacts : [],
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

export function usePublicPageSetting(pageKey) {
  const content = usePublicContent()

  const setting = useMemo(
    () => content.pages.find((page) => page.pageKey === pageKey) || null,
    [content.pages, pageKey]
  )

  return { setting, loading: content.loading }
}
