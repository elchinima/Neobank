import Layout from '../../components/Layout/Layout'
import './Dashboard.scss'

const stats = [
  { icon: '🏦', label: 'Общий баланс', value: '₼ 12,450.00', sub: '+2.4% за месяц' },
  { icon: '💳', label: 'Активных карт', value: '3', sub: 'Visa, Mastercard' },
  { icon: '📋', label: 'Кредиты', value: '₼ 5,200.00', sub: 'Осталось выплатить' },
  { icon: '💰', label: 'Депозиты', value: '₼ 8,000.00', sub: '7.5% годовых' },
]

const transactions = [
  { icon: '🛒', name: 'Supermarket', date: '11 июня', amount: '-₼ 45.20', type: 'expense' },
  { icon: '💸', name: 'Перевод получен', date: '10 июня', amount: '+₼ 500.00', type: 'income' },
  { icon: '⛽', name: 'АЗС', date: '10 июня', amount: '-₼ 30.00', type: 'expense' },
  { icon: '🏧', name: 'Пополнение счёта', date: '9 июня', amount: '+₼ 1,200.00', type: 'income' },
  { icon: '🍕', name: 'Ресторан', date: '9 июня', amount: '-₼ 22.50', type: 'expense' },
]

const quickActions = [
  { icon: '↔', label: 'Перевод' },
  { icon: '💳', label: 'Пополнить карту' },
  { icon: '📋', label: 'Заявка на кредит' },
  { icon: '💰', label: 'Открыть депозит' },
]

function Dashboard() {
  return (
    <Layout title="Дашборд">
      <div className="dashboard">
        <div className="dashboard__stats">
          {stats.map((s) => (
            <div className="dashboard__stat-card" key={s.label}>
              <div className="dashboard__stat-card-icon">{s.icon}</div>
              <div className="dashboard__stat-card-label">{s.label}</div>
              <div className="dashboard__stat-card-value">{s.value}</div>
              <div className="dashboard__stat-card-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="dashboard__row">
          <div className="dashboard__card">
            <p className="dashboard__card-title">Последние транзакции</p>
            {transactions.map((t) => (
              <div className="dashboard__transaction" key={t.name + t.date}>
                <div className="dashboard__transaction-left">
                  <div className="dashboard__transaction-icon">{t.icon}</div>
                  <div>
                    <p className="dashboard__transaction-name">{t.name}</p>
                    <p className="dashboard__transaction-date">{t.date}</p>
                  </div>
                </div>
                <span className={`dashboard__transaction-amount ${t.type}`}>
                  {t.amount}
                </span>
              </div>
            ))}
          </div>

          <div className="dashboard__card">
            <p className="dashboard__card-title">Быстрые действия</p>
            <div className="dashboard__quick-actions">
              {quickActions.map((a) => (
                <button className="dashboard__quick-btn" key={a.label}>
                  <span>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard