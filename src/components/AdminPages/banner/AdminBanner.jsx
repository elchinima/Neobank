import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import './AdminBanner.scss'

const pageLabels = {
  cards: 'Cards',
  loans: 'Loans',
  deposits: 'Deposits',
  support: 'Support',
  cashback: 'Cashback',
}

const langs = ['en', 'ru', 'az']
const langLabels = { en: 'English', ru: 'Русский', az: 'Azərbaycan' }

const defaultPageRows = Object.keys(pageLabels).map((pageKey) => {
  const translations = {}
  langs.forEach((l) => {
    translations[l] = { bannerImageUrl: '', mediaText: '', updatedAt: null }
  })
  return {
    id: pageKey,
    pageKey,
    translations,
  }
})

const AdminBanner = () => {
  const [pages, setPages] = useState(defaultPageRows)
  const [initialPages, setInitialPages] = useState(defaultPageRows)
  const [savingKey, setSavingKey] = useState('')
  const [status, setStatus] = useState('')
  const [activeLang, setActiveLang] = useState(() => {
    const init = {}
    Object.keys(pageLabels).forEach((k) => (init[k] = 'en'))
    return init
  })

  useEffect(() => {
    let ignore = false

    async function loadContent() {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/public-content`)
        if (!response.ok) {
          throw new Error('Failed to load admin content')
        }

        const data = await response.json()
        const pageMap = new Map((Array.isArray(data.pages) ? data.pages : []).map((page) => [page.pageKey, page]))
        
        const nextPages = defaultPageRows.map((page) => {
          const serverPage = pageMap.get(page.pageKey)
          if (!serverPage) return page

          const mergedTranslations = { ...page.translations }
          if (serverPage.translations) {
            Object.keys(serverPage.translations).forEach((l) => {
              if (mergedTranslations[l]) {
                mergedTranslations[l] = { ...mergedTranslations[l], ...serverPage.translations[l] }
              }
            })
          }
          return { ...page, translations: mergedTranslations }
        })

        if (!ignore) {
          setPages(nextPages)
          setInitialPages(JSON.parse(JSON.stringify(nextPages)))
        }
      } catch (err) {
        console.warn(err)
      }
    }

    loadContent()
    return () => {
      ignore = true
    }
  }, [])

  const updatePageField = (pageKey, lang, field, value) => {
    setPages((current) => current.map((page) => {
      if (page.pageKey === pageKey) {
        return {
          ...page,
          translations: {
            ...page.translations,
            [lang]: {
              ...page.translations[lang],
              [field]: value
            }
          }
        }
      }
      return page
    }))
  }

  const handleLangChange = (pageKey, newLang) => {
    setActiveLang(prev => ({ ...prev, [pageKey]: newLang }))
  }

  const savePage = async (page) => {
    const initialPage = initialPages.find((p) => p.pageKey === page.pageKey)
    const hasChanges = langs.some((lang) => {
      const initT = initialPage?.translations[lang] || {}
      const currT = page.translations[lang] || {}
      return initT.bannerImageUrl !== currT.bannerImageUrl || initT.mediaText !== currT.mediaText
    })

    if (!hasChanges) {
      setStatus(`No changes to save for ${pageLabels[page.pageKey]}`)
      return
    }

    setSavingKey(`page-${page.pageKey}`)
    setStatus('')
    try {
      const response = await fetch(`${API_BASE_URL}/admin/page-settings/${page.pageKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translations: page.translations
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to save page')
      }
      const updated = await response.json()
      
      const updateFn = (current) => current.map((item) => {
        if (item.pageKey === updated.pageKey) {
          const mergedTranslations = { ...item.translations }
          if (updated.translations) {
            Object.keys(updated.translations).forEach((l) => {
              if (mergedTranslations[l]) {
                mergedTranslations[l] = { ...mergedTranslations[l], ...updated.translations[l] }
              }
            })
          }
          return { ...item, translations: mergedTranslations }
        }
        return item
      })

      setPages(updateFn)
      setInitialPages(updateFn)

      setStatus(`${pageLabels[page.pageKey]} saved`)
    } catch (err) {
      setStatus(err.message)
    } finally {
      setSavingKey('')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className="admin-banner">
      <header className="admin-banner__header">
        <div>
          <span className="admin-banner__eyebrow">Admin Panel</span>
          <h1>Public content</h1>
        </div>
        {status && <p className="admin-banner__status">{status}</p>}
      </header>

      <section className="admin-banner__section" aria-labelledby="page-settings-title">
        <div className="admin-banner__section-heading">
          <span className="admin-banner__eyebrow">Banners</span>
          <h2 id="page-settings-title">Page banner settings</h2>
        </div>

        <div className="admin-banner__page-grid">
          {pages.map((page) => {
            const currentLang = activeLang[page.pageKey]
            const t = page.translations[currentLang] || {}
            const updatedAt = t.updatedAt

            return (
              <article className="admin-banner__card" key={page.pageKey}>
                <div className="admin-banner__card-top-bar">
                  <div className="admin-banner__saved-indicator">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span>Saved: {updatedAt && !updatedAt.startsWith('0001-01-01') ? formatDate(updatedAt) : 'Never'}</span>
                  </div>
                </div>

                <div className="admin-banner__card-heading">
                  <div>
                    <h3>{pageLabels[page.pageKey]}</h3>
                    <span>/{page.pageKey}</span>
                  </div>
                  
                  <select 
                    className="admin-banner__lang-select"
                    value={currentLang}
                    onChange={(e) => handleLangChange(page.pageKey, e.target.value)}
                  >
                    {langs.map(l => (
                      <option key={l} value={l}>{langLabels[l]} ({l.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                <label>
                  Banner image URL
                  <input
                    type="text"
                    value={t.bannerImageUrl || ''}
                    placeholder="Paste image URL or leave empty to hide"
                    onChange={(event) => updatePageField(page.pageKey, currentLang, 'bannerImageUrl', event.target.value)}
                  />
                </label>
                <label>
                  <div className="admin-banner__label-with-count">
                    <span>Text below image</span>
                    <span className="admin-banner__char-count">
                      {(t.mediaText || '').length}/1000
                    </span>
                  </div>
                  <textarea
                    rows="4"
                    maxLength={1000}
                    value={t.mediaText || ''}
                    onChange={(event) => updatePageField(page.pageKey, currentLang, 'mediaText', event.target.value)}
                  />
                </label>
                <button
                  className="admin-banner__button admin-banner__button--primary"
                  type="button"
                  onClick={() => savePage(page)}
                  disabled={savingKey === `page-${page.pageKey}`}
                >
                  {savingKey === `page-${page.pageKey}` ? 'Saving' : 'Save page'}
                </button>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default AdminBanner


