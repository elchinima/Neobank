import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import './Loans.scss'

const loans = [
  {
    id: 1,
    type: 'Потребительский кредит',
    amount: '₼ 10,000.00',
    remaining: '₼ 7,200.00',
    paid: '₼ 2,800.00',
    rate: '12% годовых',
    monthly: '₼ 320.00',
    until: '01.2027',
    progress: 28,
    status: 'active'
  },
  {
    id: 2,
    type: 'Автокредит',
    amount: '₼ 25,000.00',
    remaining: '₼ 18,500.00',
    paid: '₼ 6,500.00',
    rate: '9.5% годовых',
    monthly: '₼ 520.00',
    until: '06.2028',
    progress: 26,
    status: 'active'
  },
  {
    id: 3,
    type: 'Ипотека',
    amount: '₼ 80,000.00',
    remaining: '₼ 71,000.00',
    paid: '₼ 9,000.00',
    rate: '7% годовых',
    monthly: '₼ 680.00',
    until: '03.2044',
    progress: 11,
    status: 'pending'
  },
]

function Loans() {
  const navigate = useNavigate()

  return (
    <Layout title="Кредиты">
      <div className="loans">
        <div className="loans__header">
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Активных кредитов: {loans.length}
          </p>
          <button className="loans__btn" onClick={() => navigate('/loans/apply')}>
            + Подать заявку
          </button>
        </div>

        <div className="loans__grid">
          {loans.map((loan) => (
            <div className="loans__card" key={loan.id}>
              <p className="loans__card-type">{loan.type}</p>
              <p className="loans__card-amount">{loan.amount}</p>

              <div className="loans__card-row">
                <span>Остаток</span>
                <strong>{loan.remaining}</strong>
              </div>
              <div className="loans__card-row">
                <span>Ставка</span>
                <strong>{loan.rate}</strong>
              </div>
              <div className="loans__card-row">
                <span>Ежемесячный платёж</span>
                <strong>{loan.monthly}</strong>
              </div>
              <div className="loans__card-row">
                <span>До</span>
                <strong>{loan.until}</strong>
              </div>

              <div className="loans__card-progress">
                <div className="loans__card-progress-label">
                  <span>Выплачено</span>
                  <span>{loan.progress}%</span>
                </div>
                <div className="loans__card-progress-bar">
                  <div
                    className="loans__card-progress-bar-fill"
                    style={{ width: `${loan.progress}%` }}
                  />
                </div>
              </div>

              <span className={`loans__card-status ${loan.status}`}>
                {loan.status === 'active' ? 'Активен' : loan.status === 'pending' ? 'На рассмотрении' : 'Отклонён'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default Loans