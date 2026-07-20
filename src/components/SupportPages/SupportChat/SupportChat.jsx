import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import { API_BASE_URL } from '../../../app/hooks/usePublicContent'
import { supportChatLang } from './lang.js'
import ReactMarkdown from 'react-markdown'
import supportChatIcon from '../../../assets/icons/support_chat_icon.png'
import loaderIcon from '../../../assets/icons/loader.svg'
import './SupportChat.scss'
import './SupportChat_Responsive.scss'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'

function SupportChat() {
  const { t } = useLanguage()
  const { token, fetchWithAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const initialMessage = location.state?.message || ''
  const userName = location.state?.name || t(supportChatLang, 'defaultUser')
  const [chatLanguage, setChatLanguage] = useState(location.state?.chatLanguage || 'az')

  const [agentName, setAgentName] = useState('');
  const [chatId, setChatId] = useState(null);

  const [messages, setMessages] = useState([])
  
  const [inputValue, setInputValue] = useState('')
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [isAgentConnected, setIsAgentConnected] = useState(false)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [errorModal, setErrorModal] = useState(null)
  
  const [chatStatus, setChatStatus] = useState('active') // 'active', 'warning', 'closed'
  const [rating, setRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false)
  const [selectedImageBase64, setSelectedImageBase64] = useState(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef(null)

  const messagesEndRef = useRef(null)
  const inactivityTimerRef = useRef(null)
  const closeTimerRef = useRef(null)
  const connectionRef = useRef(null)
  const typingTimerRef = useRef(null)

  // Initialize SignalR Connection
  useEffect(() => {
    if (!token) return

    const hubUrl = `${API_BASE_URL.replace('/api', '')}/api/supportHub`
    const newConnection = new HubConnectionBuilder()
      .withUrl(`${hubUrl}?access_token=${token}`)
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build()

    newConnection.on('ReceiveHistory', (historyMessages) => {
      if (historyMessages && historyMessages.length > 0) {
        setMessages(historyMessages)
        const lastMsg = historyMessages[historyMessages.length - 1]
        if (lastMsg && lastMsg.sender === 'user') {
          setIsWaiting(true)
          setIsTyping(false)
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
          typingTimerRef.current = setTimeout(() => setIsTyping(true), 10000)
        }
      } else {
        // First time
        setMessages([
          {
            id: 1,
            sender: 'agent',
            text: t(supportChatLang, 'agentWelcome'),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ])
      }
    })

    newConnection.on('ChatJoined', (data) => {
      if (data && data.chatId) {
        setChatId(data.chatId)
      }
      if (data && data.agentName) {
        setAgentName(data.agentName)
      }
      if (data && data.language) {
        setChatLanguage(data.language)
      }
      if (data && data.status) {
        setChatStatus(data.status.toLowerCase())
        if (data.hasReview) {
          setIsFeedbackSubmitted(true)
        }
      } else {
        setChatStatus('active')
      }
    })

    newConnection.on('ReceiveMessage', (msg) => {
      setMessages(prev => [...prev, msg])
      setIsWaiting(false)
      setIsTyping(false)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)

      if (msg.shouldClose) {
        setTimeout(() => {
          setChatStatus('closed')
        }, 2000)
      }
    })

    newConnection.on('MessageConfirmed', (msg) => {
       // Optional: handle confirmation of sent message
    })

    newConnection.on('ChatError', (errorMsg) => {
      console.error(errorMsg)
      fallbackReply(errorMsg)
      setIsWaiting(false)
      setIsTyping(false)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    })

    newConnection.start()
      .then(() => {
        setIsAgentConnected(true)
         if (initialMessage) {
           newConnection.invoke('JoinChat', initialMessage, chatLanguage, null)
           // clear state so a refresh doesn't trigger initial message again
           window.history.replaceState({}, document.title)
           setIsWaiting(true)
           setIsTyping(false)
           if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
           typingTimerRef.current = setTimeout(() => setIsTyping(true), 10000)
        } else {
           newConnection.invoke('JoinChat', null, chatLanguage, null)
        }
      })
      .catch(console.error)

    connectionRef.current = newConnection

    return () => {
      newConnection.stop()
    }
  }, [token]) // Run once when token is ready

  // Inactivity timeout logic
  useEffect(() => {
    if (chatStatus === 'closed') return;
    
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.isWarning) {
       closeTimerRef.current = setTimeout(() => {
          setChatStatus('closed')
          if (connectionRef.current && connectionRef.current.state === 'Connected') {
            connectionRef.current.invoke('CloseChat')
          }
       }, 60000)
    } else {
       if (chatStatus === 'warning') setChatStatus('active');
       
       inactivityTimerRef.current = setTimeout(() => {
         setChatStatus('warning')
         setMessages(prev => [...prev, {
           id: Date.now() + Math.random(),
           sender: 'agent',
           isWarning: true,
           text: t(supportChatLang, 'inactivityWarning'),
           time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
         }])
       }, 300000) // 5 minutes
    }

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [messages, chatStatus, t])

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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setErrorModal('File size exceeds 10MB limit')
      return
    }

    setIsUploadingImage(true)
    const formData = new FormData()
    formData.append('file', file)
    if (chatId) {
      formData.append('chatId', chatId)
    }

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/Support/upload-image`, {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setSelectedImageBase64(data.imageBase64)
    } catch (err) {
      console.error(err)
      setErrorModal('Image upload failed')
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if ((!inputValue.trim() && !selectedImageBase64) || isTyping || isUploadingImage) return

    const userText = inputValue
    const imgBase64 = selectedImageBase64
    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      imageBase64: imgBase64,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, newMsg])
    setInputValue('')
    setSelectedImageBase64(null)
    setIsWaiting(true)
    setIsTyping(false)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => setIsTyping(true), 10000)

    try {
      if (connectionRef.current && connectionRef.current.state === 'Connected') {
        await connectionRef.current.invoke('SendMessage', userText, imgBase64, chatLanguage, agentName)
      } else {
        fallbackReply("Connection is not active. Please refresh.")
        setIsWaiting(false)
        setIsTyping(false)
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      }
    } catch (err) {
      console.error(err)
      fallbackReply("Извините, сейчас мы испытываем высокую нагрузку. Оставьте сообщение, и мы свяжемся с вами.")
      setIsWaiting(false)
      setIsTyping(false)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }

  return (
    <div className="support-chat-page">
      <div className="support-chat-container">
        <div className="support-chat-header">
          <div className="agent-info">
            <div className="agent-avatar">
              {isAgentConnected ? (
                <img src={supportChatIcon} alt="Agent Profile" className="support-badge-icon" />
              ) : (
                <span>NB</span>
              )}
              <div className="online-indicator"></div>
            </div>
            <div className="agent-details">
              <h2 className="agent-name-row">
                {isAgentConnected ? agentName : t(supportChatLang, 'connecting')}
              </h2>
              <p>{isAgentConnected ? t(supportChatLang, 'online') : t(supportChatLang, 'pleaseWait')}</p>
            </div>
          </div>
          
          {chatId && (
            <div className="support-chat-id" title={chatId}>
              ID: {chatId.substring(0, 8)}
            </div>
          )}

          <button className="close-chat-btn" onClick={() => setIsCloseModalOpen(true)} aria-label="Close">
            <span className="close-chat-btn__text">{t(supportChatLang, 'close')}</span>
            <span className="close-chat-btn__icon">&times;</span>
          </button>
        </div>

        <div className="support-chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-wrapper ${msg.sender === 'user' ? 'message-right' : 'message-left'}`}>
              <div className="message-content">
                {msg.imageBase64 && (
                  <img src={msg.imageBase64.startsWith('http') ? msg.imageBase64 : `data:image/webp;base64,${msg.imageBase64}`} alt="Uploaded" className="chat-msg-image" />
                )}
                {msg.text && <ReactMarkdown>{msg.text}</ReactMarkdown>}
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

        {chatStatus !== 'closed' ? (
          <div className="support-chat-input-wrapper">
            {selectedImageBase64 && (
              <div className="image-preview-container">
                <img src={selectedImageBase64.startsWith('http') ? selectedImageBase64 : `data:image/webp;base64,${selectedImageBase64}`} alt="Preview" />
                <button type="button" onClick={() => setSelectedImageBase64(null)}>×</button>
              </div>
            )}
            <form className="support-chat-input" onSubmit={handleSendMessage}>
              <button type="button" className="attach-btn" onClick={() => fileInputRef.current?.click()} disabled={isWaiting || isTyping || isUploadingImage}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="support-file-input--hidden"
                accept=".jpg,.jpeg,.png" 
                onChange={handleImageUpload} 
              />
              <input
                type="text"
                placeholder={isUploadingImage ? 'Uploading...' : t(supportChatLang, 'inputPlaceholder')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                maxLength={1000}
                disabled={isWaiting || isTyping || isUploadingImage}
              />
              <button type="submit" className="send-btn" disabled={(!inputValue.trim() && !selectedImageBase64) || isWaiting || isTyping || isUploadingImage} aria-label={t(supportChatLang, 'send')}>
                {isUploadingImage ? (
                  <img src={loaderIcon} alt="Uploading..." className="send-btn__loader" />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="support-chat-rating-container">
            {isFeedbackSubmitted ? (
              <p className="feedback-thanks">{t(supportChatLang, 'feedbackThanks')}</p>
            ) : (
              <>
                <p className="rate-title">{t(supportChatLang, 'rateService')}</p>
                <div className="stars-container">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`star-btn ${rating >= star ? 'active' : ''}`}
                      onClick={() => {
                        setRating(star)
                        if (star <= 3) {
                          setIsFeedbackModalOpen(true)
                        } else {
                          setIsFeedbackSubmitted(true)
                          if (connectionRef.current && connectionRef.current.state === 'Connected') {
                            connectionRef.current.invoke('SubmitReview', star, null)
                          }
                        }
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
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
              <button className="confirm-btn" onClick={() => {
                if (connectionRef.current && connectionRef.current.state === 'Connected') {
                  connectionRef.current.invoke('CloseChat')
                }
                navigate('/support')
              }}>
                {t(supportChatLang, 'modalYes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isFeedbackModalOpen && (
        <div className="support-chat-modal-overlay" onClick={() => setIsFeedbackModalOpen(false)}>
          <div className="support-chat-modal feedback-modal" onClick={e => e.stopPropagation()}>
            <h3>{t(supportChatLang, 'feedbackModalTitle')}</h3>
            <textarea
              className="feedback-textarea"
              placeholder={t(supportChatLang, 'feedbackPlaceholder')}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
            />
            <div className="support-chat-modal-actions">
              <button className="confirm-btn" onClick={() => {
                setIsFeedbackModalOpen(false)
                setIsFeedbackSubmitted(true)
                if (connectionRef.current && connectionRef.current.state === 'Connected') {
                  connectionRef.current.invoke('SubmitReview', rating, feedbackText)
                }
              }}>
                {t(supportChatLang, 'submitFeedback')}
              </button>
            </div>
          </div>
        </div>
      )}

      {errorModal && (
        <div className="support-chat-modal-overlay" onClick={() => setErrorModal(null)}>
          <div className="support-chat-modal" onClick={e => e.stopPropagation()}>
            <h3>{t(supportChatLang, 'error') || 'Error'}</h3>
            <p>{errorModal}</p>
            <div className="support-chat-modal-actions">
              <button className="confirm-btn" onClick={() => setErrorModal(null)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SupportChat
