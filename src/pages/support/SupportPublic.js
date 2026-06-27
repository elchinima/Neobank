import { useState, useEffect, useRef } from 'react'

export function useSupportPublic() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [shouldScrollToChat, setShouldScrollToChat] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('General Information')
  const [message, setMessage] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)

  const messagesContainerRef = useRef(null)
  const chatSectionRef = useRef(null)

  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages, isTyping])

  useEffect(() => {
    if (!isModalOpen && shouldScrollToChat && chatSectionRef.current) {
      requestAnimationFrame(() => {
        chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setShouldScrollToChat(false)
      })
    }
  }, [isModalOpen, shouldScrollToChat])

  const handleFormSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return

    const initialMsgs = [
      {
        id: 1,
        sender: 'system',
        text: `Support session started for ${name}. Category: ${category}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 2,
        sender: 'user',
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]

    setMessages(initialMsgs)
    setIsModalOpen(false)
    setIsChatOpen(true)
    setIsTyping(true)
    setShouldScrollToChat(true)

    setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'support',
          text: `Hello ${name}! Thanks for reaching out regarding "${category}". Our team is online and I'm ready to assist you. What other questions do you have about NeoBank?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    }, 1800)
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, userMsg])
    const currentInput = chatInput
    setChatInput('')
    setIsTyping(true)

    setTimeout(() => {
      setIsTyping(false)
      let replyText = `Thanks for your message: "${currentInput}". Since this is a live simulation, our virtual assistant is demonstrating the response flow. In your personal dashboard, this would connect you to a live operator.`

      const lower = currentInput.toLowerCase()
      if (lower.includes('card') || lower.includes('карт')) {
        replyText = "Cards management is fully automated in NeoBank! You can freeze/unfreeze cards, view PIN codes, and configure spending limits inside your dashboard."
      } else if (lower.includes('loan') || lower.includes('кредит')) {
        replyText = "Need a loan? NeoBank offers competitive rates from 9.9% APR. You can calculate payments and submit an application instantly inside the 'Loans' section."
      } else if (lower.includes('deposit') || lower.includes('депозит')) {
        replyText = "NeoBank deposits let you earn up to 9% annual interest. You can choose a term, calculate your earnings, and open a deposit online."
      } else if (lower.includes('cashback') || lower.includes('кэшбэк') || lower.includes('кешбэк')) {
        replyText = "Earn up to 5% cashback on categories like supermarkets, fuel, and pharmacies. Check out our Cashback page for details!"
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'support',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    }, 1200)
  }

  return {
    isModalOpen,
    setIsModalOpen,
    isChatOpen,
    setIsChatOpen,
    shouldScrollToChat,
    setShouldScrollToChat,
    name,
    setName,
    category,
    setCategory,
    message,
    setMessage,
    chatInput,
    setChatInput,
    messages,
    setMessages,
    isTyping,
    setIsTyping,
    messagesContainerRef,
    chatSectionRef,
    handleFormSubmit,
    handleSendMessage,
  }
}
