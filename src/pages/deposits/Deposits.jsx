import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import './Deposits.scss'

const deposits = [
  {
    id: 1,
    icon: '💰',
    type: 'Срочный депозит',
    amount: '₼ 8,000.00',
    rate: '7.5% годовых',
    opened: '01.03.2024',
    until: '01.03.2025',
    income: '₼ 600.00',
    status: 'active'
  },
  {
    id: 2,
    icon: '📈',
    type: 'Накопительный',
    amount: '₼ 3,500.00',
    rate: '5.0% годовых',
    opened: '15.06.2024',
    until: '15.06.2025',
    income: '₼ 175.00',
    status: 'active'
  },
  {
    id: 3,
    icon: '🏦',
    type: 'Валютный депозит',
    amount: '$ 1,000.00',
    rate: '3.5% годовых',
    opened: '10.01.2023',
    until: '10.01.2024',
    income: '$ 35.00',
    status: 'closed'
  },
]

function Deposits() {
  const navigate = useNavigate()

  return (
    <Layout title="Депозиты">
      <div className="deposits">
        <div className="deposits__header">
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Всего депозитов: {deposits.length}
          </p>
          <button className="deposits__btn" onClick={() => navigate('/deposits/create')}>
            + Открыть депозит
          </button>
        </div>

        <div className="deposits__grid">
          {deposits.map((dep) => (
            <div className="deposits__card" key={dep.id}>
              <div className="deposits__card-icon">{dep.icon}</div>
              <p className="deposits__card-type">{dep.type}</p>
              <p className="deposits__card-amount">{dep.amount}</p>

              <div className="deposits__card-row">
                <span>Открыт</span>
                <strong>{dep.opened}</strong>
              </div>
              <div className="deposits__card-row">
                <span>До</span>
                <strong>{dep.until}</strong>
              </div>
              <div className="deposits__card-row">
                <span>Доход</span>
                <strong>{dep.income}</strong>
              </div>

              <span className="deposits__card-rate">{dep.rate}</span>
              <span className={`deposits__card-status ${dep.status}`}>
                {dep.status === 'active' ? 'Активен' : 'Закрыт'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default Deposits