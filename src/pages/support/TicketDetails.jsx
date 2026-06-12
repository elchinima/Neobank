import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import './TicketDetails.scss'

const tickets = [
  {
    id: 1,
    subject: 'Не могу войти в аккаунт',
    date: '11 июня',
    status: 'answered',
    messages: [
      { id: 1, from: 'user', name: 'Иван Иванов', text: 'Пытаюсь войти, но система говорит что пароль неверный. Я уверен что пароль правильный.', time: '11 июня, 10:23' },
      { id: 2, from: 'support', name: 'Поддержка', text: 'Здравствуйте! Попробуйте сбросить пароль через кнопку "Забыли пароль" на странице входа. Если проблема сохранится — напишите нам.', time: '11 июня, 11:05' },
      { id: 3, from: 'user', name: 'Иван Иванов', text: 'Спасибо, помогло! Пароль сбросил, теперь всё работает.', time: '11 июня, 11:30' },
    ]
  },
  {
    id: 2,
    subject: 'Перевод не дошёл',
    date: '9 июня',
    status: 'open',
    messages: [
      { id: 1, from: 'user', name: 'Иван Иванов', text: 'Сделал перевод 3 дня назад на сумму ₼ 200. Деньги списались с моего счёта, но получатель говорит что ничего не получил.', time: '9 июня, 14:15' },
    ]
  },
]

const statusLabel = {
  open: 'Открыт',
  answered: 'Отвечен',
  closed: 'Закрыт'
}

function TicketDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ticket = tickets.find(t => t.id === Number(id))

  if (!ticket) return (
    <Layout title="Обращение не найдено">
      <p>Обращение не существует</p>
    </Layout>
  )

  return (
    <Layout title={ticket.subject}>
      <div className="ticket-details">
        <button className="ticket-details__back" onClick={() => navigate('/support')}>
          ← Назад к обращениям
        </button>

        <div className="ticket-details__header">
          <div className="ticket-details__header-left">
            <h2>{ticket.subject}</h2>
            <p>Создано: {ticket.date}</p>
          </div>
          <span className={`ticket-details__header-status ${ticket.status}`}>
            {statusLabel[ticket.status]}
          </span>
        </div>

        <div className="ticket-details__messages">
          {ticket.messages.map((msg) => (
            <div className={`ticket-details__message ${msg.from}`} key={msg.id}>
              <div className={`ticket-details__message-avatar ${msg.from}`}>
                {msg.from === 'support' ? 'SP' : 'ИИ'}
              </div>
              <div className="ticket-details__message-content">
                <p className="ticket-details__message-name">{msg.name}</p>
                <div className="ticket-details__message-bubble">{msg.text}</div>
                <p className="ticket-details__message-time">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {ticket.status !== 'closed' && (
          <div className="ticket-details__reply">
            <textarea placeholder="Напишите ваш ответ..." />
            <button className="ticket-details__reply-btn">Отправить</button>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default TicketDetails