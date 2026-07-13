import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../../../app/context/LanguageContext'
import { supportChatLang } from './lang.js'
import './SupportChat.scss'

function SupportChat() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Get initial message from location state if passed from the form
  const initialMessage = location.state?.message || ''
  const userName = location.state?.name || t(supportChatLang, 'defaultUser')

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
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (initialMessage) {
      const newUserMsg = {
        id: Date.now(),
        sender: 'user',
        text: initialMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, newUserMsg])
      
      // Simulate agent response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'agent',
          text: t(supportChatLang, 'agentReply1'),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }])
      }, 1500)
    }
  }, [initialMessage, t])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, newMsg])
    setInputValue('')

    // Simulate agent typing
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'agent',
        text: t(supportChatLang, 'agentReply2'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    }, 2000)
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
              <h2>{t(supportChatLang, 'supportTitle')}</h2>
              <p>{t(supportChatLang, 'online')}</p>
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
                <p>{msg.text}</p>
                <span className="message-time">{msg.time}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="support-chat-input" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder={t(supportChatLang, 'inputPlaceholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="send-btn" disabled={!inputValue.trim()} aria-label={t(supportChatLang, 'send')}>
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
