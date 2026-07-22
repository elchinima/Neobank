import Cookies from 'js-cookie'
import { useEffect, useMemo, useState, useRef } from 'react'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import './AdminDatabase.scss'
import './AdminDatabase_Responsive.scss'
import MorphModal from '../../common/MorphModal/MorphModal'
const adminFetch = (url, options = {}) => {
  const token = Cookies.get('neobank_token');
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  return fetch(url, { ...options, headers });
};


const AdminDatabase = () => {
  const [files, setFiles] = useState([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploadModalPos, setUploadModalPos] = useState(null)
  const [uploadName, setUploadName] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [dropdownUp, setDropdownUp] = useState(false)
  const [renameModal, setRenameModal] = useState({ open: false, img: null, newName: '', clickPos: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, img: null, clickPos: null })
  const [previewModal, setPreviewModal] = useState({ open: false, img: null, clickPos: null })
  
  const fileInputRef = useRef(null)

  const loadFiles = async () => {
    setLoading(true)
    try {
      const response = await adminFetch(`${API_BASE_URL}/admin/database/files`)
      if (!response.ok) throw new Error('Failed to load files')
      const data = await response.json()
      setFiles(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const filteredFiles = useMemo(() => {
    if (!search.trim()) return files
    const s = search.toLowerCase()
    return files.filter(f => 
      f.id.toLowerCase().includes(s) || 
      f.name.toLowerCase().includes(s)
    )
  }, [files, search])

  const resultLabel = useMemo(() => {
    if (loading) return 'Loading files'
    return `${filteredFiles.length} file${filteredFiles.length === 1 ? '' : 's'}`
  }, [loading, filteredFiles.length])

  const openModal = (e) => {
    setIsModalOpen(true)
    setUploadModalPos(e && e.clientX ? { x: e.clientX, y: e.clientY } : null)
    setError('')
    setUploadName('')
    setUploadFile(null)
    setPreviewUrl(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const validateAndSetFile = (file) => {
    setError('')
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }
    const validTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
      'text/plain', 'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/markdown'
    ]
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Allowed: JPG, PNG, WEBP, TXT, PDF, DOCX, XLS, XLSX, MD')
      return
    }
    
    setUploadFile(file)
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  const handleUpload = async () => {
    if (!uploadName.trim()) {
      setError('Name is required')
      return
    }
    if (!uploadFile) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('name', uploadName.trim())

      const res = await adminFetch(`${API_BASE_URL}/admin/database/files`, {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || 'Upload failed')
      }
      const newFile = await res.json()
      setFiles(prev => [newFile, ...prev])
      closeModal()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const toggleMenu = (e, id) => {
    e.stopPropagation()
    if (activeMenuId === id) {
      setActiveMenuId(null)
    } else {
      setActiveMenuId(id)
      const buttonRect = e.currentTarget.getBoundingClientRect()
      const spaceBelow = window.innerHeight - buttonRect.bottom
      setDropdownUp(spaceBelow < 200)
    }
  }

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url)
    setActiveMenuId(null)
  }

  const openDeleteModal = (img, e) => {
    setDeleteModal({ open: true, img, clickPos: e ? { x: e.clientX, y: e.clientY } : null })
    setActiveMenuId(null)
  }

  const handleDelete = async () => {
    if (!deleteModal.img) return
    
    try {
      const res = await adminFetch(`${API_BASE_URL}/admin/database/files?fileName=${encodeURIComponent(deleteModal.img.fileName)}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || 'Failed to delete file')
      }
      
      setFiles(prev => prev.filter(f => f.id !== deleteModal.img.id))
      setDeleteModal({ open: false, img: null })
    } catch (err) {
      alert(err.message)
    }
  }

  const openRenameModal = (img, e) => {
    setRenameModal({ open: true, img, newName: img.name, clickPos: e ? { x: e.clientX, y: e.clientY } : null })
    setActiveMenuId(null)
  }

  const openPreviewModal = (img, e) => {
    setPreviewModal({ open: true, img, clickPos: e ? { x: e.clientX, y: e.clientY } : null })
    setActiveMenuId(null)
  }

  const handleRename = async () => {
    if (!renameModal.img || !renameModal.newName.trim()) return
    
    try {
      const res = await adminFetch(`${API_BASE_URL}/admin/database/files?fileName=${encodeURIComponent(renameModal.img.fileName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: renameModal.newName.trim() })
      })
      
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || 'Failed to rename')
      }
      loadFiles()
      setRenameModal({ open: false, img: null, newName: '' })
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="admin-db">
      <header className="admin-db__header">
        <div>
          <span className="admin-db__eyebrow">Admin Panel</span>
          <h1>Database</h1>
        </div>
        <div className="admin-db__actions">
          <div className="admin-db__search">
            <label htmlFor="admin-db-search">Search</label>
            <input
              id="admin-db-search"
              type="search"
              placeholder="Search by id or name"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearch(searchInput)
              }}
            />
          </div>
          <div className="admin-db__action-btns">
            <button 
              type="button" 
              className="admin-db__add-btn" 
              onClick={() => setSearch(searchInput)}
            >
              Search
            </button>
            <button className="admin-db__add-btn" onClick={(e) => openModal(e)}>
              Add File
            </button>
          </div>
        </div>
      </header>

      <section className="admin-db__table-card" aria-label="Images table">
        <div className="admin-db__table-meta">{resultLabel}</div>
        <div className="admin-db__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Upload Date</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.length > 0 ? (
                  filteredFiles.map((item, idx) => {
                    const dateObj = new Date(item.uploadDate)
                    const formattedDate = !isNaN(dateObj.getTime()) ? 
                      `${dateObj.toLocaleDateString('ru-RU')} ${dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` 
                      : 'Unknown Date'
                    
                    const fileType = item.url && item.url.split('?')[0].includes('.') 
                      ? item.url.split('?')[0].split('.').pop().toUpperCase() 
                      : '-';
                    
                    return (
                      <tr key={item.id} style={{ animationDelay: `${idx * 0.05}s` }}>
                        <td>{item.id}</td>
                        <td><strong>{item.name}</strong></td>
                        <td>{fileType}</td>
                        <td>{formattedDate}</td>
                        <td className="admin-db__actions-cell">
                          <div className="admin-db__menu-container">
                            <button 
                              className="admin-db__dots" 
                              type="button" 
                              aria-label="Image actions"
                              onClick={(e) => toggleMenu(e, item.id)}
                            >
                              <span />
                              <span />
                              <span />
                            </button>
                            
                            {activeMenuId === item.id && (
                              <div className={`admin-db__dropdown ${dropdownUp ? 'admin-db__dropdown--up' : ''}`}>
                                <button onClick={(e) => openPreviewModal(item, e)}>Preview File</button>
                                <button onClick={(e) => openRenameModal(item, e)}>Rename</button>
                                <button onClick={() => handleCopyUrl(item.url)}>Copy URL</button>
                                <button className="danger" onClick={(e) => openDeleteModal(item, e)}>Delete</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="admin-db__empty">
                      No files found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </section>

      <MorphModal
        isOpen={isModalOpen}
        onClose={closeModal}
        clickPos={uploadModalPos}
        overlayClass="admin-db-modal-overlay"
        modalClass="admin-db-modal"
      >
        <div className="admin-db-modal__header">
          <h2>Upload File</h2>
          <button className="admin-db-modal__close" onClick={closeModal}>&times;</button>
        </div>
        
        <div className="admin-db-modal__content">
          {error && <div className="admin-db-modal__error">{error}</div>}
          
          <div className="admin-db-modal__field">
            <label>File Name</label>
            <div className="admin-db-modal__input-wrap">
              <input 
                type="text" 
                value={uploadName} 
                onChange={e => setUploadName(e.target.value)} 
                placeholder="Enter unique name"
                maxLength={100}
              />
              <span className="admin-db-modal__counter">{uploadName.length}/100</span>
            </div>
          </div>

          <div className="admin-db-modal__field">
            <label>File *</label>
            {!uploadFile ? (
              <div 
                className="admin-db-modal__dropzone"
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="admin-db__icon--muted">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p>Click or drag file to upload<br/><span>Supports JPG, PNG, WEBP, TXT, PDF, DOCX, XLS, XLSX, MD (Max 5MB)</span></p>
              </div>
            ) : (
              <div className="admin-db-modal__preview-container">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="admin-db-modal__preview-img" />
                ) : (
                  <div className="admin-db-modal__preview-doc">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="admin-db__icon--medium">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <p className="admin-db-modal__preview-doc-name">{uploadFile.name}</p>
                  </div>
                )}
                <button className="admin-db-modal__remove-file" onClick={() => {
                  setUploadFile(null)
                  setPreviewUrl(null)
                }}>
                  Remove File
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
              accept="image/jpeg,image/png,image/webp,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/markdown"
            />
          </div>
        </div>

        <div className="admin-db-modal__footer">
          <button className="admin-db-modal__btn-cancel" onClick={closeModal} disabled={uploading}>Cancel</button>
          <button className="admin-db-modal__btn-save" onClick={handleUpload} disabled={uploading || !uploadFile || !uploadName}>
            {uploading ? 'Uploading...' : 'Save'}
          </button>
        </div>
      </MorphModal>

      <MorphModal
        isOpen={renameModal.open && !!renameModal.img}
        onClose={() => setRenameModal({ open: false, img: null, newName: '', clickPos: null })}
        clickPos={renameModal.clickPos}
        overlayClass="admin-db-modal-overlay"
        modalClass="admin-db-modal admin-db-modal--small"
      >
        <div className="admin-db-modal__header">
          <h2>Rename File</h2>
          <button className="admin-db-modal__close" onClick={() => setRenameModal({ open: false, img: null, newName: '', clickPos: null })}>&times;</button>
        </div>
        <div className="admin-db-modal__content">
          <div className="admin-db-modal__field">
            <label>New File Name</label>
            <div className="admin-db-modal__input-wrap">
              <input 
                type="text" 
                value={renameModal.newName} 
                onChange={e => setRenameModal({ ...renameModal, newName: e.target.value })} 
                placeholder="Enter new name"
                maxLength={100}
              />
              <span className="admin-db-modal__counter">{renameModal.newName.length}/100</span>
            </div>
          </div>
        </div>
        <div className="admin-db-modal__footer">
          <button className="admin-db-modal__btn-cancel" onClick={() => setRenameModal({ open: false, img: null, newName: '', clickPos: null })}>Cancel</button>
          <button className="admin-db-modal__btn-save" onClick={handleRename}>Save</button>
        </div>
      </MorphModal>

      <MorphModal
        isOpen={deleteModal.open && !!deleteModal.img}
        onClose={() => setDeleteModal({ open: false, img: null, clickPos: null })}
        clickPos={deleteModal.clickPos}
        overlayClass="admin-db-modal-overlay"
        modalClass="admin-db-modal admin-db-modal--small"
      >
        <div className="admin-db-modal__header">
          <h2>Confirm Deletion</h2>
          <button className="admin-db-modal__close" onClick={() => setDeleteModal({ open: false, img: null, clickPos: null })}>&times;</button>
        </div>
        <div className="admin-db-modal__content">
          <p className="admin-db-modal__confirm-text">
            Are you sure you want to delete <strong>{deleteModal.img?.name}</strong>?
            This action cannot be undone.
          </p>
        </div>
        <div className="admin-db-modal__footer admin-db-modal__footer--end">
          <button 
            className="admin-db-modal__btn-cancel" 
            onClick={() => setDeleteModal({ open: false, img: null, clickPos: null })}
          >
            Cancel
          </button>
          <button 
            className="admin-db-modal__btn-save admin-btn--danger" 
            onClick={handleDelete}
          >
            Delete File
          </button>
        </div>
      </MorphModal>

      {/* View Preview Modal */}
      <MorphModal
        isOpen={previewModal.open && !!previewModal.img}
        onClose={() => setPreviewModal({ open: false, img: null, clickPos: null })}
        clickPos={previewModal.clickPos}
        overlayClass="admin-db-modal-overlay"
        modalClass="admin-db-modal admin-db-modal--preview"
      >
        <div className="admin-db-modal__header">
          <h2>Preview File</h2>
          <button className="admin-db-modal__close" onClick={() => setPreviewModal({ open: false, img: null, clickPos: null })}>&times;</button>
        </div>
        <div className="admin-db-modal__content admin-db-modal__content--preview">
          {previewModal.img?.folder === 'documents' ? (
            <div className="admin-db__empty-preview">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="admin-db__icon--medium">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <p className="admin-db__preview-filename">{previewModal.img.fileName}</p>
              <a href={previewModal.img.url} target="_blank" rel="noopener noreferrer" className="admin-db__preview-download">Download / Open</a>
            </div>
          ) : previewModal.img ? (
            <img 
              src={previewModal.img.url} 
              alt={previewModal.img.name} 
              className="admin-db__preview-img-full"
            />
          ) : null}
        </div>
      </MorphModal>
    </div>
  )
}

export default AdminDatabase
