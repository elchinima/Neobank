import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout/Layout'
import './ApplyLoan.scss'

function ApplyLoan() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState(5000)
  const [term, setTerm] = useState(12)
  const rate = 12

  const monthly = ((amount * (rate / 100 / 12)) / (1 - Math.pow(1 + rate / 100 / 12, -term))).toFixed(2)
  const total = (monthly * term).toFixed(2)
  const overpayment = (total - amount).toFixed(2)

  return (
    <Layout title="Заявка на кредит">
      <div className="apply-loan">
        <div className="apply-loan__form">
          <p className="apply-loan__form-title">Параметры кредита</p>

          <div className="apply-loan__group">
            <label>Тип кредита</label>
            <select>
              <option>Потребительский</option>
              <option>Автокредит</option>
              <option>Ипотека</option>
              <option>Бизнес кредит</option>
            </select>
          </div>

          <div className="apply-loan__group">
            <label>Сумма кредита (₼): {amount.toLocaleString()}</label>
            <input
              type="range"
              min="500"
              max="50000"
              step="500"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          <div className="apply-loan__group">
            <label>Срок (месяцев): {term}</label>
            <input
              type="range"
              min="3"
              max="84"
              step="3"
              value={term}
              onChange={(e) => setTerm(Number(e.target.value))}
            />
          </div>

          <div className="apply-loan__group">
            <label>Цель кредита</label>
            <input type="text" placeholder="Опишите цель кредита" />
          </div>

          <div className="apply-loan__group">
            <label>Место работы</label>
            <input type="text" placeholder="Название компании" />
          </div>

          <div className="apply-loan__group">
            <label>Ежемесячный доход (₼)</label>
            <input type="number" placeholder="0.00" />
          </div>

          <button className="apply-loan__btn">Отправить заявку</button>
        </div>

        <div className="apply-loan__summary">
          <p className="apply-loan__summary-title">Расчёт кредита</p>

          <div className="apply-loan__summary-row">
            <span>Сумма кредита</span>
            <strong>₼ {Number(amount).toLocaleString()}</strong>
          </div>
          <div className="apply-loan__summary-row">
            <span>Процентная ставка</span>
            <strong>{rate}% годовых</strong>
          </div>
          <div className="apply-loan__summary-row">
            <span>Срок</span>
            <strong>{term} мес.</strong>
          </div>
          <div className="apply-loan__summary-row">
            <span>Ежемесячный платёж</span>
            <strong>₼ {monthly}</strong>
          </div>
          <div className="apply-loan__summary-row">
            <span>Переплата</span>
            <strong>₼ {overpayment}</strong>
          </div>

          <div className="apply-loan__summary-total">
            <span>Итого к выплате</span>
            <strong>₼ {Number(total).toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ApplyLoan