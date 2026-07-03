import { useState } from 'react'

export function useLoans(loanTypes) {
  const [selected, setSelected] = useState('personal')
  const [amount, setAmount] = useState(10000)
  const [term, setTerm] = useState(24)

  const selectedLoan = loanTypes.find((loanType) => loanType.id === selected)
  
  const baseRate = 9.9
  const dynamicRate = Number((baseRate + (Math.ceil(term / 12) - 1) * 2).toFixed(1))
  
  const monthlyRate = dynamicRate / 100 / 12
  const monthlyPayment = (
    (amount * monthlyRate) /
    (1 - Math.pow(1 + monthlyRate, -term))
  ).toFixed(2)
  const total = (Number(monthlyPayment) * term).toFixed(2)
  const overpayment = (Number(total) - amount).toFixed(2)

  return {
    selected,
    setSelected,
    amount,
    setAmount,
    term,
    setTerm,
    selectedLoan,
    dynamicRate,
    monthlyPayment,
    total,
    overpayment,
  }
}
