import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import './Accounts.scss'

const accounts = [
  { id: 1, type: 'Текущий счёт', balance: '₼ 12,450.00', number: '**** **** **** 4231', status: 'active', currency: 'AZN' },
  { id: 2, type: 'Сберегательный', balance: '₼ 8,000.00', number: '**** **** **** 7892', status: 'active', currency: 'AZN' },
  { id: 3, type: 'Валютный счёт', balance: '$ 2,300.00', number: '**** **** **** 1145', status: 'active', currency: 'USD' },
  { id: 4, type: 'Депозитный', balance: '₼ 5,000.00', number: '**** **** **** 3310', status: 'frozen', currency: 'AZN' },
]

function Accounts() {
  const navigate = useNavigate()

  return (
    <Layout title="Счета">
      <div className="accounts">
        <div className="accounts__header">
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Всего счетов: {accounts.length}
          </p>
          <button className="accounts__btn">+ Открыть счёт</button>
        </div>

        <div className="accounts__grid">
          {accounts.map((acc) => (
            <div
              className="accounts__card"
              key={acc.id}
              onClick={() => navigate(`/accounts/${acc.id}`)}
            >
              <p className="accounts__card-type">{acc.type}</p>
              <p className="accounts__card-balance">{acc.balance}</p>
              <p className="accounts__card-number">{acc.number}</p>
              <div className="accounts__card-footer">
                <span className={`accounts__card-status ${acc.status}`}>
                  {acc.status === 'active' ? 'Активен' : 'Заморожен'}
                </span>
                <span className="accounts__card-currency">{acc.currency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default Accounts