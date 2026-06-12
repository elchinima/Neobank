import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import './Support.scss'

const tickets = [
  {
    id: 1,
    subject: 'Не могу войти в аккаунт',
    preview: 'Пытаюсь войти, но система говорит что пароль неверный...',
    date: '11 июня',
    status: 'answered'
  },
  {
    id: 2,
    subject: 'Перевод не дошёл',
    preview: 'Сделал перевод 3 дня назад, деньги списались но не пришли...',
    date: '9 июня',
    status: 'open'
  },
  {
    id: 3,
    subject: 'Заблокировали карту',
    preview: 'Карта заблокирована без предупреждения, прошу разблокировать...',
    date: '5 июня',
    status: 'closed'
  },
  {
    id: 4,
    subject: 'Вопрос по депозиту',
    preview: 'Хочу узнать условия досрочного закрытия депозита...',
    date: '1 июня',
    status: 'closed'
  },
]

const statusLabel = {
  open: 'Открыт',
  answered: 'Отвечен',
  closed: 'Закрыт'
}

function Support() {
  const navigate = useNavigate()

  return (
    <Layout title="Поддержка">
      <div className="support">
        <div className="support__form">
          <p className="support__form-title">Новое обращение</p>

          <div className="support__group">
            <label>Категория</label>
            <select>
              <option>Проблема со входом</option>
              <option>Переводы и платежи</option>
              <option>Карты</option>
              <option>Кредиты</option>
              <option>Депозиты</option>
              <option>Другое</option>
            </select>
          </div>

          <div className="support__group">
            <label>Тема обращения</label>
            <input type="text" placeholder="Кратко опишите проблему" />
          </div>

          <div className="support__group">
            <label>Описание</label>
            <textarea placeholder="Подробно опишите вашу проблему..." />
          </div>

          <button className="support__btn">Отправить обращение</button>
        </div>

        <div className="support__tickets">
          <p className="support__tickets-title">Мои обращения</p>
          {tickets.map((ticket) => (
            <div
              className="support__ticket"
              key={ticket.id}
              onClick={() => navigate(`/support/${ticket.id}`)}
            >
              <div className="support__ticket-top">
                <p className="support__ticket-subject">{ticket.subject}</p>
                <span className={`support__ticket-status ${ticket.status}`}>
                  {statusLabel[ticket.status]}
                </span>
              </div>
              <p className="support__ticket-preview">{ticket.preview}</p>
              <p className="support__ticket-date">{ticket.date}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default Support