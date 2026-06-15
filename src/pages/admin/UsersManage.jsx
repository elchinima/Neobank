import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import './UsersManage.scss'

const initialUsers = [
  { id: 1, name: 'Иван Иванов', email: 'ivan@mail.com', initials: 'ИИ', role: 'User', joined: '15.01.2023', status: 'active' },
  { id: 2, name: 'Нигяр Гасанова', email: 'nigar@mail.com', initials: 'НГ', role: 'User', joined: '03.06.2023', status: 'active' },
  { id: 3, name: 'Эмиль Алиев', email: 'emil@mail.com', initials: 'ЭА', role: 'User', joined: '22.09.2023', status: 'frozen' },
  { id: 4, name: 'Лейла Гусейнова', email: 'leyla@mail.com', initials: 'ЛГ', role: 'User', joined: '10.11.2022', status: 'active' },
  { id: 5, name: 'Рашад Исмайлов', email: 'rashad@mail.com', initials: 'РИ', role: 'Admin', joined: '01.03.2022', status: 'active' },
  { id: 6, name: 'Айсель Мамедова', email: 'aysel@mail.com', initials: 'АМ', role: 'User', joined: '14.07.2024', status: 'frozen' },
]

function UsersManage() {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.status === filter
    return matchSearch && matchFilter
  })

  const toggleStatus = (id) => {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, status: u.status === 'active' ? 'frozen' : 'active' } : u
    ))
  }

  return (
    <AdminLayout title="Пользователи">
      <div className="users-manage">
        <div className="users-manage__header">
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Всего: {filtered.length} пользователей
          </p>
          <div className="users-manage__search">
            <input
              type="text"
              placeholder="Поиск по имени или email..."
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

        <div className="users-manage__table">
          <table>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Роль</th>
                <th>Дата регистрации</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="users-manage__user">
                      <div className="users-manage__user-avatar">{user.initials}</div>
                      <div>
                        <p className="users-manage__user-name">{user.name}</p>
                        <p className="users-manage__user-email">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{user.role}</td>
                  <td>{user.joined}</td>
                  <td>
                    <span className={`users-manage__status ${user.status}`}>
                      {user.status === 'active' ? 'Активен' : 'Заморожен'}
                    </span>
                  </td>
                  <td>
                    <div className="users-manage__actions">
                      <button
                        className="users-manage__btn"
                        onClick={() => toggleStatus(user.id)}
                      >
                        {user.status === 'active' ? '❄️ Заморозить' : '✅ Активировать'}
                      </button>
                      <button className="users-manage__btn danger">🗑 Удалить</button>
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

export default UsersManage