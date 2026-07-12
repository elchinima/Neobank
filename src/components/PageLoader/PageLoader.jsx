import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../app/context/AuthContext'
import loaderIcon from '../../assets/icons/loader.svg'
import './PageLoader.css'

export default function PageLoader() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)
  const location = useLocation()
  const { loading: authLoading } = useAuth()

  useEffect(() => {
    window.scrollTo(0, 0)
    let isMounted = true

    const isFullyLoaded = () => {

      if (authLoading) return false


      if (document.readyState !== 'complete') return false

      return true
    }

    const hideLoader = () => {
      if (!isMounted) return
      setFading(true)
      setTimeout(() => {
        if (isMounted) setVisible(false)
      }, 350)
    }

    setVisible(true)
    setFading(false)


    const interval = setInterval(() => {
      if (isFullyLoaded()) {
        clearInterval(interval)

        setTimeout(hideLoader, 250)
      }
    }, 50)


    const safetyTimeout = setTimeout(() => {
      clearInterval(interval)
      hideLoader()
    }, 3000)

    return () => {
      isMounted = false
      clearInterval(interval)
      clearTimeout(safetyTimeout)
    }
  }, [location.pathname, authLoading])

  if (!visible) return null

  return (
    <div className={`page-loader-overlay ${fading ? 'fade-out' : ''}`}>
      <div className="page-loader-content">
        <img src={loaderIcon} alt="Loading..." className="page-loader-spinner" />
      </div>
    </div>
  )
}
