import Layout from '../../components/Layout/Layout'
import './Transfers.scss'

const history = [
  { icon: '👤', name: 'Али Мамедов', date: '11 июня', amount: '-₼ 150.00' },
  { icon: '👤', name: 'Нигяр Гасанова', date: '10 июня', amount: '-₼ 80.00' },
  { icon: '👤', name: 'Эмиль Алиев', date: '9 июня', amount: '-₼ 200.00' },
  { icon: '👤', name: 'Лейла Гусейнова', date: '8 июня', amount: '-₼ 50.00' },
  { icon: '👤', name: 'Рашад Исмайлов', date: '7 июня', amount: '-₼ 320.00' },
]

function Transfers() {
  return (
    <Layout title="Переводы">
      <div className="transfers">
        <div className="transfers__form">
          <p className="transfers__form-title">Новый перевод</p>

          <div className="transfers__group">
            <label>Со счёта</label>
            <select>
              <option>Текущий счёт — ₼ 12,450.00</option>
              <option>Сберегательный — ₼ 8,000.00</option>
              <option>Валютный счёт — $ 2,300.00</option>
            </select>
          </div>

          <div className="transfers__group">
            <label>Номер счёта получателя</label>
            <input type="text" placeholder="AZ21 NABZ 0000 0000 0000 0000 0000" />
          </div>

          <div className="transfers__group">
            <label>Имя получателя</label>
            <input type="text" placeholder="Иван Иванов" />
          </div>

          <div className="transfers__group">
            <label>Сумма (₼)</label>
            <input type="number" placeholder="0.00" />
          </div>

          <div className="transfers__group">
            <label>Назначение платежа</label>
            <input type="text" placeholder="Необязательно" />
          </div>

          <button className="transfers__btn">Отправить перевод</button>
        </div>

        <div className="transfers__history">
          <p className="transfers__history-title">История переводов</p>
          {history.map((t) => (
            <div className="transfers__item" key={t.name + t.date}>
              <div className="transfers__item-left">
                <div className="transfers__item-icon">{t.icon}</div>
                <div>
                  <p className="transfers__item-name">{t.name}</p>
                  <p className="transfers__item-date">{t.date}</p>
                </div>
              </div>
              <span className="transfers__item-amount">{t.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default Transfers