import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import './AccountsManage.scss'

const initialAccounts = [
  { id: 1, owner: 'Иван Иванов', type: 'Текущий', number: '**** 4231', balance: '₼ 12,450.00', currency: 'AZN', status: 'active' },
  { id: 2, owner: 'Нигяр Гасанова', type: 'Сберегательный', number: '**** 7892', balance: '₼ 8,000.00', currency: 'AZN', status: 'active' },
  { id: 3, owner: 'Эмиль Алиев', type: 'Валютный', number: '**** 1145', balance: '$ 2,300.00', currency: 'USD', status: 'frozen' },
  { id: 4, owner: 'Лейла Гусейнова', type: 'Депозитный', number: '**** 3310', balance: '₼ 5,000.00', currency: 'AZN', status: 'active' },
  { id: 5, owner: 'Рашад Исмайлов', type: 'Текущий', number: '**** 9921', balance: '₼ 3,200.00', currency: 'AZN', status: 'active' },
  { id: 6, owner: 'Айсель Мамедова', type: 'Сберегательный', number: '**** 5544', balance: '₼ 1,500.00', currency: 'AZN', status: 'frozen' },
]

function AccountsManage() {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = accounts.filter(a => {
    const matchSearch = a.owner.toLowerCase().includes(search.toLowerCase()) ||
      a.number.includes(search)
    const matchFilter = filter === 'all' || a.status === filter
    return matchSearch && matchFilter
  })

  const toggleStatus = (id) => {
    setAccounts(prev => prev.map(a =>
      a.id === id ? { ...a, status: a.status === 'active' ? 'frozen' : 'active' } : a
    ))
  }

  return (
    <AdminLayout title="Счета">
      <div className="accounts-manage">
        <div className="accounts-manage__header">
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Всего: {filtered.length} счетов
          </p>
          <div className="accounts-manage__search">
            <input
              type="text"
              placeholder="Поиск по владельцу или номеру..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="frozen">Замороженные</option>
            </select>
          </div>
        </div>

        <div className="accounts-manage__table">
          <table>
            <thead>
              <tr>
                <th>Владелец</th>
                <th>Тип</th>
                <th>Номер</th>
                <th>Баланс</th>
                <th>Валюта</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((acc) => (
                <tr key={acc.id}>
                  <td>{acc.owner}</td>
                  <td>{acc.type}</td>
                  <td>{acc.number}</td>
                  <td>{acc.balance}</td>
                  <td>{acc.currency}</td>
                  <td>
                    <span className={`accounts-manage__status ${acc.status}`}>
                      {acc.status === 'active' ? 'Активен' : 'Заморожен'}
                    </span>
                  </td>
                  <td>
                    <div className="accounts-manage__actions">
                      <button
                        className="accounts-manage__btn"
                        onClick={() => toggleStatus(acc.id)}
                      >
                        {acc.status === 'active' ? '❄️ Заморозить' : '✅ Активировать'}
                      </button>
                      <button className="accounts-manage__btn danger">🗑 Удалить</button>
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

export default AccountsManage