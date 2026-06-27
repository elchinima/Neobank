import { useOrderCard } from './OrderCard.js'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import './OrderCard.scss'

const cardTypes = [
  { id: 'visa-classic', name: 'Visa Classic', icon: '💳', price: 'Бесплатно', theme: 'dark', network: 'VISA' },
  { id: 'visa-platinum', name: 'Visa Platinum', icon: '💎', price: '₼ 15/год', theme: 'slate', network: 'VISA' },
  { id: 'mc-gold', name: 'Mastercard Gold', icon: '⭐', price: '₼ 10/год', theme: 'gold', network: 'MC' },
  { id: 'mc-world', name: 'Mastercard World', icon: '🌍', price: '₼ 20/год', theme: 'dark', network: 'MC' },
]

function OrderCard() {
  const {
    selected,
    setSelected,
    selectedCard,
  } = useOrderCard(cardTypes)

  return (
    <Layout title="Заказать карту">
      <div className="order-card">
        <div className="order-card__form">
          <p className="order-card__form-title">Выберите тип карты</p>

          <div className="order-card__group">
            <label>Привязать к счёту</label>
            <select>
              <option>Текущий счёт — ₼ 12,450.00</option>
              <option>Сберегательный — ₼ 8,000.00</option>
              <option>Валютный счёт — $ 2,300.00</option>
            </select>
          </div>

          <div className="order-card__group">
            <label>Тип карты</label>
            <div className="order-card__types">
              {cardTypes.map((card) => (
                <div
                  key={card.id}
                  className={`order-card__type ${selected === card.id ? 'selected' : ''}`}
                  onClick={() => setSelected(card.id)}
                >
                  <div className="order-card__type-icon">{card.icon}</div>
                  <p className="order-card__type-name">{card.name}</p>
                  <p className="order-card__type-price">{card.price}</p>
                </div>
              ))}
            </div>
          </div>

          <button className="order-card__btn">Заказать карту</button>
        </div>

        <div className="order-card__preview">
          <div>
            <p className="order-card__preview-title">Предпросмотр карты</p>
            <p className="order-card__preview-sub">Так будет выглядеть ваша карта</p>
          </div>

          <div className={`order-card__card ${selectedCard.theme}`}>
            <p className="order-card__card-type">{selectedCard.name}</p>
            <div className="order-card__card-chip"></div>
            <p className="order-card__card-number">**** **** **** ****</p>
            <div className="order-card__card-footer">
              <span className="order-card__card-holder">Ivan Ivanov</span>
              <span className="order-card__card-network">{selectedCard.network}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default OrderCard