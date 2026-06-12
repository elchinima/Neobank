import AdminLayout from '../../components/AdminLayout/AdminLayout'
import './AdminDashboard.scss'

const stats = [
  { icon: '👥', label: 'Пользователей', value: '1,248' },
  { icon: '🏦', label: 'Счетов', value: '3,412' },
  { icon: '💳', label: 'Карт', value: '2,891' },
  { icon: '📋', label: 'Активных кредитов', value: '342' },
]

const users = [
  { id: 1, name: 'Иван Иванов', email: 'ivan@mail.com', initials: 'ИИ', status: 'active' },
  { id: 2, name: 'Нигяр Гасанова', email: 'nigar@mail.com', initials: 'НГ', status: 'active' },
  { id: 3, name: 'Эмиль Алиев', email: 'emil@mail.com', initials: 'ЭА', status: 'frozen' },
  { id: 4, name: 'Лейла Гусейнова', email: 'leyla@mail.com', initials: 'ЛГ', status: 'active' },
  { id: 5, name: 'Рашад Исмайлов', email: 'rashad@mail.com', initials: 'РИ', status: 'frozen' },
]

const tickets = [
  { id: 1, subject: 'Не могу войти в аккаунт', user: 'Иван Иванов', status: 'answered' },
  { id: 2, subject: 'Перевод не дошёл', user: 'Нигяр Гасанова', status: 'open' },
  { id: 3, subject: 'Заблокировали карту', user: 'Эмиль Алиев', status: 'closed' },
  { id: 4, subject: 'Вопрос по депозиту', user: 'Лейла Гусейнова', status: 'closed' },
]

const statusLabel = {
  open: 'Открыт',
  answered: 'Отвечен',
  closed: 'Закрыт'
}

function AdminDashboard() {
  return (
    <AdminLayout title="Админ панель">
      <div className="admin">
        <div className="admin__stats">
          {stats.map((s) => (
            <div className="admin__stat" key={s.label}>
              <div className="admin__stat-icon">{s.icon}</div>
              <p className="admin__stat-label">{s.label}</p>
              <p className="admin__stat-value">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="admin__row">
          <div className="admin__card">
            <p className="admin__card-title">Последние пользователи</p>
            {users.map((user) => (
              <div className="admin__user" key={user.id}>
                <div className="admin__user-left">
                  <div className="admin__user-avatar">{user.initials}</div>
                  <div>
                    <p className="admin__user-name">{user.name}</p>
                    <p className="admin__user-email">{user.email}</p>
                  </div>
                </div>
                <span className={`admin__user-status ${user.status}`}>
                  {user.status === 'active' ? 'Активен' : 'Заморожен'}
                </span>
              </div>
            ))}
          </div>

          <div className="admin__card">
            <p className="admin__card-title">Последние обращения</p>
            {tickets.map((ticket) => (
              <div className="admin__ticket" key={ticket.id}>
                <div>
                  <p className="admin__ticket-subject">{ticket.subject}</p>
                  <p className="admin__ticket-user">{ticket.user}</p>
                </div>
                <span className={`admin__ticket-status ${ticket.status}`}>
                  {statusLabel[ticket.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard