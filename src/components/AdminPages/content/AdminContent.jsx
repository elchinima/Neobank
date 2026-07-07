import { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import './AdminContent.scss'

const pageLabels = {
  cards: 'Cards',
  loans: 'Loans',
  deposits: 'Deposits',
  support: 'Support',
  cashback: 'Cashback',
}

const defaultPageRows = Object.keys(pageLabels).map((pageKey) => ({
  id: pageKey,
  pageKey,
  bannerImageUrl: '',
  mediaText: '',
}))

const AdminContent = () => {
  const [pages, setPages] = useState(defaultPageRows)
  const [footerLinks, setFooterLinks] = useState([])
  const [footerContacts, setFooterContacts] = useState([])
  const [savingKey, setSavingKey] = useState('')
  const [status, setStatus] = useState('')

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
        const nextPages = defaultPageRows.map((page) => ({
          ...page,
          ...(pageMap.get(page.pageKey) || {}),
        }))

        if (!ignore) {
          setPages(nextPages)
          setFooterLinks(Array.isArray(data.footerLinks) ? data.footerLinks : [])
          setFooterContacts(Array.isArray(data.footerContacts) ? data.footerContacts : [])
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

  const groupedLinks = useMemo(() => {
    return footerLinks.reduce((groups, link) => {
      const section = link.section || 'other'
      return {
        ...groups,
        [section]: [...(groups[section] || []), link],
      }
    }, {})
  }, [footerLinks])

  const updatePageField = (pageKey, field, value) => {
    setPages((current) => current.map((page) => (
      page.pageKey === pageKey ? { ...page, [field]: value } : page
    )))
  }

  const updateFooterLinkField = (id, field, value) => {
    setFooterLinks((current) => current.map((link) => (
      link.id === id ? { ...link, [field]: value } : link
    )))
  }

  const updateFooterContactField = (id, field, value) => {
    setFooterContacts((current) => current.map((contact) => (
      contact.id === id ? { ...contact, [field]: value } : contact
    )))
  }

  const savePage = async (page) => {
    setSavingKey(`page-${page.pageKey}`)
    setStatus('')
    try {
      const response = await fetch(`${API_BASE_URL}/admin/page-settings/${page.pageKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bannerImageUrl: page.bannerImageUrl,
          mediaText: page.mediaText,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to save page')
      }
      const updated = await response.json()
      setPages((current) => current.map((item) => (
        item.pageKey === updated.pageKey ? { ...item, ...updated } : item
      )))
      setStatus(`${pageLabels[page.pageKey]} saved`)
    } catch (err) {
      setStatus(err.message)
    } finally {
      setSavingKey('')
    }
  }

  const saveFooterLink = async (link) => {
    setSavingKey(`link-${link.id}`)
    setStatus('')
    try {
      const response = await fetch(`${API_BASE_URL}/admin/footer-links/${link.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: link.label,
          url: link.url,
          isExternal: Boolean(link.isExternal),
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to save footer link')
      }
      const updated = await response.json()
      setFooterLinks((current) => current.map((item) => item.id === updated.id ? updated : item))
      setStatus('Footer link saved')
    } catch (err) {
      setStatus(err.message)
    } finally {
      setSavingKey('')
    }
  }

  const saveFooterContact = async (contact) => {
    setSavingKey(`contact-${contact.id}`)
    setStatus('')
    try {
      const response = await fetch(`${API_BASE_URL}/admin/footer-contacts/${contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: contact.label,
          value: contact.value,
          url: contact.url,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to save footer contact')
      }
      const updated = await response.json()
      setFooterContacts((current) => current.map((item) => item.id === updated.id ? updated : item))
      setStatus('Footer contact saved')
    } catch (err) {
      setStatus(err.message)
    } finally {
      setSavingKey('')
    }
  }

  return (
    <div className="admin-content">
      <header className="admin-content__header">
        <div>
          <span className="admin-content__eyebrow">Admin Panel</span>
          <h1>Public content</h1>
        </div>
        {status && <p className="admin-content__status">{status}</p>}
      </header>

      <section className="admin-content__section" aria-labelledby="page-settings-title">
        <div className="admin-content__section-heading">
          <span className="admin-content__eyebrow">Banners</span>
          <h2 id="page-settings-title">Page banner settings</h2>
        </div>

        <div className="admin-content__page-grid">
          {pages.map((page) => (
            <article className="admin-content__card" key={page.pageKey}>
              <div className="admin-content__card-heading">
                <h3>{pageLabels[page.pageKey]}</h3>
                <span>/{page.pageKey}</span>
              </div>
              <label>
                Banner image URL
                <input
                  type="text"
                  value={page.bannerImageUrl || ''}
                  placeholder="Paste image URL or leave empty to hide"
                  onChange={(event) => updatePageField(page.pageKey, 'bannerImageUrl', event.target.value)}
                />
              </label>
              <label>
                Text below image
                <textarea
                  rows="4"
                  value={page.mediaText || ''}
                  onChange={(event) => updatePageField(page.pageKey, 'mediaText', event.target.value)}
                />
              </label>
              <button
                className="admin-content__button admin-content__button--primary"
                type="button"
                onClick={() => savePage(page)}
                disabled={savingKey === `page-${page.pageKey}`}
              >
                {savingKey === `page-${page.pageKey}` ? 'Saving' : 'Save page'}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-content__section" aria-labelledby="footer-links-title">
        <div className="admin-content__section-heading">
          <span className="admin-content__eyebrow">Footer</span>
          <h2 id="footer-links-title">Footer links</h2>
        </div>

        {Object.entries(groupedLinks).map(([section, links]) => (
          <div className="admin-content__link-group" key={section}>
            <h3>{section}</h3>
            {links.map((link) => (
              <article className="admin-content__row-card" key={link.id}>
                <label>
                  Label
                  <input
                    type="text"
                    value={link.label || ''}
                    onChange={(event) => updateFooterLinkField(link.id, 'label', event.target.value)}
                  />
                </label>
                <label>
                  Link
                  <input
                    type="text"
                    value={link.url || ''}
                    onChange={(event) => updateFooterLinkField(link.id, 'url', event.target.value)}
                  />
                </label>
                <label className="admin-content__check">
                  <input
                    type="checkbox"
                    checked={Boolean(link.isExternal)}
                    onChange={(event) => updateFooterLinkField(link.id, 'isExternal', event.target.checked)}
                  />
                  External
                </label>
                <button
                  className="admin-content__button"
                  type="button"
                  onClick={() => saveFooterLink(link)}
                  disabled={savingKey === `link-${link.id}`}
                >
                  {savingKey === `link-${link.id}` ? 'Saving' : 'Save'}
                </button>
              </article>
            ))}
          </div>
        ))}
      </section>

      <section className="admin-content__section" aria-labelledby="footer-contacts-title">
        <div className="admin-content__section-heading">
          <span className="admin-content__eyebrow">Bank contacts</span>
          <h2 id="footer-contacts-title">Footer contact data</h2>
        </div>

        <div className="admin-content__contacts">
          {footerContacts.map((contact) => (
            <article className="admin-content__row-card admin-content__row-card--contact" key={contact.id}>
              <label>
                Label
                <input
                  type="text"
                  value={contact.label || ''}
                  onChange={(event) => updateFooterContactField(contact.id, 'label', event.target.value)}
                />
              </label>
              <label>
                Value
                <input
                  type="text"
                  value={contact.value || ''}
                  onChange={(event) => updateFooterContactField(contact.id, 'value', event.target.value)}
                />
              </label>
              <label>
                Link
                <input
                  type="text"
                  value={contact.url || ''}
                  onChange={(event) => updateFooterContactField(contact.id, 'url', event.target.value)}
                />
              </label>
              <button
                className="admin-content__button"
                type="button"
                onClick={() => saveFooterContact(contact)}
                disabled={savingKey === `contact-${contact.id}`}
              >
                {savingKey === `contact-${contact.id}` ? 'Saving' : 'Save'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AdminContent
