import { useState } from 'react'

export function useLoans(loanTypes) {
  const [selected, setSelected] = useState('personal')
  const [amount, setAmount] = useState(10000)
  const [term, setTerm] = useState(24)

  const selectedLoan = loanTypes.find((loanType) => loanType.id === selected)

  const baseRate = 9.9
  const dynamicRate = Number((baseRate + (Math.ceil(term / 12) - 1) * 2).toFixed(1))

  const years = term / 12
  const totalInterest = amount * (dynamicRate / 100) * years
  const totalAmount = amount + totalInterest
  const monthlyPayment = (totalAmount / term).toFixed(2)
  const total = totalAmount.toFixed(2)
  const overpayment = totalInterest.toFixed(2)

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
