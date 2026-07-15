import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/context/AuthContext'

import { API_BASE_URL } from '../../../app/hooks/usePublicContent'

export function useSupportPublic() {
  const { isAuthenticated, user, token } = useAuth()
  const [hasActiveChat, setHasActiveChat] = useState(false)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.firstName) {
        setName(user.firstName)
      } else if (user.name) {
        setName(user.name.split(' ')[0])
      }
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (isAuthenticated && token) {
      fetch(`${API_BASE_URL}/Support/chat/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.hasActiveChat) setHasActiveChat(true)
      })
      .catch(console.error)
    }
  }, [isAuthenticated, token])

  const [category, setCategory] = useState('General Information')
  const [chatLanguage, setChatLanguage] = useState('az')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return

    setIsModalOpen(false)
    navigate('/support/chat', { state: { name, category, chatLanguage, message } })
    
    setName('')
    setMessage('')
  }

  const handleOpenChat = () => {
    navigate('/support/chat')
  }

  return {
    isModalOpen,
    setIsModalOpen,
    name,
    setName,
    category,
    setCategory,
    chatLanguage,
    setChatLanguage,
    message,
    setMessage,
    handleFormSubmit,
    hasActiveChat,
    handleOpenChat,
  }
}
