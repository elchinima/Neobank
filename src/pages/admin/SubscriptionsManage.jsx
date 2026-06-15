import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import './SubscriptionsManage.scss'

const initialSubs = [
  { id: 1, owner: 'Иван Иванов', name: 'Spotify', type: 'Музыка', price: '₼ 4.99', period: 'месяц', next: '15.07.2026', status: 'active' },
  { id: 2, owner: 'Иван Иванов', name: 'Netflix', type: 'Видео', price: '₼ 9.99', period: 'месяц', next: '20.07.2026', status: 'active' },
  { id: 3, owner: 'Нигяр Гасанова', name: 'iCloud', type: 'Хранилище', price: '₼ 1.99', period: 'месяц', next: '01.07.2026', status: 'active' },
  { id: 4, owner: 'Эмиль Алиев', name: 'PlayStation Plus', type: 'Игры', price: '₼ 12.99', period: 'месяц', next: '-', status: 'cancelled' },
  { id: 5, owner: 'Лейла Гусейнова', name: 'Spotify', type: 'Музыка', price: '₼ 4.99', period: 'месяц', next: '10.07.2026', status: 'active' },
]

function SubscriptionsManage() {
  const [subs, setSubs] = useState(initialSubs)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = subs.filter(s => {
    const matchSearch = s.owner.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || s.status === filter
    return matchSearch && matchFilter
  })

  const cancel = (id) => {
    setSubs(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'cancelled' } : s
    ))
  }

  return (
    <AdminLayout title="Подписки">
      <div className="subscriptions-manage">
        <div className="subscriptions-manage__header">
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Всего: {filtered.length} подписок
          </p>
          <div className="subscriptions-manage__search">
            <input
              type="text"
              placeholder="Поиск по владельцу или сервису..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="cancelled">Отменённые</option>
            </select>
          </div>
        </div>

        <div className="subscriptions-manage__table">
          <table>
            <thead>
              <tr>
                <th>Владелец</th>
                <th>Сервис</th>
                <th>Категория</th>
                <th>Цена</th>
                <th>Следующий платёж</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => (
                <tr key={sub.id}>
                  <td>{sub.owner}</td>
                  <td>{sub.name}</td>
                  <td>{sub.type}</td>
                  <td>{sub.price}/{sub.period}</td>
                  <td>{sub.next}</td>
                  <td>
                    <span className={`subscriptions-manage__status ${sub.status}`}>
                      {sub.status === 'active' ? 'Активна' : 'Отменена'}
                    </span>
                  </td>
                  <td>
                    <div className="subscriptions-manage__actions">
                      {sub.status === 'active' && (
                        <button className="subscriptions-manage__btn danger" onClick={() => cancel(sub.id)}>
                          ❌ Отменить
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
    </AdminLayout>
  )
}

export default SubscriptionsManage