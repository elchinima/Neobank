import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import './LoansManage.scss'

const initialLoans = [
  { id: 1, owner: 'Иван Иванов', type: 'Потребительский', amount: '₼ 10,000.00', rate: '12%', monthly: '₼ 320.00', until: '01.2027', status: 'active' },
  { id: 2, owner: 'Нигяр Гасанова', type: 'Автокредит', amount: '₼ 25,000.00', rate: '9.5%', monthly: '₼ 520.00', until: '06.2028', status: 'active' },
  { id: 3, owner: 'Эмиль Алиев', type: 'Ипотека', amount: '₼ 80,000.00', rate: '7%', monthly: '₼ 680.00', until: '03.2044', status: 'pending' },
  { id: 4, owner: 'Лейла Гусейнова', type: 'Потребительский', amount: '₼ 5,000.00', rate: '14%', monthly: '₼ 180.00', until: '08.2025', status: 'pending' },
  { id: 5, owner: 'Рашад Исмайлов', type: 'Бизнес кредит', amount: '₼ 50,000.00', rate: '11%', monthly: '₼ 1,100.00', until: '12.2029', status: 'rejected' },
]

const statusLabel = {
  active: 'Активен',
  pending: 'На рассмотрении',
  rejected: 'Отклонён'
}

function LoansManage() {
  const [loans, setLoans] = useState(initialLoans)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = loans.filter(l => {
    const matchSearch = l.owner.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || l.status === filter
    return matchSearch && matchFilter
  })

  const approve = (id) => {
    setLoans(prev => prev.map(l =>
      l.id === id ? { ...l, status: 'active' } : l
    ))
  }

  const reject = (id) => {
    setLoans(prev => prev.map(l =>
      l.id === id ? { ...l, status: 'rejected' } : l
    ))
  }

  return (
    <AdminLayout title="Кредиты">
      <div className="loans-manage">
        <div className="loans-manage__header">
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Всего: {filtered.length} кредитов
          </p>
          <div className="loans-manage__search">
            <input
              type="text"
              placeholder="Поиск по владельцу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="pending">На рассмотрении</option>
              <option value="rejected">Отклонённые</option>
            </select>
          </div>
        </div>

        <div className="loans-manage__table">
          <table>
            <thead>
              <tr>
                <th>Владелец</th>
                <th>Тип</th>
                <th>Сумма</th>
                <th>Ставка</th>
                <th>Платёж/мес</th>
                <th>До</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.owner}</td>
                  <td>{loan.type}</td>
                  <td>{loan.amount}</td>
                  <td>{loan.rate}</td>
                  <td>{loan.monthly}</td>
                  <td>{loan.until}</td>
                  <td>
                    <span className={`loans-manage__status ${loan.status}`}>
                      {statusLabel[loan.status]}
                    </span>
                  </td>
                  <td>
                    <div className="loans-manage__actions">
                      {loan.status === 'pending' && (
                        <>
                          <button className="loans-manage__btn success" onClick={() => approve(loan.id)}>
                            ✅ Одобрить
                          </button>
                          <button className="loans-manage__btn danger" onClick={() => reject(loan.id)}>
                            ❌ Отклонить
                          </button>
                        </>
                      )}
                      {loan.status !== 'pending' && (
                        <button className="loans-manage__btn danger" onClick={() => reject(loan.id)}>
                          🗑 Удалить
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

export default LoansManage