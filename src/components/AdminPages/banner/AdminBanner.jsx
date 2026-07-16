import Cookies from 'js-cookie'
import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import glowingSmiley from '../../../assets/icons/glowing_smiley_animated.svg'
import './AdminBanner.scss'

const adminFetch = (url, options = {}) => {
  const token = Cookies.get('neobank_token');
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  return fetch(url, { ...options, headers });
};




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
  
  const [aiModal, setAiModal] = useState({ isOpen: false, pageKey: '', lang: '' })
  const [aiLoadingKey, setAiLoadingKey] = useState('')

  const openAiModal = (pageKey, lang) => {
    setAiModal({ isOpen: true, pageKey, lang })
  }

  const handleAIGenerate = async () => {
    const { pageKey, lang } = aiModal;
    setAiModal({ isOpen: false, pageKey: '', lang: '' });
    
    const pageData = pages.find(p => p.pageKey === pageKey);
    const imageUrl = pageData?.translations[lang]?.bannerImageUrl || '';

    setAiLoadingKey(pageKey);
    setStatus('Generating text with AI...');

    try {
      const response = await adminFetch(`${API_BASE_URL}/admin/page-settings/generate-ai-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageKey, languageCode: lang, bannerImageUrl: imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate text');
      }

      const data = await response.json();
      updatePageField(pageKey, lang, 'mediaText', data.generatedText);
      setStatus(`AI generation completed for ${pageLabels[pageKey]}`);
    } catch (err) {
      setStatus(`AI error: ${err.message}`);
    } finally {
      setAiLoadingKey('');
    }
  }

  useEffect(() => {
    let ignore = false

    async function loadContent() {
      try {
        const response = await adminFetch(`${API_BASE_URL}/admin/public-content`)
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
      const response = await adminFetch(`${API_BASE_URL}/admin/page-settings/${page.pageKey}`, {
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
                    disabled={aiLoadingKey === page.pageKey}
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
                    disabled={aiLoadingKey === page.pageKey}
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
                    disabled={aiLoadingKey === page.pageKey}
                  />
                </label>
                <div className="admin-banner__actions">
                  <button
                    className="admin-banner__button admin-banner__button--primary"
                    type="button"
                    onClick={() => savePage(page)}
                    disabled={savingKey === `page-${page.pageKey}` || aiLoadingKey === page.pageKey}
                  >
                    {savingKey === `page-${page.pageKey}` ? 'Saving' : 'Save page'}
                  </button>
                  <div className="admin-banner__ai-btn-wrap">
                    <button 
                      type="button" 
                      className="admin-banner__button admin-banner__button--purple-square"
                      onClick={() => openAiModal(page.pageKey, currentLang)}
                      disabled={aiLoadingKey === page.pageKey}
                    >
                      <svg viewBox="48 0 104 50" xmlns="http://www.w3.org/2000/svg" width="28" height="14" style={{ transform: 'scale(10)' }}>
                        <style>
                          {`
                            @keyframes blink {
                              0%, 94%, 100% { transform: scaleY(1); }
                              97% { transform: scaleY(0.1); }
                            }
                            @keyframes lookAround {
                              0%, 15%, 100% { transform: translate(0px, 0px); }
                              25%, 40% { transform: translate(0.4px, -0.1px); }
                              55%, 70% { transform: translate(-0.4px, 0.1px); }
                              80%, 90% { transform: translate(0.1px, -0.2px); }
                            }
                          `}
                        </style>
                        <defs>
                          <radialGradient id={`eyeOuter-${page.pageKey}`} cx="50%" cy="35%" r="70%">
                            <stop offset="0%" stopColor="#ffe28a" stopOpacity="0.85"/>
                            <stop offset="55%" stopColor="#f3c24a" stopOpacity="0.6"/>
                            <stop offset="100%" stopColor="#a020f0" stopOpacity="0"/>
                          </radialGradient>
                          <radialGradient id={`eyeIris-${page.pageKey}`} cx="45%" cy="40%" r="60%">
                            <stop offset="0%" stopColor="#fff6dd"/>
                            <stop offset="50%" stopColor="#ffe28a"/>
                            <stop offset="100%" stopColor="#c88ef0"/>
                          </radialGradient>
                          <filter id={`softBlur-${page.pageKey}`} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="0.2"/>
                          </filter>
                          <clipPath id={`clipL-${page.pageKey}`}>
                            <circle cx="97.9" cy="25" r="1.6"/>
                          </clipPath>
                          <clipPath id={`clipR-${page.pageKey}`}>
                            <circle cx="102.1" cy="25" r="1.6"/>
                          </clipPath>
                        </defs>
                        <g style={{transformOrigin: '97.9px 25px', animation: 'blink 4s infinite'}}>
                          <circle cx="97.9" cy="25" r="2.1" fill={`url(#eyeOuter-${page.pageKey})`} filter={`url(#softBlur-${page.pageKey})`}/>
                          <circle cx="97.9" cy="25" r="1.6" fill={`url(#eyeIris-${page.pageKey})`}/>
                          <g style={{animation: 'lookAround 6s infinite ease-in-out'}} clipPath={`url(#clipL-${page.pageKey})`}>
                            <circle cx="97.9" cy="25.3" r="0.75" fill="#3a1a52"/>
                            <circle cx="97.55" cy="24.85" r="0.28" fill="#ffffff"/>
                          </g>
                        </g>
                        <g style={{transformOrigin: '102.1px 25px', animation: 'blink 4s infinite'}}>
                          <circle cx="102.1" cy="25" r="2.1" fill={`url(#eyeOuter-${page.pageKey})`} filter={`url(#softBlur-${page.pageKey})`}/>
                          <circle cx="102.1" cy="25" r="1.6" fill={`url(#eyeIris-${page.pageKey})`}/>
                          <g style={{animation: 'lookAround 6s infinite ease-in-out'}} clipPath={`url(#clipR-${page.pageKey})`}>
                            <circle cx="102.1" cy="25.3" r="0.75" fill="#3a1a52"/>
                            <circle cx="101.75" cy="24.85" r="0.28" fill="#ffffff"/>
                          </g>
                        </g>
                        <path d="M 98.1 28.4 Q 100 29.8 101.9 28.4" fill="none" stroke={`url(#eyeOuter-${page.pageKey})`} strokeWidth="1.0" strokeLinecap="round" filter={`url(#softBlur-${page.pageKey})`}/>
                        <path d="M 98.1 28.4 Q 100 29.8 101.9 28.4" fill="none" stroke={`url(#eyeIris-${page.pageKey})`} strokeWidth="0.4" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <div className="admin-banner__ai-tooltip">
                      <span>✦</span> Write with AI
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {aiModal.isOpen && (
        <div className="admin-banner__modal-overlay">
          <div className="admin-banner__modal">
            <h3>Generate with AI</h3>
            <p>Are you sure you want to write "Text below image" for <strong>{pageLabels[aiModal.pageKey]}</strong> with AI?</p>
            <div className="admin-banner__modal-actions">
              <button 
                className="admin-banner__button"
                onClick={() => setAiModal({ isOpen: false, pageKey: '', lang: '' })}
              >
                Cancel
              </button>
              <button 
                className="admin-banner__button admin-banner__button--primary"
                onClick={handleAIGenerate}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBanner
