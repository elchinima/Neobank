import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import './Cards.scss'

const cards = [
  { id: 1, type: 'Visa Classic', number: '**** **** **** 4231', holder: 'Ivan Ivanov', expiry: '12/27', network: 'VISA', status: 'active', theme: 'dark' },
  { id: 2, type: 'Mastercard Gold', number: '**** **** **** 7892', holder: 'Ivan Ivanov', expiry: '08/26', network: 'MC', status: 'active', theme: 'gold' },
  { id: 3, type: 'Visa Platinum', number: '**** **** **** 1145', holder: 'Ivan Ivanov', expiry: '03/28', network: 'VISA', status: 'blocked', theme: 'slate' },
]

function Cards() {
  const navigate = useNavigate()

  return (
    <Layout title="Карты">
      <div className="cards">
        <div className="cards__header">
          <p style={{ color: '#6B7280', fontSize: '14px' }}>Всего карт: {cards.length}</p>
          <button className="cards__btn" onClick={() => navigate('/dashboard/cards/order')}>
            + Заказать карту
          </button>
        </div>

        <div className="cards__grid">
          {cards.map((card) => (
            <div className={`cards__card ${card.theme}`} key={card.id}>
              <span className={`cards__card-status ${card.status}`}>
                {card.status === 'active' ? 'Активна' : 'Заблокирована'}
              </span>
              <p className="cards__card-type">{card.type}</p>
              <div className="cards__card-chip"></div>
              <p className="cards__card-number">{card.number}</p>
              <div className="cards__card-footer">
                <div>
                  <p className="cards__card-holder">{card.holder}</p>
                  <p className="cards__card-expiry">{card.expiry}</p>
                </div>
                <span className="cards__card-network">{card.network}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default Cards
