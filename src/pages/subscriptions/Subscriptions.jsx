import Layout from '../../components/Layout/Layout'
import './Subscriptions.scss'

const subscriptions = [
  {
    id: 1,
    icon: '🎵',
    name: 'Spotify',
    type: 'Музыка',
    price: '₼ 4.99',
    period: 'в месяц',
    next: '15.07.2026',
    account: 'Текущий счёт',
    status: 'active'
  },
  {
    id: 2,
    icon: '🎬',
    name: 'Netflix',
    type: 'Видео',
    price: '₼ 9.99',
    period: 'в месяц',
    next: '20.07.2026',
    account: 'Текущий счёт',
    status: 'active'
  },
  {
    id: 3,
    icon: '☁️',
    name: 'iCloud',
    type: 'Хранилище',
    price: '₼ 1.99',
    period: 'в месяц',
    next: '01.07.2026',
    account: 'Текущий счёт',
    status: 'active'
  },
  {
    id: 4,
    icon: '🎮',
    name: 'PlayStation Plus',
    type: 'Игры',
    price: '₼ 12.99',
    period: 'в месяц',
    next: '-',
    account: '-',
    status: 'cancelled'
  },
]

function Subscriptions() {
  const active = subscriptions.filter(s => s.status === 'active')
  const totalMonthly = active.reduce((sum, s) => sum + parseFloat(s.price.replace('₼ ', '')), 0).toFixed(2)

  return (
    <Layout title="Подписки">
      <div className="subscriptions">
        <div className="subscriptions__header">
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Активных подписок: {active.length}
          </p>
          <button className="subscriptions__btn">+ Добавить подписку</button>
        </div>

        <div className="subscriptions__stats">
          <div className="subscriptions__stat">
            <p className="subscriptions__stat-label">Активных подписок</p>
            <p className="subscriptions__stat-value">{active.length}</p>
          </div>
          <div className="subscriptions__stat">
            <p className="subscriptions__stat-label">Расходы в месяц</p>
            <p className="subscriptions__stat-value">₼ {totalMonthly}</p>
          </div>
          <div className="subscriptions__stat">
            <p className="subscriptions__stat-label">Расходы в год</p>
            <p className="subscriptions__stat-value">₼ {(totalMonthly * 12).toFixed(2)}</p>
          </div>
        </div>

        <div className="subscriptions__grid">
          {subscriptions.map((sub) => (
            <div className="subscriptions__card" key={sub.id}>
              <div className="subscriptions__card-top">
                <span className="subscriptions__card-icon">{sub.icon}</span>
                <span className={`subscriptions__card-status ${sub.status}`}>
                  {sub.status === 'active' ? 'Активна' : 'Отменена'}
                </span>
              </div>

              <p className="subscriptions__card-name">{sub.name}</p>
              <p className="subscriptions__card-type">{sub.type}</p>
              <p className="subscriptions__card-price">
                {sub.price} <span>{sub.period}</span>
              </p>

              <div className="subscriptions__card-row">
                <p>Следующий платёж</p>
                <strong>{sub.next}</strong>
              </div>
              <div className="subscriptions__card-row">
                <p>Счёт списания</p>
                <strong>{sub.account}</strong>
              </div>

              {sub.status === 'active' && (
                <button className="subscriptions__card-cancel">Отменить подписку</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default Subscriptions