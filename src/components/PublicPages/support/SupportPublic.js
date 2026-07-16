import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/context/AuthContext'

import { API_BASE_URL } from '../../../app/hooks/usePublicContent'

export function useSupportPublic() {
  const { isAuthenticated, user, token, fetchWithAuth } = useAuth()
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
      fetchWithAuth(`${API_BASE_URL}/Support/chat/active`)
      .then(res => {
        if (res.status === 204) return false;
        if (res.ok) return res.text();
        return false;
      })
      .then(text => {
        if (text === false || !text) {
          setHasActiveChat(false);
          return;
        }
        try {
          const data = JSON.parse(text);
          if (typeof data === 'boolean') {
            setHasActiveChat(data);
          } else if (data && typeof data === 'object') {
            if (data.status && data.status.toLowerCase() === 'closed') {
              setHasActiveChat(false);
            } else {
              setHasActiveChat(true);
            }
          } else {
            setHasActiveChat(!!data);
          }
        } catch {
          if (text.toLowerCase() === 'false') setHasActiveChat(false);
          else if (text.toLowerCase() === 'true') setHasActiveChat(true);
          else setHasActiveChat(true);
        }
      })
      .catch(err => {
        console.error(err);
        setHasActiveChat(false);
      })
    }
  }, [isAuthenticated, token, fetchWithAuth])

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
