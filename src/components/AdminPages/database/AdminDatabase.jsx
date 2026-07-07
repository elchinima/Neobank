import { useEffect, useMemo, useState, useRef } from 'react'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import './AdminDatabase.scss'

const AdminDatabase = () => {
  const [images, setImages] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  
  // Actions state
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [renameModal, setRenameModal] = useState({ open: false, img: null, newName: '' })
  
  const fileInputRef = useRef(null)

  const loadImages = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/admin/database/images`)
      if (!response.ok) throw new Error('Failed to load images')
      const data = await response.json()
      setImages(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadImages()
  }, [])

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const filteredImages = useMemo(() => {
    if (!search.trim()) return images
    const s = search.toLowerCase()
    return images.filter(img => 
      img.id.toLowerCase().includes(s) || 
      img.name.toLowerCase().includes(s)
    )
  }, [images, search])

  const resultLabel = useMemo(() => {
    if (loading) return 'Loading images'
    return `${filteredImages.length} image${filteredImages.length === 1 ? '' : 's'}`
  }, [loading, filteredImages.length])

  const openModal = () => {
    setIsModalOpen(true)
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
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Only PNG, JPG, JPEG, and WEBP images are allowed')
      return
    }
    
    setUploadFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!uploadName.trim()) {
      setError('Name is required')
      return
    }
    if (uploadName.length > 100) {
      setError('Name must not exceed 100 characters')
      return
    }
    if (!uploadFile) {
      setError('Please select an image')
      return
    }

    setUploading(true)
    setError('')
    
    const sanitizedName = uploadName.trim().replace(/\s+/g, '_').replace(/___/g, '_');

    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('name', sanitizedName)

    try {
      const response = await fetch(`${API_BASE_URL}/admin/database/images`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || 'Upload failed')
      }
      
      await loadImages()
      closeModal()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const toggleMenu = (e, id) => {
    e.stopPropagation()
    setActiveMenuId(activeMenuId === id ? null : id)
  }

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url)
    setActiveMenuId(null)
  }

  const handleDelete = async (fileName) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/database/images?fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const err = await response.text()
        throw new Error(err || 'Failed to delete')
      }
      await loadImages()
    } catch (err) {
      alert(err.message)
    } finally {
      setActiveMenuId(null)
    }
  }

  const openRenameModal = (img) => {
    setRenameModal({ open: true, img, newName: img.name })
    setActiveMenuId(null)
  }

  const handleRename = async () => {
    const { img, newName } = renameModal
    if (!newName.trim() || newName.trim() === img.name) {
      setRenameModal({ open: false, img: null, newName: '' })
      return
    }
    
    const sanitizedName = newName.trim().replace(/\s+/g, '_').replace(/___/g, '_');

    try {
      const response = await fetch(`${API_BASE_URL}/admin/database/images?fileName=${encodeURIComponent(img.fileName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: sanitizedName })
      })
      
      if (!response.ok) {
        const err = await response.text()
        throw new Error(err || 'Failed to rename')
      }
      await loadImages()
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
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button className="admin-db__add-btn" onClick={openModal}>
            Add Image
          </button>
        </div>
      </header>

      <section className="admin-db__table-card" aria-label="Images table">
        <div className="admin-db__table-meta">{resultLabel}</div>
        <div className="admin-db__table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Preview</th>
                <th>Name</th>
                <th>Upload Date</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {filteredImages.map((img) => (
                <tr key={img.id}>
                  <td>{img.id}</td>
                  <td>
                    <div className="admin-db__img-preview">
                       <img src={img.url} alt={img.name} />
                    </div>
                  </td>
                  <td>
                    <strong>{img.name}</strong>
                  </td>
                  <td>{new Date(img.uploadDate).toLocaleString()}</td>
                  <td className="admin-db__actions-cell">
                    <div className="admin-db__menu-container">
                      <button 
                        className="admin-db__dots" 
                        type="button" 
                        aria-label="Image actions"
                        onClick={(e) => toggleMenu(e, img.id)}
                      >
                        <span />
                        <span />
                        <span />
                      </button>
                      
                      {activeMenuId === img.id && (
                        <div className="admin-db__dropdown">
                          <button onClick={() => openRenameModal(img)}>Rename</button>
                          <button onClick={() => handleCopyUrl(img.url)}>Copy URL</button>
                          <button className="danger" onClick={() => handleDelete(img.fileName)}>Delete</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredImages.length && !loading && (
                <tr>
                  <td colSpan="5" className="admin-db__empty">No images found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="admin-db-modal-overlay" onClick={closeModal}>
          <div className="admin-db-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-db-modal__header">
              <h2>Add New Image</h2>
              <button className="admin-db-modal__close" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="admin-db-modal__content">
              {error && <div className="admin-db-modal__error">{error}</div>}
              
              <div className="admin-db-modal__field">
                <label>Image Name</label>
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

              <div 
                className="admin-db-modal__dropzone" 
                onDragOver={e => e.preventDefault()} 
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/png, image/jpeg, image/jpg, image/webp" 
                  hidden 
                />
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="admin-db-modal__preview-img" />
                ) : (
                  <p>Drag & drop image here or click to select<br/><span>Max 5MB (PNG, JPG, WEBP)</span></p>
                )}
              </div>
            </div>

            <div className="admin-db-modal__footer">
              <button className="admin-db-modal__btn-cancel" onClick={closeModal} disabled={uploading}>Cancel</button>
              <button className="admin-db-modal__btn-save" onClick={handleUpload} disabled={uploading || !uploadFile || !uploadName}>
                {uploading ? 'Uploading...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameModal.open && (
        <div className="admin-db-modal-overlay" onClick={() => setRenameModal({ open: false, img: null, newName: '' })}>
          <div className="admin-db-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="admin-db-modal__header">
              <h2>Rename Image</h2>
              <button className="admin-db-modal__close" onClick={() => setRenameModal({ open: false, img: null, newName: '' })}>&times;</button>
            </div>
            <div className="admin-db-modal__content">
              <div className="admin-db-modal__field">
                <label>New Image Name</label>
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
              <button className="admin-db-modal__btn-cancel" onClick={() => setRenameModal({ open: false, img: null, newName: '' })}>Cancel</button>
              <button className="admin-db-modal__btn-save" onClick={handleRename}>Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminDatabase
