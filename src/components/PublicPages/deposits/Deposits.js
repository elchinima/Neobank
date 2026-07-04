import { useState } from 'react'

export function useDeposits(depositTypes) {
  const [selected, setSelected] = useState('term')
  const [amount, setAmount] = useState(1000)
  const [term, setTerm] = useState(12)

  const selectedType = depositTypes.find((depositType) => depositType.id === selected)

  let dynamicRate = 12
  if (term <= 18) {
    dynamicRate = 8
  } else if (term <= 24) {
    dynamicRate = 10
  }

  const income = (amount * (dynamicRate / 100) * (term / 12)).toFixed(2)
  const total = Math.floor(Number(amount) + Number(income))

  return {
    selected,
    setSelected,
    amount,
    setAmount,
    term,
    setTerm,
    selectedType,
    dynamicRate,
    income,
    total,
  }
}
