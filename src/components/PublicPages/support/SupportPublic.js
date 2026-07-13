import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function useSupportPublic() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
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
