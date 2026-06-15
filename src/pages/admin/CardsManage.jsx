import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import './CardsManage.scss'

const initialCards = [
  { id: 1, owner: 'Иван Иванов', type: 'Visa Classic', number: '**** 4231', expiry: '12/27', status: 'active' },
  { id: 2, owner: 'Иван Иванов', type: 'Mastercard Gold', number: '**** 7892', expiry: '08/26', status: 'active' },
  { id: 3, owner: 'Нигяр Гасанова', type: 'Visa Platinum', number: '**** 1145', expiry: '03/28', status: 'blocked' },
  { id: 4, owner: 'Эмиль Алиев', type: 'Visa Classic', number: '**** 3310', expiry: '06/25', status: 'blocked' },
  { id: 5, owner: 'Лейла Гусейнова', type: 'Mastercard World', number: '**** 9921', expiry: '11/27', status: 'active' },
  { id: 6, owner: 'Рашад Исмайлов', type: 'Visa Classic', number: '**** 5544', expiry: '04/26', status: 'active' },
]

function CardsManage() {
  const [cards, setCards] = useState(initialCards)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = cards.filter(c => {
    const matchSearch = c.owner.toLowerCase().includes(search.toLowerCase()) ||
      c.number.includes(search)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const toggleStatus = (id) => {
    setCards(prev => prev.map(c =>
      c.id === id ? { ...c, status: c.status === 'active' ? 'blocked' : 'active' } : c
    ))
  }

  return (
    <AdminLayout title="Карты">
      <div className="cards-manage">
        <div className="cards-manage__header">
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Всего: {filtered.length} карт
          </p>
          <div className="cards-manage__search">
            <input
              type="text"
              placeholder="Поиск по владельцу или номеру..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="blocked">Заблокированные</option>
            </select>
          </div>
        </div>

        <div className="cards-manage__table">
          <table>
            <thead>
              <tr>
                <th>Владелец</th>
                <th>Тип карты</th>
                <th>Номер</th>
                <th>Срок</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((card) => (
                <tr key={card.id}>
                  <td>{card.owner}</td>
                  <td>{card.type}</td>
                  <td>{card.number}</td>
                  <td>{card.expiry}</td>
                  <td>
                    <span className={`cards-manage__status ${card.status}`}>
                      {card.status === 'active' ? 'Активна' : 'Заблокирована'}
                    </span>
                  </td>
                  <td>
                    <div className="cards-manage__actions">
                      <button
                        className="cards-manage__btn"
                        onClick={() => toggleStatus(card.id)}
                      >
                        {card.status === 'active' ? '🔒 Заблокировать' : '✅ Активировать'}
                      </button>
                      <button className="cards-manage__btn danger">🗑 Удалить</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

export default CardsManage