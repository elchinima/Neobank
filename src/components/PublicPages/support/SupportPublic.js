import { useState } from 'react'

export function useSupportPublic() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('General Information')
  const [message, setMessage] = useState('')

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return

    // Just close the modal, no chat logic
    setIsModalOpen(false)
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
    message,
    setMessage,
    handleFormSubmit,
  }
}
