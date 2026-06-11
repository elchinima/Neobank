import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import './CreateDeposit.scss'

const depositTypes = [
  { id: 'term', icon: '💰', name: 'Срочный', rate: 7.5 },
  { id: 'savings', icon: '📈', name: 'Накопительный', rate: 5.0 },
  { id: 'currency', icon: '💵', name: 'Валютный', rate: 3.5 },
  { id: 'premium', icon: '⭐', name: 'Премиум', rate: 9.0 },
]

function CreateDeposit() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState('term')
  const [amount, setAmount] = useState(1000)
  const [term, setTerm] = useState(12)

  const selectedType = depositTypes.find(d => d.id === selected)
  const income = (amount * (selectedType.rate / 100) * (term / 12)).toFixed(2)
  const total = (Number(amount) + Number(income)).toFixed(2)

  return (
    <Layout title="Открыть депозит">
      <div className="create-deposit">
        <div className="create-deposit__form">
          <p className="create-deposit__form-title">Параметры депозита</p>

          <div className="create-deposit__group">
            <label>Тип депозита</label>
            <div className="create-deposit__types">
              {depositTypes.map((type) => (
                <div
                  key={type.id}
                  className={`create-deposit__type ${selected === type.id ? 'selected' : ''}`}
                  onClick={() => setSelected(type.id)}
                >
                  <div className="create-deposit__type-icon">{type.icon}</div>
                  <p className="create-deposit__type-name">{type.name}</p>
                  <p className="create-deposit__type-rate">{type.rate}% годовых</p>
                </div>
              ))}
            </div>
          </div>

          <div className="create-deposit__group">
            <label>Сумма (₼): {Number(amount).toLocaleString()}</label>
            <input
              type="range"
              min="100"
              max="50000"
              step="100"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          <div className="create-deposit__group">
            <label>Срок (месяцев): {term}</label>
            <input
              type="range"
              min="1"
              max="36"
              step="1"
              value={term}
              onChange={(e) => setTerm(Number(e.target.value))}
            />
          </div>

          <div className="create-deposit__group">
            <label>Пополнение со счёта</label>
            <select>
              <option>Текущий счёт — ₼ 12,450.00</option>
              <option>Сберегательный — ₼ 8,000.00</option>
            </select>
          </div>

          <button className="create-deposit__btn">Открыть депозит</button>
        </div>

        <div className="create-deposit__summary">
          <p className="create-deposit__summary-title">Расчёт дохода</p>

          <div className="create-deposit__summary-row">
            <span>Тип депозита</span>
            <strong>{selectedType.name}</strong>
          </div>
          <div className="create-deposit__summary-row">
            <span>Сумма</span>
            <strong>₼ {Number(amount).toLocaleString()}</strong>
          </div>
          <div className="create-deposit__summary-row">
            <span>Процентная ставка</span>
            <strong>{selectedType.rate}% годовых</strong>
          </div>
          <div className="create-deposit__summary-row">
            <span>Срок</span>
            <strong>{term} мес.</strong>
          </div>
          <div className="create-deposit__summary-row">
            <span>Доход</span>
            <strong>₼ {income}</strong>
          </div>

          <div className="create-deposit__summary-total">
            <span>Итого к получению</span>
            <strong>₼ {Number(total).toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CreateDeposit