import Layout from '../../components/Layout/Layout'
import './Cashback.scss'

const categories = [
  { icon: '🛒', name: 'Супермаркеты', rate: '3%', amount: '₼ 24.50' },
  { icon: '⛽', name: 'АЗС', rate: '5%', amount: '₼ 18.00' },
  { icon: '🍕', name: 'Рестораны', rate: '2%', amount: '₼ 12.30' },
  { icon: '✈️', name: 'Путешествия', rate: '7%', amount: '₼ 45.00' },
  { icon: '💊', name: 'Аптеки', rate: '4%', amount: '₼ 8.20' },
]

const history = [
  { icon: '🛒', name: 'Bravo Supermarket', date: '11 июня', amount: '+₼ 1.35' },
  { icon: '⛽', name: 'SOCAR АЗС', date: '10 июня', amount: '+₼ 1.50' },
  { icon: '🍕', name: 'Pizza House', date: '9 июня', amount: '+₼ 0.45' },
  { icon: '✈️', name: 'Buta Airways', date: '8 июня', amount: '+₼ 14.00' },
  { icon: '🛒', name: 'Bazarstore', date: '7 июня', amount: '+₼ 2.10' },
]

function Cashback() {
  return (
    <Layout title="Кэшбэк">
      <div className="cashback">
        <div className="cashback__stats">
          <div className="cashback__stat">
            <div className="cashback__stat-icon">🎁</div>
            <p className="cashback__stat-value">₼ 108.00</p>
            <p className="cashback__stat-label">Всего заработано</p>
          </div>
          <div className="cashback__stat">
            <div className="cashback__stat-icon">📅</div>
            <p className="cashback__stat-value">₼ 19.40</p>
            <p className="cashback__stat-label">За этот месяц</p>
          </div>
          <div className="cashback__stat">
            <div className="cashback__stat-icon">💳</div>
            <p className="cashback__stat-value">₼ 88.60</p>
            <p className="cashback__stat-label">Доступно к выводу</p>
          </div>
        </div>

        <div className="cashback__row">
          <div className="cashback__card">
            <p className="cashback__card-title">Категории кэшбэка</p>
            {categories.map((cat) => (
              <div className="cashback__category" key={cat.name}>
                <div className="cashback__category-left">
                  <div className="cashback__category-icon">{cat.icon}</div>
                  <div>
                    <p className="cashback__category-name">{cat.name}</p>
                    <p className="cashback__category-rate">{cat.rate} кэшбэк</p>
                  </div>
                </div>
                <span className="cashback__category-amount">{cat.amount}</span>
              </div>
            ))}
          </div>

          <div className="cashback__card">
            <p className="cashback__card-title">История начислений</p>
            {history.map((item) => (
              <div className="cashback__history-item" key={item.name + item.date}>
                <div className="cashback__history-item-left">
                  <div className="cashback__history-item-icon">{item.icon}</div>
                  <div>
                    <p className="cashback__history-item-name">{item.name}</p>
                    <p className="cashback__history-item-date">{item.date}</p>
                  </div>
                </div>
                <span className="cashback__history-item-amount">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Cashback