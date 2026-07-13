import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/context/AuthContext'

export function useSupportPublic() {
  const { isAuthenticated, user } = useAuth()
  
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
  }
}
