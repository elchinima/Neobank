import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function useOrderCard(cardTypes) {
  const navigate = useNavigate()
  const [selected, setSelected] = useState('visa-classic')

  const selectedCard = cardTypes.find(c => c.id === selected)

  return {
    navigate,
    selected,
    setSelected,
    selectedCard,
  }
}
