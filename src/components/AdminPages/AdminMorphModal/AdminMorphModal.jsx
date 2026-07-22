import React, { useState, useEffect } from 'react'
import './AdminMorphModal.scss'

export default function AdminMorphModal({ 
  isOpen, 
  onClose, 
  clickPos, 
  children, 
  overlayClass = '', 
  modalClass = '' 
}) {
  const [closingModal, setClosingModal] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      setClosingModal(false)
    } else if (shouldRender) {
      setClosingModal(true)
      const timer = setTimeout(() => setShouldRender(false), 400)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!shouldRender) return null

  // Default to center if no clickPos provided
  const safeClickPos = clickPos || { x: window.innerWidth / 2, y: window.innerHeight / 2 }

  return (
    <div 
      className={`admin-morph-overlay ${overlayClass} ${closingModal ? 'closing' : ''}`}
      onClick={onClose}
    >
      <div 
        className={`admin-morph-modal ${modalClass} ${closingModal ? 'closing' : ''}`}
        onClick={e => e.stopPropagation()}
        style={{
          '--start-x': `${safeClickPos.x - window.innerWidth / 2}px`,
          '--start-y': `${safeClickPos.y - window.innerHeight / 2}px`
        }}
      >
        {children}
      </div>
    </div>
  )
}
