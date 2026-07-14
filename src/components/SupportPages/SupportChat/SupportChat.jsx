import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import { supportChatLang } from './lang.js'
import ReactMarkdown from 'react-markdown'
import supportChatIcon from '../../../assets/icons/support_chat_icon.png'
import './SupportChat.scss'

function SupportChat() {
  const { t } = useLanguage()
  const { token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get initial message from location state if passed from the form
  const initialMessage = location.state?.message || ''
  const userName = location.state?.name || t(supportChatLang, 'defaultUser')
  const chatLanguage = location.state?.chatLanguage || 'az'

  const [agentName] = useState(() => {
    const names = ["Tural", "Leyla", "Rəşad", "Aygün", "Aysel", "Kamil"];
    return names[Math.floor(Math.random() * names.length)];
  });

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: t(supportChatLang, 'agentWelcome'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  
  const [inputValue, setInputValue] = useState('')
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [isAgentConnected, setIsAgentConnected] = useState(false)
  const messagesEndRef = useRef(null)

  // Delay agent connection appearance
  useEffect(() => {
    const connectionTimer = setTimeout(() => {
      setIsAgentConnected(true)
    }, 10000)

    return () => clearTimeout(connectionTimer)
  }, [])

  // Process initial message
  useEffect(() => {
    if (initialMessage) {
      const processInitial = async () => {
        const newUserMsg = {
          id: Date.now(),
          sender: 'user',
          text: initialMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, newUserMsg])
        setIsWaiting(true)
        setIsTyping(false)
        const typingTimer = setTimeout(() => setIsTyping(true), 10000)

        try {
          const history = [{ role: 'model', text: t(supportChatLang, 'agentWelcome') }]
          const headers = { 'Content-Type': 'application/json' }
          if (token) headers['Authorization'] = `Bearer ${token}`

          const res = await fetch(`${API_BASE_URL}/Support/chat`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ message: initialMessage, language: chatLanguage, history, agentName })
          })

          if (!res.ok) throw new Error('API error')
          const data = await res.json()
          
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            sender: 'agent',
            text: data.response,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }])
        } catch (err) {
          console.error(err)
          fallbackReply(t(supportChatLang, 'agentReply1'))
        } finally {
          clearTimeout(typingTimer)
          setIsWaiting(false)
          setIsTyping(false)
        }
      }
      processInitial()
    }
  }, [initialMessage, t])

  const fallbackReply = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      sender: 'agent',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || isTyping) return

    const userText = inputValue
    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, newMsg])
    setInputValue('')
    setIsWaiting(true)
    setIsTyping(false)
    const typingTimer = setTimeout(() => setIsTyping(true), 10000)

    try {
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }))

      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_BASE_URL}/Support/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: userText, language: chatLanguage, history, agentName })
      })

      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'agent',
        text: data.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } catch (err) {
      console.error(err)
      fallbackReply("Извините, сейчас мы испытываем высокую нагрузку. Оставьте сообщение, и мы свяжемся с вами.")
    } finally {
      clearTimeout(typingTimer)
      setIsWaiting(false)
      setIsTyping(false)
    }
  }

  return (
    <div className="support-chat-page">
      <div className="support-chat-container">
        <div className="support-chat-header">
          <div className="agent-info">
            <div className="agent-avatar">
              <span>NB</span>
              <div className="online-indicator"></div>
            </div>
            <div className="agent-details">
              <h2 className="agent-name-row">
                {isAgentConnected ? agentName : t(supportChatLang, 'connecting')}
                {isAgentConnected && <img src={supportChatIcon} alt="Support Agent" className="support-badge-icon" />}
              </h2>
              <p>{isAgentConnected ? t(supportChatLang, 'online') : t(supportChatLang, 'pleaseWait')}</p>
            </div>
          </div>
          <button className="close-chat-btn" onClick={() => setIsCloseModalOpen(true)}>
            {t(supportChatLang, 'close')}
          </button>
        </div>

        <div className="support-chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-wrapper ${msg.sender === 'user' ? 'message-right' : 'message-left'}`}>
              <div className="message-content">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
                <span className="message-time">{msg.time}</span>
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="message-wrapper message-left">
               <div className="message-content typing-indicator-wrapper">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="support-chat-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder={t(supportChatLang, 'inputPlaceholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            maxLength={1000}
            disabled={isWaiting || isTyping}
          />
          <button type="submit" className="send-btn" disabled={!inputValue.trim() || isWaiting || isTyping} aria-label={t(supportChatLang, 'send')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>

      {isCloseModalOpen && (
        <div className="support-chat-modal-overlay" onClick={() => setIsCloseModalOpen(false)}>
          <div className="support-chat-modal" onClick={e => e.stopPropagation()}>
            <h3>{t(supportChatLang, 'modalTitle')}</h3>
            <p>{t(supportChatLang, 'modalDesc')}</p>
            <div className="support-chat-modal-actions">
              <button className="cancel-btn" onClick={() => setIsCloseModalOpen(false)}>
                {t(supportChatLang, 'modalNo')}
              </button>
              <button className="confirm-btn" onClick={() => navigate('/support')}>
                {t(supportChatLang, 'modalYes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupportChat
