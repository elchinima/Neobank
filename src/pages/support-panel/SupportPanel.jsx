import { useState } from 'react'
import SupportLayout from '../../components/SupportLayout/SupportLayout'
import './SupportPanel.scss'

const initialTickets = [
  { id: 1, user: 'Иван Иванов', subject: 'Не могу войти в аккаунт', category: 'Авторизация', date: '11 июня', status: 'answered' },
  { id: 2, user: 'Нигяр Гасанова', subject: 'Перевод не дошёл', category: 'Переводы', date: '9 июня', status: 'open' },
  { id: 3, user: 'Эмиль Алиев', subject: 'Заблокировали карту', category: 'Карты', date: '5 июня', status: 'closed' },
  { id: 4, user: 'Лейла Гусейнова', subject: 'Вопрос по депозиту', category: 'Депозиты', date: '1 июня', status: 'closed' },
  { id: 5, user: 'Рашад Исмайлов', subject: 'Ошибка при переводе', category: 'Переводы', date: '14 июня', status: 'open' },
  { id: 6, user: 'Айсель Мамедова', subject: 'Не приходит SMS', category: 'Авторизация', date: '13 июня', status: 'open' },
]

const statusLabel = {
  open: 'Открыт',
  answered: 'Отвечен',
  closed: 'Закрыт'
}

function SupportPanel() {
  const [tickets, setTickets] = useState(initialTickets)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = tickets.filter(t => {
    const matchSearch = t.user.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || t.status === filter
    return matchSearch && matchFilter
  })

  const answer = (id) => {
    setTickets(prev => prev.map(t =>
      t.id === id ? { ...t, status: 'answered' } : t
    ))
  }

  const close = (id) => {
    setTickets(prev => prev.map(t =>
      t.id === id ? { ...t, status: 'closed' } : t
    ))
  }

  return (
    <SupportLayout title="Панель поддержки">
      <div className="support-panel">
        <div className="support-panel__header">
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Всего: {filtered.length} обращений
          </p>
          <div className="support-panel__search">
            <input
              type="text"
              placeholder="Поиск по пользователю или теме..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Все</option>
              <option value="open">Открытые</option>
              <option value="answered">Отвеченные</option>
              <option value="closed">Закрытые</option>
            </select>
          </div>
        </div>

        <div className="support-panel__table">
          <table>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Тема</th>
                <th>Категория</th>
                <th>Дата</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => (
                <tr key={ticket.id}>
                  <td>{ticket.user}</td>
                  <td>{ticket.subject}</td>
                  <td>{ticket.category}</td>
                  <td>{ticket.date}</td>
                  <td>
                    <span className={`support-panel__status ${ticket.status}`}>
                      {statusLabel[ticket.status]}
                    </span>
                  </td>
                  <td>
                    <div className="support-panel__actions">
                      {ticket.status === 'open' && (
                        <button className="support-panel__btn success" onClick={() => answer(ticket.id)}>
                          ✅ Ответить
                        </button>
                      )}
                      {ticket.status !== 'closed' && (
                        <button className="support-panel__btn danger" onClick={() => close(ticket.id)}>
                          🔒 Закрыть
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SupportLayout>
  )
}

export default SupportPanel
