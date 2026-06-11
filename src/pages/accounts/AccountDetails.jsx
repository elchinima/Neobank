import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import './AccountDetails.scss'

const accounts = [
  { id: 1, type: 'Текущий счёт', balance: '₼ 12,450.00', number: '**** **** **** 4231', status: 'active', currency: 'AZN', opened: '15.01.2023', iban: 'AZ21 NABZ 0000 0000 1370 1000 1944' },
  { id: 2, type: 'Сберегательный', balance: '₼ 8,000.00', number: '**** **** **** 7892', status: 'active', currency: 'AZN', opened: '03.06.2023', iban: 'AZ21 NABZ 0000 0000 1370 1000 7892' },
  { id: 3, type: 'Валютный счёт', balance: '$ 2,300.00', number: '**** **** **** 1145', status: 'active', currency: 'USD', opened: '22.09.2023', iban: 'AZ21 NABZ 0000 0000 1370 1000 1145' },
  { id: 4, type: 'Депозитный', balance: '₼ 5,000.00', number: '**** **** **** 3310', status: 'frozen', currency: 'AZN', opened: '10.11.2022', iban: 'AZ21 NABZ 0000 0000 1370 1000 3310' },
]

const transactions = [
  { icon: '🛒', name: 'Supermarket', date: '11 июня', amount: '-₼ 45.20', type: 'expense' },
  { icon: '💸', name: 'Перевод получен', date: '10 июня', amount: '+₼ 500.00', type: 'income' },
  { icon: '⛽', name: 'АЗС', date: '10 июня', amount: '-₼ 30.00', type: 'expense' },
  { icon: '🏧', name: 'Пополнение счёта', date: '9 июня', amount: '+₼ 1,200.00', type: 'income' },
]

function AccountDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const account = accounts.find(a => a.id === Number(id))

  if (!account) return (
    <Layout title="Счёт не найден">
      <p>Счёт не существует</p>
    </Layout>
  )

  return (
    <Layout title={account.type}>
      <div className="account-details">
        <button className="account-details__back" onClick={() => navigate('/accounts')}>
          ← Назад к счетам
        </button>

        <div className="account-details__top">
          <div className="account-details__card">
            <p className="account-details__card-type">{account.type}</p>
            <p className="account-details__card-balance">{account.balance}</p>
            <div className="account-details__card-chip"></div>
            <p className="account-details__card-number">{account.number}</p>
            <div className="account-details__card-footer">
              <span>NeoBank</span>
              <strong>{account.currency}</strong>
            </div>
          </div>

          <div className="account-details__info">
            <p className="account-details__info-title">Информация о счёте</p>
            <div className="account-details__info-grid">
              <div className="account-details__info-item">
                <label>Тип счёта</label>
                <span>{account.type}</span>
              </div>
              <div className="account-details__info-item">
                <label>Статус</label>
                <span>{account.status === 'active' ? 'Активен' : 'Заморожен'}</span>
              </div>
              <div className="account-details__info-item">
                <label>Валюта</label>
                <span>{account.currency}</span>
              </div>
              <div className="account-details__info-item">
                <label>Дата открытия</label>
                <span>{account.opened}</span>
              </div>
              <div className="account-details__info-item" style={{ gridColumn: 'span 2' }}>
                <label>IBAN</label>
                <span>{account.iban}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="account-details__actions">
          <button className="account-details__action-btn primary">↔ Перевод</button>
          <button className="account-details__action-btn">📄 Выписка</button>
          <button className="account-details__action-btn">❄️ Заморозить</button>
          <button className="account-details__action-btn">✏️ Переименовать</button>
        </div>

        <div className="account-details__transactions">
          <p className="account-details__transactions-title">История транзакций</p>
          {transactions.map((t) => (
            <div className="account-details__transaction" key={t.name + t.date}>
              <div className="account-details__transaction-left">
                <div className="account-details__transaction-icon">{t.icon}</div>
                <div>
                  <p className="account-details__transaction-name">{t.name}</p>
                  <p className="account-details__transaction-date">{t.date}</p>
                </div>
              </div>
              <span className={`account-details__transaction-amount ${t.type}`}>
                {t.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default AccountDetails