import { useState } from 'react'

export function useDeposits(depositTypes) {
  const [selected, setSelected] = useState('term')
  const [amount, setAmount] = useState(1000)
  const [term, setTerm] = useState(12)

  const selectedType = depositTypes.find((depositType) => depositType.id === selected)
  const income = (amount * (selectedType.rate / 100) * (term / 12)).toFixed(2)
  const total = (Number(amount) + Number(income)).toFixed(2)

  return {
    selected,
    setSelected,
    amount,
    setAmount,
    term,
    setTerm,
    selectedType,
    income,
    total,
  }
}
