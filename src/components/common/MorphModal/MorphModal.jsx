import React, { useState, useEffect } from 'react'
import './MorphModal.scss'

export default function MorphModal({ 
  isOpen, 
  onClose, 
  clickPos, 
  children, 
  overlayClass = '', 
  modalClass = '' 
}) {
  const [closingModal, setClosingModal] = useState(false)
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [currentPos, setCurrentPos] = useState(clickPos)
  const [cachedChildren, setCachedChildren] = useState(children)

  useEffect(() => {
    if (isOpen && children) {
      setCachedChildren(children)
    }
  }, [isOpen, children])

  useEffect(() => {
    if (isOpen && clickPos) {
      setCurrentPos(clickPos)
    }
  }, [isOpen, clickPos])

  useEffect(() => {
    const handleGlobalClick = (e) => {
      setCurrentPos({ x: e.clientX, y: e.clientY })
    }
    if (isOpen) {
      window.addEventListener('mousedown', handleGlobalClick, true)
    }
    return () => window.removeEventListener('mousedown', handleGlobalClick, true)
  }, [isOpen])

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
  const safeClickPos = currentPos || { x: window.innerWidth / 2, y: window.innerHeight / 2 }

  return (
    <div 
      className={`morph-overlay ${overlayClass} ${closingModal ? 'closing' : ''}`}
      onClick={onClose}
    >
      <div 
        className={`morph-modal ${modalClass} ${closingModal ? 'closing' : ''}`}
        onClick={e => e.stopPropagation()}
        style={{
          '--start-x': `${safeClickPos.x - window.innerWidth / 2}px`,
          '--start-y': `${safeClickPos.y - window.innerHeight / 2}px`
        }}
      >
        {cachedChildren}
      </div>
    </div>
  )
}
