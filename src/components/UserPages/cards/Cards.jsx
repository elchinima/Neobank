import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import './Cards.scss'
import './Cards_Responsive.scss'
import loaderIcon from '../../../assets/icons/loader.svg'
import loaderSuccessIcon from '../../../assets/icons/loader-success.svg'

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx';
const stripePromise = loadStripe(stripePublicKey);

const StripeCheckoutForm = ({ onPaymentSuccess, onCancel, t, userCardsLang }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required'
    });

    if (submitError) {
      setError(submitError.message);
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onPaymentSuccess(paymentIntent.id);
    } else {
      setError("Payment failed");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      {error && <div className="error-message cards-page__modal-error-msg">{error}</div>}
      <PaymentElement />
      <div className="cards-page__stripe-actions">
        <button type="submit" disabled={!stripe || processing} className="cards-page__button cards-page__button--primary cards-page__stripe-btn">
          {processing ? t(userCardsLang, 'submitting') : t(userCardsLang, 'payNow')}
        </button>
        <button type="button" onClick={onCancel} className="cards-page__button cards-page__stripe-btn cards-page__stripe-btn--cancel">
          ✕
        </button>
      </div>
    </form>
  );
};
import standartCardMc from '../../../assets/images/standart_card_mc.png'
import premiumCardMc from '../../../assets/images/premium_card_mc.png'
import eliteCardMc from '../../../assets/images/elite_card_mc.png'
import standartCardVisa from '../../../assets/images/standart_card_visa.png'
import premiumCardVisa from '../../../assets/images/premium_card_visa.png'
import eliteCardVisa from '../../../assets/images/elite_card_visa.png'

const cardImages = {
  Standard: { Mastercard: standartCardMc, Visa: standartCardVisa },
  Premium: { Mastercard: premiumCardMc, Visa: premiumCardVisa },
  Elite: { Mastercard: eliteCardMc, Visa: eliteCardVisa }
}

import { useLanguage } from '../../../app/context/LanguageContext'
import { useAuth } from '../../../app/context/AuthContext'
import { userCardsLang } from './lang.js'

import blockIcon from '../../../assets/icons/User/settings/block.svg'
import limitIcon from '../../../assets/icons/User/settings/limit.svg'
import googlePayIcon from '../../../assets/icons/User/settings/google_pay.svg'
import cardDesignIcon from '../../../assets/icons/User/settings/card_design.svg'
import limitsIcon from '../../../assets/icons/User/settings/limits_icon.svg'
import pinIcon from '../../../assets/icons/User/settings/pin.svg'
import securityIcon from '../../../assets/icons/User/settings/security.svg'
import subscriptionsIcon from '../../../assets/icons/User/settings/subscriptions.svg'
import statementsIcon from '../../../assets/icons/User/settings/statements.svg'
import accountIcon from '../../../assets/icons/User/settings/account.svg'

import transferMyIcon from '../../../assets/icons/User/settings/transfer_my.svg'
import transferAnyIcon from '../../../assets/icons/User/settings/transfer_any.svg'
import transferForeignIcon from '../../../assets/icons/User/settings/transfer_foreign.svg'

import qrCodeIcon from '../../../assets/icons/User/settings/qr_code.svg'
import addProductIcon from '../../../assets/icons/User/settings/add_product.svg'

import vatBubbleIcon from '../../../assets/icons/User/vat_bubble.svg'
import shoppingBubbleIcon from '../../../assets/icons/User/shopping_bubble.svg'

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.port === '5173' ? 'http://localhost:5284/api' : '/api')



const AnimatedModal = ({ isOpen, onClose, origin, children, onOpenEnd }) => {
  const [render, setRender] = useState(false)
  const [phase, setPhase] = useState('closed') // 'closed', 'opening', 'open', 'closing'

  useEffect(() => {
    if (isOpen) {
      setRender(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase('opening')
        })
      })
    } else if (render && phase !== 'closed') {
      setPhase('closing')
    }
  }, [isOpen])

  const handleTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return
    if (phase === 'opening') {
      setPhase('open')
      if (onOpenEnd) onOpenEnd()
    } else if (phase === 'closing') {
      setPhase('closed')
      setRender(false)
    }
  }

  if (!render) return null

  const overlayClass = `card-modal-overlay card-modal-overlay--animated ${phase === 'opening' || phase === 'open' ? 'is-open' : ''} ${phase === 'closing' ? 'is-closing' : ''}`
  const modalClass = `card-modal card-modal--animated ${phase === 'opening' || phase === 'open' ? 'is-open' : ''} ${phase === 'closing' ? 'is-closing' : ''}`

  return (
    <div className={overlayClass} onClick={onClose}>
      <div 
        className={modalClass} 
        onClick={e => e.stopPropagation()}
        style={{
          '--origin-x': origin?.x ? `${origin.x}px` : '50%',
          '--origin-y': origin?.y ? `${origin.y}px` : '50%'
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {children}
      </div>
    </div>
  )
}

const Cards = () => {
  const { lang, t } = useLanguage()
  const { token, user, fetchWithAuth } = useAuth()
  const location = useLocation()

  const [cards, setCards] = useState([])
  const [loans, setLoans] = useState([])
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCardId, setActiveCardId] = useState(null)
  const [selectedSettingsCard, setSelectedSettingsCard] = useState(null)
  const [selectedTransferCard, setSelectedTransferCard] = useState(null)
  
  const [modalOrigin, setModalOrigin] = useState(null)
  const [lastActiveElement, setLastActiveElement] = useState(null)
  
  const handleCloseTransferModal = (setter) => {
    setter(false)
    if (lastActiveElement) lastActiveElement.focus()
  }

  const internalFormFirstInputRef = useRef(null)
  const neoBankFormFirstInputRef = useRef(null)
  const ibanFormFirstInputRef = useRef(null)

  const [showVatModal, setShowVatModal] = useState(false)
  const [showLimits, setShowLimits] = useState(false)
  const [showProductSelectionModal, setShowProductSelectionModal] = useState(false)
  const [showNewLoanModal, setShowNewLoanModal] = useState(false)
  const [showNewDepositModal, setShowNewDepositModal] = useState(false)
  const [newLoanForm, setNewLoanForm] = useState({ amount: '', termMonths: '3', targetCardId: '' })
  const [newDepositForm, setNewDepositForm] = useState({ amount: '', termMonths: '3', sourceCardId: '' })
  const [newLoanStatus, setNewLoanStatus] = useState('idle')
  const [newLoanError, setNewLoanError] = useState('')
  const [newDepositStatus, setNewDepositStatus] = useState('idle')
  const [newDepositError, setNewDepositError] = useState('')
  const [cashbackData, setCashbackData] = useState({ totalEarned: 0, categories: [] })
  const [variantSelected, setVariantSelected] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [variantAPreview, setVariantAPreview] = useState([])
  const [variantBPreview, setVariantBPreview] = useState([])
  const [selectingVariant, setSelectingVariant] = useState(false)
  const [variantError, setVariantError] = useState('')

  const fetchCashbackData = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/cashback`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        if (data.variantSelected === false) {
          setVariantSelected(false)
          setSelectedVariant(null)
          setVariantAPreview(data.variantACategories || [])
          setVariantBPreview(data.variantBCategories || [])
        } else {
          setVariantSelected(true)
          setSelectedVariant(data.selectedVariant)
          setCashbackData({ totalEarned: data.totalEarned || 0, categories: data.categories || [] })
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelectVariant = async (variant) => {
    setSelectingVariant(true)
    setVariantError('')
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/cashback/select-variant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ variant })
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.message === 'variantChangeCooldown') {
          setVariantError(t(userCardsLang, 'variantChangeCooldown').replace('{date}', data.nextChangeDate))
        } else {
          setVariantError(data.message || 'Error selecting variant')
        }
        return
      }
      await fetchCashbackData()
    } catch (err) {
      console.error(err)
      setVariantError('Network error')
    } finally {
      setSelectingVariant(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchCashbackData()
    }
  }, [token])

  const [isFooterVisible, setIsFooterVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting)
      },
      { root: null, threshold: 0.01 }
    )

    setTimeout(() => {
      const footer = document.querySelector('.public-footer')
      if (footer) {
        observer.observe(footer)
      }
    }, 500)

    return () => observer.disconnect()
  }, [])

  const [showInternalTransferModal, setShowInternalTransferModal] = useState(false)
  const [showUnavailableModal, setShowUnavailableModal] = useState(false)
  const [showAccountDetailsModal, setShowAccountDetailsModal] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const [internalTransferForm, setInternalTransferForm] = useState({ sourceCardId: '', destCardId: '', amount: '' })
  const [internalTransferStatus, setInternalTransferStatus] = useState('idle')
  const [internalTransferError, setInternalTransferError] = useState('')
  const [showNeoBankTransferModal, setShowNeoBankTransferModal] = useState(false)
  const [neoBankTransferForm, setNeoBankTransferForm] = useState({ sourceCardId: '', destCardNumber: '', amount: '' })
  const [neoBankTransferStatus, setNeoBankTransferStatus] = useState('idle')
  const [neoBankTransferError, setNeoBankTransferError] = useState('')
  const [showIbanTransferModal, setShowIbanTransferModal] = useState(false)
  const [ibanTransferForm, setIbanTransferForm] = useState({ sourceCardId: '', destIban: '', amount: '' })
  const [ibanTransferStatus, setIbanTransferStatus] = useState('idle')
  const [ibanTransferError, setIbanTransferError] = useState('')
  const [showNewCardModal, setShowNewCardModal] = useState(false)
  const [newCardForm, setNewCardForm] = useState({
    cardType: location.state?.orderCardType || 'Standard',
    network: 'Visa',
    paymentMethod: 'balance',
    sourceCardId: ''
  })
  const [newCardError, setNewCardError] = useState('')
  const [submittingCard, setSubmittingCard] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinForm, setPinForm] = useState({ oldPin: '', newPin: '', confirmNewPin: '' })
  const [pinStatus, setPinStatus] = useState('idle')
  const [pinError, setPinError] = useState('')
  const [showingCreditLimitMap, setShowingCreditLimitMap] = useState({})
  const [showPinAlertModal, setShowPinAlertModal] = useState(false)
  const [showPinSuccessModal, setShowPinSuccessModal] = useState(false)
  const [creditLimitError, setCreditLimitError] = useState(null)
  const [payingLoanId, setPayingLoanId] = useState(null)
  const [showPayLoanModal, setShowPayLoanModal] = useState(false)
  const [payLoanForm, setPayLoanForm] = useState({ loanId: null, sourceCardId: '' })
  const [payLoanStatus, setPayLoanStatus] = useState('idle')
  const [payLoanError, setPayLoanError] = useState('')

  const [showWithdrawDepositModal, setShowWithdrawDepositModal] = useState(false)
  const [withdrawDepositForm, setWithdrawDepositForm] = useState({ depositId: null, targetCardId: '' })
  const [withdrawDepositStatus, setWithdrawDepositStatus] = useState('idle')
  const [withdrawDepositError, setWithdrawDepositError] = useState('')
  const [withdrawingDepositId, setWithdrawingDepositId] = useState(null)
  const [withdrawingDepositExpired, setWithdrawingDepositExpired] = useState(false)

  const [showStatementsChoiceModal, setShowStatementsChoiceModal] = useState(false)
  const [showReferencesModal, setShowReferencesModal] = useState(false)
  const [showArayislarModal, setShowArayislarModal] = useState(false)
  
  const [showQrModal, setShowQrModal] = useState(false)
  const videoRef = React.useRef(null)

  useEffect(() => {
    let stream = null;
    if (showQrModal && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => console.error("Camera error:", err));
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showQrModal]);
  const [referencesForm, setReferencesForm] = useState({ cardId: 'all', period: '3', language: 'az' })
  const [arayislarForm, setArayislarForm] = useState({ type: 'CreditLine', language: 'az', paymentCardId: '' })
  const [referencesStatus, setReferencesStatus] = useState('idle')
  const [arayislarStatus, setArayislarStatus] = useState('idle')
  const [arayislarError, setArayislarError] = useState('')

  const handleArayislarSubmit = async (e) => {
    e.preventDefault();
    setArayislarStatus('loading');
    setArayislarError('');
    
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/Documents/references`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: arayislarForm.type,
          language: arayislarForm.language,
          paymentCardId: arayislarForm.paymentCardId
        })
      });

      if (!res.ok) {
        let errMsg = `Server error: ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      setArayislarStatus('success');
      setTimeout(() => {
        setShowArayislarModal(false);
        setArayislarStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Arayislar error:', error);
      setArayislarStatus('idle');
      setArayislarError(error.message);
    }
  };

  const handleSendReference = async (e) => {
    e.preventDefault();
    setReferencesStatus('loading');
    
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/Cards/statement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          cardId: referencesForm.cardId,
          period: referencesForm.period,
          language: referencesForm.language
        })
      });

      if (!res.ok) {
        let errMsg = `Server error: ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = errData.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      setReferencesStatus('success');
      setTimeout(() => {
        setShowReferencesModal(false);
        setReferencesStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Statement error:', error);
      setReferencesStatus('idle');
      alert(`Xəta: ${error.message}`);
    }
  };

  const openWithdrawDepositModal = (depositId, isExpired) => {
    setWithdrawDepositForm({ depositId, targetCardId: cards.length > 0 ? cards[0].id : '' });
    setWithdrawDepositStatus('idle');
    setWithdrawDepositError('');
    setWithdrawingDepositExpired(isExpired);
    setShowWithdrawDepositModal(true);
  };

  const handleWithdrawDeposit = async (e) => {
    if (e) e.preventDefault();
    const depositId = withdrawDepositForm.depositId;
    if (withdrawingDepositId || !depositId || !withdrawDepositForm.targetCardId) return;

    setWithdrawingDepositId(depositId);
    setWithdrawDepositStatus('loading');
    setWithdrawDepositError('');

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/deposits/${depositId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetCardId: withdrawDepositForm.targetCardId })
      });
      let data;
      try {
        data = await res.json();
      } catch (err) {
        throw new Error(`Server returned an invalid response. Status: ${res.status}`);
      }
      if (!res.ok) throw new Error(data?.message || 'Error withdrawing deposit');

      fetchDeposits();
      fetchCards();

      setWithdrawDepositStatus('success');
      setTimeout(() => {
        setShowWithdrawDepositModal(false);
        setWithdrawDepositStatus('idle');
      }, 2000);
    } catch (err) {
      console.error(err);
      setWithdrawDepositError(translateErrorMsg(err.message));
      setWithdrawDepositStatus('idle');
    } finally {
      setWithdrawingDepositId(null);
    }
  }

  const openPayLoanModal = (loanId) => {
    setPayLoanForm({ loanId, sourceCardId: cards.length > 0 ? cards[0].id : '' });
    setPayLoanStatus('idle');
    setPayLoanError('');
    setShowPayLoanModal(true);
  };

  const translateErrorMsg = (msg) => {
    if (!msg) return msg;
    if (msg.includes('Insufficient funds')) return t(userCardsLang, 'insufficientFundsShort');
    if (msg.includes('The card is blocked')) return t(userCardsLang, 'cardBlockedError');
    return msg;
  };

  const toggleCreditLimitView = (cardId, e) => {
    e.stopPropagation();
    setShowingCreditLimitMap(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  }

  const formatCardNumber = (number) => {
    if (!number) return '';
    const clean = number.replace(/\s+/g, '');
    return clean.match(/.{1,4}/g)?.join(' ') || clean;
  }

  const getBalanceColor = (balance, isOption = false) => {
    if (balance < 0) return '#ff4d4f';
    if (balance < 5) return '#faad14';
    return isOption ? '#111' : '#fff';
  };

  const fetchCards = async () => {
    try {
      setLoading(true)
      const res = await fetchWithAuth(`${API_BASE_URL}/user/cards`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setCards(data)
        if (data.length > 0) {
          setActiveCardId(data[0].id)
          setNewCardForm(prev => ({ ...prev, sourceCardId: data[0].id }))
          setNewLoanForm(prev => ({ ...prev, targetCardId: data[0].id }))
          setNewDepositForm(prev => ({ ...prev, sourceCardId: data[0].id }))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLoans = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/loans`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setLoans(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchDeposits = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/deposits`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setDeposits(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleApplyLoan = async (e) => {
    e.preventDefault()
    if (!newLoanForm.amount || !newLoanForm.termMonths || !newLoanForm.targetCardId) return
    setNewLoanStatus('loading')
    setNewLoanError('')
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/loans/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: parseFloat(newLoanForm.amount),
          termMonths: parseInt(newLoanForm.termMonths, 10),
          targetCardId: newLoanForm.targetCardId
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error applying for loan')
      setNewLoanStatus('success')
      fetchLoans()
      fetchCards()
      setTimeout(() => {
        setShowNewLoanModal(false)
        setNewLoanStatus('idle')
        setNewLoanForm(prev => ({ ...prev, amount: '', termMonths: '3' }))
      }, 1500)
    } catch (err) {
      setNewLoanError(translateErrorMsg(err.message))
      setNewLoanStatus('idle')
    }
  }

  const handlePayLoan = async (e) => {
    if (e) e.preventDefault();
    const loanId = payLoanForm.loanId;
    if (payingLoanId || !loanId) return;

    setPayingLoanId(loanId);
    setPayLoanStatus('loading');
    setPayLoanError('');

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/loans/${loanId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sourceCardId: payLoanForm.sourceCardId })
      });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error(`Server returned an invalid response. Status: ${res.status}`);
      }
      if (!res.ok) throw new Error(data?.message || 'Error paying loan');

      fetchLoans();
      fetchCards();

      setPayLoanStatus('success');
      setTimeout(() => {
        setShowPayLoanModal(false);
        setPayLoanStatus('idle');
      }, 2000);
    } catch (err) {
      console.error(err);
      setPayLoanError(translateErrorMsg(err.message));
      setPayLoanStatus('idle');
    } finally {
      setPayingLoanId(null);
    }
  }

  const formatLoanDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString();
    const date = new Date(dateString);
    if (date.getFullYear() < 2000) {
      return new Date().toLocaleDateString();
    }
    return date.toLocaleDateString();
  };

  const handleOpenDeposit = async (e) => {
    e.preventDefault()
    if (!newDepositForm.amount || !newDepositForm.termMonths || !newDepositForm.sourceCardId) return
    setNewDepositStatus('loading')
    setNewDepositError('')
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/deposits/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: parseFloat(newDepositForm.amount),
          termMonths: parseInt(newDepositForm.termMonths, 10),
          sourceCardId: newDepositForm.sourceCardId
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error opening deposit')
      setNewDepositStatus('success')
      fetchDeposits()
      fetchCards()
      setTimeout(() => {
        setShowNewDepositModal(false)
        setNewDepositStatus('idle')
        setNewDepositForm(prev => ({ ...prev, amount: '', termMonths: '3' }))
      }, 1500)
    } catch (err) {
      setNewDepositError(translateErrorMsg(err.message))
      setNewDepositStatus('idle')
    }
  }

  useEffect(() => {
    fetchCards()
    fetchLoans()
    fetchDeposits()

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const canceled = params.get('canceled');

    if (canceled) {
      localStorage.removeItem('pendingCardOrder');
      setShowNewCardModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (sessionId) {
      const pendingOrderStr = localStorage.getItem('pendingCardOrder');
      if (pendingOrderStr) {
        const pendingOrder = JSON.parse(pendingOrderStr);
        submitCardOrderFromSession(pendingOrder.cardType, pendingOrder.network, sessionId);
      }
    } else if (location.state?.orderCardType) {
      setShowNewCardModal(true)
    }
  }, [token])

  const submitCardOrderFromSession = async (cardType, network, sessionId) => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${API_BASE_URL}/user/cards/acquire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cardType,
          network,
          paymentMethod: 'stripe',
          sessionId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t(userCardsLang, 'orderCardError'));

      localStorage.removeItem('pendingCardOrder');
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchCards();
    } catch (err) {
      console.error(err);
      setNewCardError(err.message);
      setShowNewCardModal(true);
      localStorage.removeItem('pendingCardOrder');
      window.history.replaceState({}, document.title, window.location.pathname);
    } finally {
      setLoading(false);
    }
  }

  const handleAcquireCard = async (e) => {
    e.preventDefault()
    setNewCardError('')


    const existingSameType = cards.find(c => c.cardType === newCardForm.cardType)
    if (existingSameType) {
      setNewCardError(t(userCardsLang, 'cardLimitReached').replace('{cardType}', newCardForm.cardType))
      return
    }

    const fee = newCardForm.cardType === 'Premium' ? 19 : (newCardForm.cardType === 'Elite' ? 9 : 0)

    if (fee > 0 && newCardForm.paymentMethod === 'balance') {
      const sourceCard = cards.find(c => c.id === newCardForm.sourceCardId)
      if (!sourceCard || sourceCard.balance < fee) {
        setNewCardError(t(userCardsLang, 'insufficientFunds').replace('{fee}', fee))
        return
      }
    }

    if (fee > 0 && newCardForm.paymentMethod === 'stripe') {
      try {
        setSubmittingCard(true);
        const res = await fetchWithAuth(`${API_BASE_URL}/user/cards/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ cardType: newCardForm.cardType, network: newCardForm.network })
        });
        let data;
        try {
          data = await res.json();
        } catch (e) {
          throw new Error('Server returned an invalid response. Please try again.');
        }
        if (!res.ok) throw new Error(data?.message || t(userCardsLang, 'orderCardError'));

        localStorage.setItem('pendingCardOrder', JSON.stringify({
          cardType: newCardForm.cardType,
          network: newCardForm.network
        }));

        window.location.href = data.url;
      } catch (err) {
        setNewCardError(translateErrorMsg(err.message));
        setNewCardStatus('idle');
      }
      return;
    }

    submitCardOrder()
  }

  const submitCardOrder = async (paymentIntentId = null) => {
    const fee = newCardForm.cardType === 'Premium' ? 19 : (newCardForm.cardType === 'Elite' ? 9 : 0)
    try {
      setSubmittingCard(true)
      const res = await fetchWithAuth(`${API_BASE_URL}/user/cards/acquire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cardType: newCardForm.cardType,
          network: newCardForm.network,
          paymentMethod: fee === 0 ? 'free' : newCardForm.paymentMethod,
          sourceCardId: newCardForm.sourceCardId,
          paymentIntentId
        })
      })

      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!res.ok) {
        throw new Error(data?.message || t(userCardsLang, 'orderCardError'))
      }

      setShowNewCardModal(false)
      fetchCards()
    } catch (err) {
      let errorMsg = translateErrorMsg(err.message)
      if (errorMsg === 'This card is blocked and cannot be used for payment.') {
        errorMsg = t(userCardsLang, 'cardBlockedError')
      }
      setNewCardError(errorMsg)
    } finally {
      setSubmittingCard(false)
    }
  }

  const handleToggleBlock = async (cardId) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/cards/toggle-block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cardId })
      })

      if (res.ok) {
        fetchCards()
        setSelectedSettingsCard(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleCreditLimit = async (cardId) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/cards/toggle-credit-limit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cardId })
      })

      if (res.ok) {
        const updatedCard = await res.json()
        setSelectedSettingsCard(updatedCard)
        fetchCards()
      } else {
        const errData = await res.json()
        if (errData.message === 'creditLimitCooldown') {
          setCreditLimitError(t(userCardsLang, 'creditLimitCooldown'))
        } else {
          setCreditLimitError(errData.message || 'Error')
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleChangePinSubmit = async (e) => {
    e.preventDefault()
    if (!pinForm.newPin || !pinForm.confirmNewPin) return
    if (selectedSettingsCard?.hasPin && !pinForm.oldPin) return

    if (pinForm.newPin !== pinForm.confirmNewPin) {
      setPinError(t(userCardsLang, 'pinNotMatch'))
      return
    }

    if (selectedSettingsCard?.hasPin && pinForm.oldPin === pinForm.newPin) {
      setPinError(t(userCardsLang, 'pinSameAsOld'))
      return
    }

    setPinStatus('loading')
    setPinError('')

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/cards/change-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: selectedSettingsCard.id,
          oldPin: pinForm.oldPin,
          newPin: pinForm.newPin
        })
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.message === 'incorrectOldPin') {
          throw new Error(t(userCardsLang, 'incorrectOldPin'))
        }
        throw new Error(data.message || 'Error changing PIN')
      }

      setPinStatus('success')
      fetchCards()
      setTimeout(() => {
        setShowPinModal(false)
        setPinStatus('idle')
        setPinForm({ oldPin: '', newPin: '', confirmNewPin: '' })
        setSelectedSettingsCard(data)
        setShowPinSuccessModal(true)
      }, 1500)
    } catch (err) {
      setPinError(translateErrorMsg(err.message));
      setPinStatus('idle');
    }
  }

  const handleInternalTransferSubmit = async (e) => {
    e.preventDefault()
    if (!internalTransferForm.sourceCardId || !internalTransferForm.destCardId || !internalTransferForm.amount) return
    if (internalTransferForm.sourceCardId === internalTransferForm.destCardId) {
      setInternalTransferError(t(userCardsLang, 'sameCardError'))
      return
    }

    setInternalTransferStatus('loading')
    setInternalTransferError('')

    try {
      const destCard = cards.find(c => c.id.toString() === internalTransferForm.destCardId)

      const res = await fetchWithAuth(`${API_BASE_URL}/user/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: internalTransferForm.sourceCardId,
          providerName: 'Internal Transfer',
          categoryName: 'Transfer',
          recipientAccount: destCard ? destCard.cardNumber : '',
          amount: parseFloat(internalTransferForm.amount)
        })
      })

      let data;
      try {
        data = await res.json()
      } catch (e) {
        throw new Error(`Invalid response from server. Status: ${res.status}`)
      }
      if (!res.ok) {
        throw new Error(data?.message || t(userCardsLang, 'transferError'))
      }

      setInternalTransferStatus('success')
      fetchCards()
      setTimeout(() => {
        setShowInternalTransferModal(false)
        setInternalTransferStatus('idle')
        setInternalTransferForm({ sourceCardId: '', destCardId: '', amount: '' })
      }, 2000)
    } catch (err) {
      let errorMsg = err.message
      if (errorMsg === 'Insufficient funds on the card.') {
        errorMsg = t(userCardsLang, 'insufficientFundsShort')
      }
      setInternalTransferError(errorMsg)
      setInternalTransferStatus('idle')
    }
  }

  const handleDestCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 16) value = value.slice(0, 16)
    let formatted = value.match(/.{1,4}/g)?.join(' ') || ''
    if (value.length === 0) formatted = ''
    setNeoBankTransferForm({ ...neoBankTransferForm, destCardNumber: formatted })
  }

  const handleIbanTransferSubmit = async (e) => {
    e.preventDefault()
    if (!ibanTransferForm.sourceCardId || !ibanTransferForm.destIban || !ibanTransferForm.amount) return

    const ibanClean = ibanTransferForm.destIban.replace(/\s+/g, '').toUpperCase()
    const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/
    if (!ibanRegex.test(ibanClean)) {
      setIbanTransferError(t(userCardsLang, 'invalidIbanFormat') || 'Invalid IBAN format')
      return
    }

    setIbanTransferStatus('loading')
    setIbanTransferError('')

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: ibanTransferForm.sourceCardId,
          providerName: 'IBAN Transfer',
          categoryName: 'Transfer',
          recipientAccount: ibanTransferForm.destIban,
          amount: parseFloat(ibanTransferForm.amount)
        })
      })

      let data;
      try {
        data = await res.json()
      } catch (e) {
        throw new Error(`Invalid response from server. Status: ${res.status}`)
      }
      if (!res.ok) {
        throw new Error(data?.message || t(userCardsLang, 'transferError'))
      }

      setIbanTransferStatus('success')
      fetchCards()
      setTimeout(() => {
        setShowIbanTransferModal(false)
        setIbanTransferStatus('idle')
        setIbanTransferForm({ sourceCardId: '', destIban: '', amount: '' })
      }, 2000)
    } catch (err) {
      let errorMsg = err.message
      if (errorMsg === 'Insufficient funds on the card.') {
        errorMsg = t(userCardsLang, 'insufficientFundsShort')
      }
      setIbanTransferError(errorMsg)
      setIbanTransferStatus('idle')
    }
  }

  const handleNeoBankTransferSubmit = async (e) => {
    e.preventDefault()
    if (!neoBankTransferForm.sourceCardId || !neoBankTransferForm.destCardNumber || !neoBankTransferForm.amount) return

    const destNumberRaw = neoBankTransferForm.destCardNumber.replace(/\s+/g, '')
    if (destNumberRaw.length !== 16) {
      setNeoBankTransferError(t(userCardsLang, 'invalidCardNumberError'))
      return
    }

    const sourceCard = cards.find(c => c.id.toString() === neoBankTransferForm.sourceCardId)
    if (sourceCard && sourceCard.cardNumber.replace(/\s+/g, '') === destNumberRaw) {
      setNeoBankTransferError(t(userCardsLang, 'sameCardError'))
      return
    }

    setNeoBankTransferStatus('loading')
    setNeoBankTransferError('')

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: neoBankTransferForm.sourceCardId,
          providerName: 'NeoBank Transfer',
          categoryName: 'Transfer',
          recipientAccount: destNumberRaw,
          amount: parseFloat(neoBankTransferForm.amount)
        })
      })

      let data;
      try {
        data = await res.json()
      } catch (e) {
        throw new Error(`Invalid response from server. Status: ${res.status}`)
      }
      if (!res.ok) {
        throw new Error(data?.message || t(userCardsLang, 'transferError'))
      }

      setNeoBankTransferStatus('success')
      fetchCards()
      setTimeout(() => {
        setShowNeoBankTransferModal(false)
        setNeoBankTransferStatus('idle')
        setNeoBankTransferForm({ sourceCardId: '', destCardNumber: '', amount: '' })
      }, 2000)
    } catch (err) {
      let errorMsg = err.message
      if (errorMsg === 'Insufficient funds on the card.') {
        errorMsg = t(userCardsLang, 'insufficientFundsShort')
      } else if (errorMsg === 'Recipient card not found.') {
        errorMsg = t(userCardsLang, 'cardNotFoundError')
      }
      setNeoBankTransferError(errorMsg)
      setNeoBankTransferStatus('idle')
    }
  }

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const isAnyModalOpen = !!(
    selectedSettingsCard ||
    selectedTransferCard ||
    showVatModal ||
    showProductSelectionModal ||
    showNewLoanModal ||
    showNewDepositModal ||
    showIbanTransferModal ||
    showNewCardModal ||
    showPinModal ||
    showPinAlertModal ||
    showPinSuccessModal ||
    showPayLoanModal ||
    showWithdrawDepositModal ||
    showInternalTransferModal ||
    showNeoBankTransferModal ||
    showAccountDetailsModal ||
    showUnavailableModal ||
    showStatementsChoiceModal ||
    showReferencesModal ||
    showArayislarModal ||
    showQrModal
  );

  return (
    <div className="user-cards-page">
      <div className="cards-header">
        <h1 data-lang-key="title">{t(userCardsLang, 'title')}</h1>
      </div>

      {loading ? (
        <div className="cards-loading" data-lang-key="loadingCards">{t(userCardsLang, 'loadingCards')}</div>
      ) : (
        <div className="cards-grid">
          {/* Cards */}
          {cards.length === 0 ? (
            <div className="card-item card-item--no-pin no-cards-banner card-item--center">
              <p data-lang-key="noCards">{t(userCardsLang, 'noCards')}</p>
              <button className="add-product-btn" onClick={() => setShowProductSelectionModal(true)}>
                <span data-lang-key="orderFirstCard">{t(userCardsLang, 'orderFirstCard')}</span>
              </button>
            </div>
          ) : (
            cards.map(card => (
              <div
                key={card.id}
                className={`card-item ${activeCardId === card.id ? 'active' : ''} ${!card.hasPin ? 'card-item--no-pin' : ''}`}
                onClick={() => setActiveCardId(card.id)}
              >
                <div className="card-image-wrapper">
                  <img src={cardImages[card.cardType][card.network] || cardImages['Standard']['Mastercard']} alt={card.cardType} className="card-image" />
                </div>
                <div className="card-details">
                  <div className="card-info-header">
                    <h2>{card.cardType} Card</h2>
                    <span className={`status ${card.status.toLowerCase()}`}>{card.status}</span>
                  </div>
                  <div className="card-balance card-balance-wrapper">
                    <div className="card-balance-info">
                      <span className="label" data-lang-key={showingCreditLimitMap[card.id] ? 'creditLineLabel' : 'availableBalance'}>
                        {showingCreditLimitMap[card.id] ? t(userCardsLang, 'creditLineLabel') : t(userCardsLang, 'availableBalance')}
                      </span>
                      <span className="amount" style={{ color: showingCreditLimitMap[card.id] ? '#fff' : getBalanceColor(card.balance) }}>
                        {Number(showingCreditLimitMap[card.id] ? card.creditLimit : card.balance).toFixed(2)} AZN
                      </span>
                    </div>
                    {card.creditLimit > 0 && (
                      <button
                        className="toggle-balance-btn toggle-balance-btn--styled"
                        onClick={(e) => toggleCreditLimitView(card.id, e)}
                        title={showingCreditLimitMap[card.id] ? t(userCardsLang, 'availableBalance') : t(userCardsLang, 'creditLineLabel')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 10L3 14L7 18" />
                          <path d="M21 14H3" />
                          <path d="M17 4L21 8L17 12" />
                          <path d="M3 8H21" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="card-actions">
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!card.hasPin) {
                          setShowPinAlertModal(true);
                          return;
                        }
                        setModalOrigin({ x: e.clientX, y: e.clientY })
                        setLastActiveElement(e.currentTarget)
                        setSelectedTransferCard(card)
                      }}
                      data-lang-key="transfer"
                    >
                      {t(userCardsLang, 'transfer')}
                    </button>
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSettingsCard(card);
                      }}
                      data-lang-key="settings"
                    >
                      {t(userCardsLang, 'settings')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loans */}
          {loans.filter(l => l.status !== 'Closed' && l.status !== 'Paid' && l.status !== 'Rejected').length === 0 ? (
            <div className="card-item card-item--no-pin no-cards-banner" style={{ justifyContent: 'center' }}>
              <p data-lang-key="noLoans">{t(userCardsLang, 'noLoans')}</p>
            </div>
          ) : (
            loans.filter(l => l.status !== 'Closed' && l.status !== 'Paid' && l.status !== 'Rejected').map(loan => (
              <div key={loan.id} className="card-item">
                <div className="card-image-wrapper virtual-card-wrapper virtual-card-wrapper--loan">
                  {/* Decorative background elements */}
                  <div className="virtual-card__deco-tr virtual-card__deco-tr--loan"></div>
                  <div className="virtual-card__deco-bl virtual-card__deco-bl--loan"></div>

                  <div className="virtual-card__header">
                    <div className="virtual-card__title">
                      <div className="virtual-card__icon virtual-card__icon--loan">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b185fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="6" width="20" height="12" rx="2" />
                          <circle cx="12" cy="12" r="2" />
                          <path d="M6 12h.01M18 12h.01" />
                        </svg>
                      </div>
                      <span className="virtual-card__name virtual-card__name--loan">{t(userCardsLang, 'neoCredit')}</span>
                    </div>
                  </div>

                  {/* Loan Data Grid INSIDE the virtual card */}
                  <div className="virtual-card__grid">
                    <div className="virtual-card__item">
                      <span className="virtual-card__label" data-lang-key="loanAmount">{t(userCardsLang, 'loanAmount')}</span>
                      <span className="virtual-card__value">{Number(loan.amount).toFixed(2)} ₼</span>
                    </div>
                    <div className="virtual-card__item">
                      <span className="virtual-card__label" data-lang-key="monthlyPayment">{t(userCardsLang, 'monthlyPayment')}</span>
                      <span className="virtual-card__value">{Number(loan.monthlyPayment).toFixed(2)} ₼</span>
                    </div>
                    <div className="virtual-card__item">
                      <span className="virtual-card__label" data-lang-key="interestRate">{t(userCardsLang, 'interestRate')}</span>
                      <span className="virtual-card__value">{loan.interestRate}% / {loan.termMonths} ay</span>
                    </div>
                    <div className="virtual-card__item">
                      <span className="virtual-card__label" data-lang-key="nextPaymentDate">{t(userCardsLang, 'nextPaymentDate')}</span>
                      <span className="virtual-card__value">{formatLoanDate(loan.nextPaymentDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="card-details">
                  <div className="card-info-header">
                    <h2>{loan.status === 'Pending' ? t(userCardsLang, 'pendingLoans') : t(userCardsLang, 'activeLoans')}</h2>
                    <span className={`status ${loan.status.toLowerCase()}`}>{loan.status}</span>
                  </div>
                  <div className="card-balance">
                    <span className="label" data-lang-key="remainingBalance">{t(userCardsLang, 'remainingBalance')}</span>
                    <span className="amount">{Number(loan.remainingBalance).toFixed(2)} AZN</span>
                  </div>

                  {loan.status === 'Active' && (
                    <div className="card-actions card-actions--center">
                      <button
                        className="action-btn action-btn--loan-pay"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPayLoanModal(loan.id);
                        }}
                        disabled={payingLoanId === loan.id}
                      >
                        {payingLoanId === loan.id ? t(userCardsLang, 'submitting') : t(userCardsLang, 'payLoanBtn')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Deposits */}
          {deposits.filter(d => d.status !== 'Closed').length === 0 ? (
            <div className="card-item card-item--no-pin no-cards-banner" style={{ justifyContent: 'center' }}>
              <p data-lang-key="noDeposits">{t(userCardsLang, 'noDeposits')}</p>
            </div>
          ) : (
            deposits.filter(d => d.status !== 'Closed').map(deposit => (
              <div key={deposit.id} className="card-item">
                <div className="card-image-wrapper virtual-card-wrapper virtual-card-wrapper--deposit">
                  {/* Decorative background elements */}
                  <div className="virtual-card__deco-tr virtual-card__deco-tr--deposit"></div>
                  <div className="virtual-card__deco-bl virtual-card__deco-bl--deposit"></div>

                  <div className="virtual-card__header">
                    <div className="virtual-card__title">
                      <div className="virtual-card__icon virtual-card__icon--deposit">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d656" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="6" width="20" height="12" rx="2" />
                          <circle cx="12" cy="12" r="2" />
                          <path d="M6 12h.01M18 12h.01" />
                        </svg>
                      </div>
                      <span className="virtual-card__name virtual-card__name--deposit">{t(userCardsLang, 'neoDeposit')}</span>
                    </div>
                  </div>

                  {/* Deposit Data Grid INSIDE the virtual card */}
                  <div className="virtual-card__grid">
                    <div className="virtual-card__item">
                      <span className="virtual-card__label" data-lang-key="amountLabel">{t(userCardsLang, 'amountLabel')}</span>
                      <span className="virtual-card__value">{Number(deposit.amount).toFixed(2)} ₼</span>
                    </div>
                    <div className="virtual-card__item">
                      <span className="virtual-card__label" data-lang-key="totalIncome">{t(userCardsLang, 'totalIncome')}</span>
                      <span className="virtual-card__value">{Number(deposit.totalIncome).toFixed(2)} ₼</span>
                    </div>
                    <div className="virtual-card__item">
                      <span className="virtual-card__label" data-lang-key="interestRate">{t(userCardsLang, 'interestRate')}</span>
                      <span className="virtual-card__value">{deposit.interestRate}%</span>
                    </div>
                    <div className="virtual-card__item">
                      <span className="virtual-card__label" data-lang-key="termLabel">{t(userCardsLang, 'termLabel')}</span>
                      <span className="virtual-card__value">{deposit.termMonths} {t(userCardsLang, 'termMonths').toLowerCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="card-details">
                  <div className="card-info-header">
                    <h2>{t(userCardsLang, 'activeDeposits')}</h2>
                    <span className={`status ${deposit.status.toLowerCase()}`}>{deposit.status}</span>
                  </div>
                  <div className="card-balance">
                    <span className="label" data-lang-key="totalIncome">{t(userCardsLang, 'totalIncome')}</span>
                    <span className="amount">{Number(deposit.totalIncome + deposit.amount).toFixed(2)} AZN</span>
                  </div>
                  <div className="card-actions card-actions--center">
                    {(() => {
                      const depositCreatedAt = new Date(deposit.createdAt);
                      // Add termMonths to get the expiry date
                      const expiryDate = new Date(depositCreatedAt);
                      expiryDate.setMonth(expiryDate.getMonth() + deposit.termMonths);
                      const isExpired = expiryDate <= new Date();

                      return (
                        <button
                          className="action-btn action-btn--deposit-withdraw"
                          onClick={(e) => {
                            e.stopPropagation();
                            openWithdrawDepositModal(deposit.id, isExpired);
                          }}
                          disabled={withdrawingDepositId === deposit.id}
                        >
                          {withdrawingDepositId === deposit.id ? t(userCardsLang, 'submitting') : (isExpired ? t(userCardsLang, 'withdraw') : t(userCardsLang, 'withdrawEarly'))}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="cards-cashback-section">
        {!variantSelected ? (
          /* ── Variant Selection Screen ── */
          <div className="cashback-variant-selector">
            <div className="cashback-variant-selector__header">
              <img src={shoppingBubbleIcon} className="cashback-section-icon" alt="" />
              <div>
                <h2>{t(userCardsLang, 'selectVariantTitle')}</h2>
                <p className="cashback-variant-selector__subtitle">{t(userCardsLang, 'selectVariantSubtitle')}</p>
              </div>
            </div>

            {variantError && <div className="cashback-variant-selector__error">{variantError}</div>}

            <div className="cashback-variant-selector__grid">
              {/* Variant A */}
              <div className="variant-card variant-card--a">
                <div className="variant-card__header">
                  <span className="variant-card__badge">{t(userCardsLang, 'variantA')}</span>
                  <h3>{t(userCardsLang, 'variantATitle')}</h3>
                  <p>{t(userCardsLang, 'variantADesc')}</p>
                </div>
                <div className="variant-card__categories">
                  {variantAPreview
                    .sort((a, b) => Number(b.rate) - Number(a.rate))
                    .map((item, index) => {
                      const langCap = lang.charAt(0).toUpperCase() + lang.slice(1);
                      const title = item[`title${langCap}`] || item.titleEn || '';
                      return (
                        <div className="variant-card__category" key={item.id || `a-${index}`}>
                          <strong>{item.rate}%</strong>
                          <span>{title}</span>
                        </div>
                      );
                    })}
                </div>
                <button
                  className="variant-card__select-btn"
                  onClick={() => handleSelectVariant('A')}
                  disabled={selectingVariant}
                >
                  {selectingVariant ? '...' : t(userCardsLang, 'selectVariantBtn')}
                </button>
              </div>

              {/* OR divider */}
              <div className="cashback-variant-selector__or">
                <span>{lang === 'az' ? 'və ya' : lang === 'ru' ? 'или' : 'or'}</span>
              </div>

              {/* Variant B */}
              <div className="variant-card variant-card--b">
                <div className="variant-card__header">
                  <span className="variant-card__badge">{t(userCardsLang, 'variantB')}</span>
                  <h3>{t(userCardsLang, 'variantBTitle')}</h3>
                  <p>{t(userCardsLang, 'variantBDesc')}</p>
                </div>
                <div className="variant-card__categories">
                  {variantBPreview
                    .sort((a, b) => Number(b.rate) - Number(a.rate))
                    .map((item, index) => {
                      const langCap = lang.charAt(0).toUpperCase() + lang.slice(1);
                      const title = item[`title${langCap}`] || item.titleEn || '';
                      return (
                        <div className="variant-card__category" key={item.id || `b-${index}`}>
                          <strong>{item.rate}%</strong>
                          <span>{title}</span>
                        </div>
                      );
                    })}
                </div>
                <button
                  className="variant-card__select-btn"
                  onClick={() => handleSelectVariant('B')}
                  disabled={selectingVariant}
                >
                  {selectingVariant ? '...' : t(userCardsLang, 'selectVariantBtn')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Selected Variant: Show Categories ── */
          <>
            <div className="cashback-section-header">
              <div className="cashback-title-row">
                <img src={shoppingBubbleIcon} className="cashback-section-icon" alt="" />
                <h2 data-lang-key="cashbackCategories">{t(userCardsLang, 'cashbackCategories')}</h2>
                <button className="info-toggle-btn" onClick={() => setShowLimits(!showLimits)}>i</button>
              </div>
              <div className="cashback-header-stats">
                <div className="total-cashback">
                  <span data-lang-key="totalEarned">{t(userCardsLang, 'totalEarned')} </span>
                  <strong>{Number(cashbackData?.totalEarned || 0).toFixed(2)} ₼</strong>
                </div>
              </div>
            </div>
            <div className="cashback-offers">
              {[...(cashbackData?.categories || [])]
                .filter(item => item != null)
                .sort((a, b) => Number(b?.rate || 0) - Number(a?.rate || 0))
                .map((item, index) => {
                  const langCap = lang.charAt(0).toUpperCase() + lang.slice(1);
                  
                  const rate = item?.rate !== undefined ? item.rate : 0;
                  const limit = item?.limit !== undefined ? item.limit : 1;
                  const title = item[`title${langCap}`] || item?.titleEn || '';
                  const text = item[`text${langCap}`] || item?.textEn || '';
                  const earned = item?.earned !== undefined ? item.earned : 0;
                  
                  return (
                    <div className="cashback-offer" key={item?.id || `cashback-${index}`}>
                      <strong>{rate}%</strong>
                      <div className="cashback-offer-info">
                        <h4>{title}</h4>
                        <p>{text}</p>
                        {showLimits && (
                          <div className="cashback-limits">
                            <span className="limit"><span data-lang-key="limitAmount">{t(userCardsLang, 'limitAmount')}</span> {Number(limit).toFixed(2)} ₼</span>
                            <span className="earned"><span data-lang-key="earnedAmount">{t(userCardsLang, 'earnedAmount')}</span> {Number(earned).toFixed(2)} ₼</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
              })}
            </div>
          </>
        )}
      </div>

      {!isAnyModalOpen && (
        <div className={`cards-footer ${isFooterVisible ? 'hidden-by-footer' : ''}`}>
          <button className="scan-qr-btn" onClick={() => setShowQrModal(true)}>
            <img src={qrCodeIcon} className="btn-svg-icon" alt="" />
            <span data-lang-key="scanQrCode">{t(userCardsLang, 'scanQrCode')}</span>
          </button>
          <button className="add-product-btn" onClick={() => setShowProductSelectionModal(true)}>
            <img src={addProductIcon} className="btn-svg-icon" alt="" />
            <span data-lang-key="addNewProduct">{t(userCardsLang, 'addNewProduct')}</span>
          </button>
        </div>
      )}


      {showProductSelectionModal && (
        <div className="card-modal-overlay" onClick={() => setShowProductSelectionModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2 data-lang-key="selectProductTitle">{t(userCardsLang, 'selectProductTitle')}</h2>
              <button className="close-btn" onClick={() => setShowProductSelectionModal(false)}>✕</button>
            </div>
            <div className="card-modal__content">
              <div className="settings-section settings-section--mt">
                <button className="settings-action-btn" onClick={() => { setShowProductSelectionModal(false); setShowNewCardModal(true); }}>
                  <img src={addProductIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{t(userCardsLang, 'orderCardBtn')}</span>
                  </div>
                </button>
                <button className="settings-action-btn" onClick={() => { setShowProductSelectionModal(false); setShowNewLoanModal(true); }}>
                  <img src={addProductIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{t(userCardsLang, 'takeLoanBtn')}</span>
                  </div>
                </button>
                <button className="settings-action-btn" onClick={() => { setShowProductSelectionModal(false); setShowNewDepositModal(true); }}>
                  <img src={addProductIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{t(userCardsLang, 'openDepositBtn')}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPayLoanModal && (
        <div className="card-modal-overlay" onClick={() => setShowPayLoanModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2 data-lang-key="payLoanBtn">{t(userCardsLang, 'payLoanBtn')}</h2>
              <button className="close-btn" onClick={() => setShowPayLoanModal(false)}>✕</button>
            </div>
            <div className="card-modal__content">
              {payLoanStatus === 'success' ? (
                <div className="success-state modal-success-state">
                  <img src={loaderSuccessIcon} className="modal-success-icon" alt="Success" />
                  <h3>{t(userCardsLang, 'paymentSuccess') || 'Ödəniş uğurla tamamlandı!'}</h3>
                </div>
              ) : (
                <form onSubmit={handlePayLoan} className="modal-form">
                  {payLoanError && <div className="error-message cards-page__modal-error-mb">{payLoanError}</div>}
                  <div className="form-group">
                    <label data-lang-key="sourceCardLabel">{t(userCardsLang, 'sourceCardLabel') || 'Select Card to Pay From'}</label>
                    <select
                      value={payLoanForm.sourceCardId}
                      onChange={e => setPayLoanForm({ ...payLoanForm, sourceCardId: e.target.value })}
                      required
                    >
                      <option value="" disabled style={{ color: '#111' }}>Select a card</option>
                      {cards.map(c => <option key={c.id} value={c.id} style={{ color: getBalanceColor(c.balance, true) }}>{c.cardType} ({c.cardNumber.slice(-4)}) - {Number(c.balance).toFixed(2)} AZN</option>)}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="cards-page__button cards-page__button--primary submit-order-btn modal-btn--mt"
                    disabled={payLoanStatus === 'loading'}
                  >
                    {payLoanStatus === 'loading' ? (
                      <>
                        <img src={loaderIcon} alt="Loading..." className="btn-loader btn-loader-black" />
                        {t(userCardsLang, 'submitting')}
                      </>
                    ) : (
                      t(userCardsLang, 'payLoanBtn')
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {showWithdrawDepositModal && (
        <div className="card-modal-overlay" onClick={() => setShowWithdrawDepositModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2 data-lang-key="withdrawDepositTitle">{t(userCardsLang, 'withdrawDepositTitle')}</h2>
              <button className="close-btn" onClick={() => setShowWithdrawDepositModal(false)}>✕</button>
            </div>
            <div className="card-modal__content">
              {withdrawDepositStatus === 'success' ? (
                <div className="success-state modal-success-state">
                  <img src={loaderSuccessIcon} className="modal-success-icon" alt="Success" />
                  <h3>{t(userCardsLang, 'withdrawDepositSuccess') || 'Deposit successfully withdrawn!'}</h3>
                </div>
              ) : (
                <form onSubmit={handleWithdrawDeposit} className="modal-form">
                  {withdrawDepositError && <div className="error-message cards-page__modal-error-mb">{withdrawDepositError}</div>}
                  {!withdrawingDepositExpired && (
                    <div className="warning-message warning-message--styled">
                      {t(userCardsLang, 'withdrawDepositPenaltyWarning')}
                    </div>
                  )}
                  <div className="form-group">
                    <label data-lang-key="targetCardLabel">{t(userCardsLang, 'targetCardLabel') || 'Select Card to Withdraw To'}</label>
                    <select
                      value={withdrawDepositForm.targetCardId}
                      onChange={e => setWithdrawDepositForm({ ...withdrawDepositForm, targetCardId: e.target.value })}
                      required
                    >
                      <option value="" disabled style={{ color: '#111' }}>Select a card</option>
                      {cards.map(c => <option key={c.id} value={c.id} style={{ color: getBalanceColor(c.balance, true) }}>{c.cardType} ({c.cardNumber.slice(-4)}) - {Number(c.balance).toFixed(2)} AZN</option>)}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="cards-page__button cards-page__button--primary submit-order-btn modal-btn--mt"
                    disabled={withdrawDepositStatus === 'loading'}
                  >
                    {withdrawDepositStatus === 'loading' ? (
                      <>
                        <img src={loaderIcon} alt="Loading..." className="btn-loader btn-loader-black" />
                        {t(userCardsLang, 'submitting')}
                      </>
                    ) : (
                      t(userCardsLang, 'withdrawDepositBtn')
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {showNewLoanModal && (
        <div className="card-modal-overlay" onClick={() => setShowNewLoanModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2 data-lang-key="loanApplicationTitle">{t(userCardsLang, 'loanApplicationTitle')}</h2>
              <button className="close-btn" onClick={() => setShowNewLoanModal(false)}>✕</button>
            </div>
            <div className="card-modal__content">
              <form onSubmit={handleApplyLoan} className="modal-form">
                {newLoanError && <div className="form-error cards-page__modal-error-mb">{newLoanError}</div>}
                <div className="form-group">
                  <label data-lang-key="amountLabel">{t(userCardsLang, 'amountLabel')}</label>
                  <input className="modal-input modal-input--styled" type="number" value={newLoanForm.amount} onChange={e => setNewLoanForm({ ...newLoanForm, amount: e.target.value })} placeholder="500 - 100000" min="500" max="100000" required />
                </div>
                <div className="form-group">
                  <label data-lang-key="termLabel">{t(userCardsLang, 'termLabel')}</label>
                  <select value={newLoanForm.termMonths} onChange={e => setNewLoanForm({ ...newLoanForm, termMonths: e.target.value })}>
                    <option value="3" style={{ color: '#111' }}>3 {t(userCardsLang, 'termMonths').toLowerCase()}</option>
                    <option value="6" style={{ color: '#111' }}>6 {t(userCardsLang, 'termMonths').toLowerCase()}</option>
                    <option value="12" style={{ color: '#111' }}>12 {t(userCardsLang, 'termMonths').toLowerCase()}</option>
                    <option value="24" style={{ color: '#111' }}>24 {t(userCardsLang, 'termMonths').toLowerCase()}</option>
                    <option value="36" style={{ color: '#111' }}>36 {t(userCardsLang, 'termMonths').toLowerCase()}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label data-lang-key="targetCardLabel">{t(userCardsLang, 'targetCardLabel')}</label>
                  <select value={newLoanForm.targetCardId} onChange={e => setNewLoanForm({ ...newLoanForm, targetCardId: e.target.value })} required>
                    <option value="" disabled style={{ color: '#111' }}>Select a card</option>
                    {cards.map(c => <option key={c.id} value={c.id} style={{ color: '#111' }}>{c.cardType} ({c.cardNumber.slice(-4)})</option>)}
                  </select>
                </div>
                <button type="submit" className="cards-page__button cards-page__button--primary submit-order-btn modal-btn--mt" disabled={newLoanStatus === 'loading'}>
                  {newLoanStatus === 'loading' ? (
                      <>
                        <img src={loaderIcon} alt="Loading..." className="btn-loader btn-loader-black" />
                        {t(userCardsLang, 'submitting')}
                      </>
                    ) : (
                      t(userCardsLang, 'submitApplication')
                    )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showNewDepositModal && (
        <div className="card-modal-overlay" onClick={() => setShowNewDepositModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2 data-lang-key="depositOpeningTitle">{t(userCardsLang, 'depositOpeningTitle')}</h2>
              <button className="close-btn" onClick={() => setShowNewDepositModal(false)}>✕</button>
            </div>
            <div className="card-modal__content">
              <form onSubmit={handleOpenDeposit} className="modal-form">
                {newDepositError && <div className="form-error cards-page__modal-error-mb">{newDepositError}</div>}
                <div className="form-group">
                  <label data-lang-key="amountLabel">{t(userCardsLang, 'amountLabel')}</label>
                  <input className="modal-input modal-input--styled" type="number" value={newDepositForm.amount} onChange={e => setNewDepositForm({ ...newDepositForm, amount: e.target.value })} placeholder="Min 100 AZN" min="100" required />
                </div>
                <div className="form-group">
                  <label data-lang-key="termLabel">{t(userCardsLang, 'termLabel')}</label>
                  <select value={newDepositForm.termMonths} onChange={e => setNewDepositForm({ ...newDepositForm, termMonths: e.target.value })}>
                    <option value="3" style={{ color: '#111' }}>3 {t(userCardsLang, 'termMonths').toLowerCase()}</option>
                    <option value="6" style={{ color: '#111' }}>6 {t(userCardsLang, 'termMonths').toLowerCase()}</option>
                    <option value="12" style={{ color: '#111' }}>12 {t(userCardsLang, 'termMonths').toLowerCase()}</option>
                    <option value="24" style={{ color: '#111' }}>24 {t(userCardsLang, 'termMonths').toLowerCase()}</option>
                    <option value="36" style={{ color: '#111' }}>36 {t(userCardsLang, 'termMonths').toLowerCase()}</option>
                  </select>
                </div>
                <button type="submit" className="cards-page__button cards-page__button--primary submit-order-btn modal-btn--mt" disabled={newDepositStatus === 'loading'}>
                  {newDepositStatus === 'loading' ? (
                      <>
                        <img src={loaderIcon} alt="Loading..." className="btn-loader btn-loader-black" />
                        {t(userCardsLang, 'submitting')}
                      </>
                    ) : (
                      t(userCardsLang, 'submitApplication')
                    )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <AnimatedModal
        isOpen={!!selectedTransferCard}
        onClose={() => handleCloseTransferModal(setSelectedTransferCard)}
        origin={modalOrigin}
      >
        <div className="card-modal__header">
          <h2>{t(userCardsLang, 'transferMoneyTitle')}</h2>
          <button className="close-btn" onClick={() => handleCloseTransferModal(setSelectedTransferCard)}>✕</button>
        </div>
        <div className="card-modal__content">
          <div className="settings-section">
            <h3>{t(userCardsLang, 'transferOptions')}</h3>
            <button className="settings-action-btn" onClick={() => {
              setInternalTransferForm(prev => ({ ...prev, sourceCardId: selectedTransferCard?.id?.toString(), destCardId: '', amount: '' }))
              setSelectedTransferCard(null)
              setInternalTransferStatus('idle')
              setInternalTransferError('')
              setShowInternalTransferModal(true)
            }}>
              <img src={transferMyIcon} className="btn-svg-icon" alt="" />
              <div className="btn-text">
                <span className="btn-title">{t(userCardsLang, 'transferToMyAccounts')}</span>
              </div>
            </button>
            <button className="settings-action-btn" onClick={() => {
              setIbanTransferForm(prev => ({ ...prev, sourceCardId: selectedTransferCard?.id?.toString(), destIban: '', amount: '' }))
              setSelectedTransferCard(null)
              setIbanTransferStatus('idle')
              setIbanTransferError('')
              setShowIbanTransferModal(true)
            }}>
              <img src={transferAnyIcon} className="btn-svg-icon" alt="" />
              <div className="btn-text">
                <span className="btn-title">{t(userCardsLang, 'transferByIban')}</span>
              </div>
            </button>
            <button className="settings-action-btn" onClick={() => {
              setNeoBankTransferForm(prev => ({ ...prev, sourceCardId: selectedTransferCard?.id?.toString(), destCardNumber: '', amount: '' }))
              setSelectedTransferCard(null)
              setNeoBankTransferStatus('idle')
              setNeoBankTransferError('')
              setShowNeoBankTransferModal(true)
            }}>
              <img src={transferAnyIcon} className="btn-svg-icon" alt="" />
              <div className="btn-text">
                <span className="btn-title">{t(userCardsLang, 'transferToNeoBank')}</span>
              </div>
            </button>
          </div>
        </div>
      </AnimatedModal>

      <AnimatedModal
        isOpen={showIbanTransferModal}
        onClose={() => handleCloseTransferModal(setShowIbanTransferModal)}
        origin={modalOrigin}
        onOpenEnd={() => ibanFormFirstInputRef.current?.focus()}
      >
        <div className="card-modal__header">
          <h2>{t(userCardsLang, 'transferByIban')}</h2>
          <button className="close-btn" onClick={() => handleCloseTransferModal(setShowIbanTransferModal)}>✕</button>
        </div>
        <div className="card-modal__content">
          {ibanTransferStatus === 'success' ? (
            <div className="success-message modal-success-state">
              <img src={loaderSuccessIcon} className="modal-success-icon" alt="Success" />
              <p>{t(userCardsLang, 'transferSuccess')}</p>
            </div>
          ) : (
            <form onSubmit={handleIbanTransferSubmit} className="modal-form">
              {ibanTransferError && <div className="error-message cards-page__modal-error-msg">{ibanTransferError}</div>}
              <div className="form-group">
                <label>{t(userCardsLang, 'destIban')}</label>
                <input
                  ref={ibanFormFirstInputRef}
                  className="modal-input modal-input--styled"
                  type="text"
                  placeholder="AZ00NABZ00000000000000000000"
                  value={ibanTransferForm.destIban}
                  onChange={e => setIbanTransferForm({ ...ibanTransferForm, destIban: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t(userCardsLang, 'transferAmount')}</label>
                <input
                  className="modal-input modal-input--styled"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={ibanTransferForm.amount}
                  onChange={e => setIbanTransferForm({ ...ibanTransferForm, amount: e.target.value })}
                  required
                />
              </div>
              <button
                type="submit"
                className="cards-page__button cards-page__button--primary modal-btn--mt"
                disabled={ibanTransferStatus === 'loading' || !ibanTransferForm.destIban || !ibanTransferForm.amount}
              >
                {ibanTransferStatus === 'loading' ? (
                  <>
                    <img src={loaderIcon} alt="Loading..." className="btn-loader btn-loader-black" />
                    {t(userCardsLang, 'submitting')}
                  </>
                ) : (
                  t(userCardsLang, 'transferBtn')
                )}
              </button>
            </form>
          )}
        </div>
      </AnimatedModal>

      <AnimatedModal
        isOpen={showInternalTransferModal}
        onClose={() => handleCloseTransferModal(setShowInternalTransferModal)}
        origin={modalOrigin}
        onOpenEnd={() => internalFormFirstInputRef.current?.focus()}
      >
        <div className="card-modal__header">
          <h2>{t(userCardsLang, 'internalTransferTitle')}</h2>
          <button className="close-btn" onClick={() => handleCloseTransferModal(setShowInternalTransferModal)}>✕</button>
        </div>
        <div className="card-modal__content">
          {internalTransferStatus === 'success' ? (
            <div className="success-message modal-success-state">
              <img src={loaderSuccessIcon} className="modal-success-icon" alt="Success" />
              <p>{t(userCardsLang, 'transferSuccess')}</p>
            </div>
          ) : (
            <form onSubmit={handleInternalTransferSubmit} className="modal-form">
              {internalTransferError && <div className="error-message cards-page__modal-error-msg">{internalTransferError}</div>}
              <div className="form-group">
                <label>{t(userCardsLang, 'sourceCard')}</label>
                <select
                  ref={internalFormFirstInputRef}
                  value={internalTransferForm.sourceCardId}
                  onChange={e => setInternalTransferForm({ ...internalTransferForm, sourceCardId: e.target.value })}
                  required
                >
                  <option value="" disabled>{t(userCardsLang, 'selectCard')}</option>
                  {cards.map(c => (
                    <option key={`src-${c.id}`} value={c.id} style={{ color: getBalanceColor(c.balance, true) }}>{c.cardType} •••• {c.cardNumber.slice(-4)} ({t(userCardsLang, 'availableBalance')}: {Number(c.balance).toFixed(2)} AZN {c.creditLimit > 0 ? `| ${t(userCardsLang, 'creditLineLabel')}: ${Number(c.creditLimit).toFixed(2)} AZN` : ''})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t(userCardsLang, 'destCard')}</label>
                <select
                  value={internalTransferForm.destCardId}
                  onChange={e => setInternalTransferForm({ ...internalTransferForm, destCardId: e.target.value })}
                  required
                >
                  <option value="" disabled>{t(userCardsLang, 'selectCard')}</option>
                  {cards.map(c => (
                    <option key={`dst-${c.id}`} value={c.id}>{c.cardType} •••• {c.cardNumber.slice(-4)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t(userCardsLang, 'transferAmount')}</label>
                <input
                  className="modal-input modal-input--styled"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={internalTransferForm.amount}
                  onChange={e => setInternalTransferForm({ ...internalTransferForm, amount: e.target.value })}
                  required
                />
              </div>
              <button
                type="submit"
                className="cards-page__button cards-page__button--primary modal-btn--mt"
                disabled={internalTransferStatus === 'loading' || !internalTransferForm.sourceCardId || !internalTransferForm.destCardId || !internalTransferForm.amount}
              >
                {internalTransferStatus === 'loading' ? (
                  <>
                    <img src={loaderIcon} alt="Loading..." className="btn-loader btn-loader-black" />
                    {t(userCardsLang, 'submitting')}
                  </>
                ) : (
                  t(userCardsLang, 'transferBtn')
                )}
              </button>
            </form>
          )}
        </div>
      </AnimatedModal>

      <AnimatedModal
        isOpen={showNeoBankTransferModal}
        onClose={() => handleCloseTransferModal(setShowNeoBankTransferModal)}
        origin={modalOrigin}
        onOpenEnd={() => neoBankFormFirstInputRef.current?.focus()}
      >
        <div className="card-modal__header">
          <h2>{t(userCardsLang, 'neoBankTransferTitle')}</h2>
          <button className="close-btn" onClick={() => handleCloseTransferModal(setShowNeoBankTransferModal)}>✕</button>
        </div>
        <div className="card-modal__content">
          {neoBankTransferStatus === 'success' ? (
            <div className="success-message modal-success-state">
              <img src={loaderSuccessIcon} className="modal-success-icon" alt="Success" />
              <p>{t(userCardsLang, 'transferSuccess')}</p>
            </div>
          ) : (
            <form onSubmit={handleNeoBankTransferSubmit} className="modal-form">
              {neoBankTransferError && <div className="error-message cards-page__modal-error-msg">{neoBankTransferError}</div>}
              <div className="form-group">
                <label>{t(userCardsLang, 'sourceCard')}</label>
                <select
                  ref={neoBankFormFirstInputRef}
                  className="modal-input modal-input--styled"
                  value={neoBankTransferForm.sourceCardId}
                  onChange={e => setNeoBankTransferForm({ ...neoBankTransferForm, sourceCardId: e.target.value })}
                  required
                >
                  <option value="">{t(userCardsLang, 'selectCard')}</option>
                  {cards.filter(c => c.status === 'Active').map(c => (
                    <option key={c.id} value={c.id} style={{ color: getBalanceColor(c.balance, true) }}>
                      {c.cardType} •••• {c.cardNumber.slice(-4)} ({t(userCardsLang, 'availableBalance')}: {c.balance.toFixed(2)} AZN {c.creditLimit > 0 ? `| ${t(userCardsLang, 'creditLineLabel')}: ${c.creditLimit.toFixed(2)} AZN` : ''})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t(userCardsLang, 'destCard')}</label>
                <input
                  className="modal-input modal-input--styled"
                  type="text"
                  placeholder={t(userCardsLang, 'recipientCardPlaceholder')}
                  value={neoBankTransferForm.destCardNumber}
                  onChange={handleDestCardNumberChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t(userCardsLang, 'transferAmount')}</label>
                <input
                  className="modal-input modal-input--styled"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={neoBankTransferForm.amount}
                  onChange={e => setNeoBankTransferForm({ ...neoBankTransferForm, amount: e.target.value })}
                  required
                />
              </div>
              <button
                type="submit"
                className="cards-page__button cards-page__button--primary modal-btn--mt"
                disabled={neoBankTransferStatus === 'loading' || !neoBankTransferForm.sourceCardId || !neoBankTransferForm.destCardNumber || !neoBankTransferForm.amount}
              >
                {neoBankTransferStatus === 'loading' ? (
                  <>
                    <img src={loaderIcon} alt="Loading..." className="btn-loader btn-loader-black" />
                    {t(userCardsLang, 'submitting')}
                  </>
                ) : (
                  t(userCardsLang, 'transferBtn')
                )}
              </button>
            </form>
          )}
        </div>
      </AnimatedModal>

      {showAccountDetailsModal && selectedSettingsCard && (
        <div className="card-modal-overlay" onClick={() => setShowAccountDetailsModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>{t(userCardsLang, 'accountDetailsTitle')}</h2>
              <button className="close-btn" onClick={() => setShowAccountDetailsModal(false)}>✕</button>
            </div>
            <div className="card-modal__content card-modal__content--account-details">
              <div className="detail-item">
                <span className="detail-label">{t(userCardsLang, 'ibanLabel')}</span>
                <div className="detail-row">
                  <span className="detail-value">
                    {formatCardNumber(selectedSettingsCard.iban)}
                  </span>
                  <button
                    className="copy-btn"
                    onClick={() => handleCopy(selectedSettingsCard.iban, 'iban')}
                  >
                    {copiedField === 'iban' ? t(userCardsLang, 'copiedBtn') : t(userCardsLang, 'copyBtn')}
                  </button>
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-label">{t(userCardsLang, 'swiftLabel')}</span>
                <div className="detail-row">
                  <span className="detail-value">
                    {selectedSettingsCard.swift}
                  </span>
                  <button
                    className="copy-btn"
                    onClick={() => handleCopy(selectedSettingsCard.swift, 'swift')}
                  >
                    {copiedField === 'swift' ? t(userCardsLang, 'copiedBtn') : t(userCardsLang, 'copyBtn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {showPinModal && (
        <div className="card-modal-overlay" onClick={() => setShowPinModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>{t(userCardsLang, 'changePinTitle')}</h2>
              <button className="close-btn" onClick={() => setShowPinModal(false)}>✕</button>
            </div>
            <div className="card-modal__content">
              <form onSubmit={handleChangePinSubmit} className="modal-form">
                {pinError && <div className="error-message cards-page__modal-error-mb">{pinError}</div>}
                {selectedSettingsCard?.hasPin && (
                  <div className="form-group">
                    <label>{t(userCardsLang, 'oldPin')}</label>
                    <input
                      type="password"
                      maxLength="4"
                      value={pinForm.oldPin}
                      onChange={e => setPinForm({ ...pinForm, oldPin: e.target.value.replace(/\D/g, '') })}
                      className="form-input"
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>{t(userCardsLang, 'newPin')}</label>
                  <input
                    type="password"
                    maxLength="4"
                    value={pinForm.newPin}
                    onChange={e => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '') })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t(userCardsLang, 'confirmNewPin')}</label>
                  <input
                    type="password"
                    maxLength="4"
                    value={pinForm.confirmNewPin}
                    onChange={e => setPinForm({ ...pinForm, confirmNewPin: e.target.value.replace(/\D/g, '') })}
                    className="form-input"
                    required
                  />
                </div>
                <button type="submit" className="cards-page__button cards-page__button--primary" disabled={pinStatus === 'loading'}>
                  {pinStatus === 'loading' ? (
                      <>
                        <img src={loaderIcon} alt="Loading..." className="btn-loader btn-loader-black" />
                        {t(userCardsLang, 'submitting')}
                      </>
                    ) : (
                      t(userCardsLang, 'changePinTitle')
                    )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showStatementsChoiceModal && (
        <div className="card-modal-overlay" onClick={() => setShowStatementsChoiceModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>{t(userCardsLang, 'statementsChoiceTitle')}</h2>
              <button className="close-btn" onClick={() => setShowStatementsChoiceModal(false)}>✕</button>
            </div>
            <div className="card-modal__content">
              <div className="settings-section">
                <button className="settings-action-btn" onClick={() => {
                  setShowStatementsChoiceModal(false);
                  setShowArayislarModal(true);
                }}>
                  <img src={statementsIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{t(userCardsLang, 'referencesBtn')}</span>
                  </div>
                </button>
                <button className="settings-action-btn" onClick={() => {
                  setShowStatementsChoiceModal(false);
                  setShowReferencesModal(true);
                }}>
                  <img src={statementsIcon} className="btn-svg-icon" alt="" />
                  <div className="btn-text">
                    <span className="btn-title">{t(userCardsLang, 'extractsBtn')}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showArayislarModal && (
        <div className="card-modal-overlay" onClick={() => setShowArayislarModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>{t(userCardsLang, 'arayislarModalTitle')}</h2>
              <button className="close-btn" onClick={() => setShowArayislarModal(false)}>✕</button>
            </div>
            <div className="card-modal__content">
              {arayislarStatus === 'success' ? (
                <div className="success-message modal-success-state">
                  <img src={loaderSuccessIcon} className="modal-success-icon" alt="Success" />
                  <p>{t(userCardsLang, 'certificateSentSuccess')}</p>
                </div>
              ) : (
                <form onSubmit={handleArayislarSubmit} className="modal-form">
                  {arayislarError && <div className="error-message cards-page__modal-error-mb">{arayislarError}</div>}
                  
                  <div className="form-group">
                    <label>{t(userCardsLang, 'certificateType')}</label>
                    <select
                      value={arayislarForm.type}
                      onChange={e => setArayislarForm({ ...arayislarForm, type: e.target.value })}
                      required
                    >
                      <option value="CreditLine" style={{ color: '#111' }}>{t(userCardsLang, 'certCreditLine')}</option>
                      <option value="Debt" style={{ color: '#111' }}>{t(userCardsLang, 'certDebt')}</option>
                      <option value="Deposits" style={{ color: '#111' }}>{t(userCardsLang, 'certDeposits')}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t(userCardsLang, 'languageLabel')}</label>
                    <select
                      value={arayislarForm.language}
                      onChange={e => setArayislarForm({ ...arayislarForm, language: e.target.value })}
                      required
                    >
                      <option value="en" style={{ color: '#111' }}>English</option>
                      <option value="ru" style={{ color: '#111' }}>Русский</option>
                      <option value="az" style={{ color: '#111' }}>Azərbaycan</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t(userCardsLang, 'selectSourceCard')}</label>
                    <select
                      value={arayislarForm.paymentCardId}
                      onChange={e => setArayislarForm({ ...arayislarForm, paymentCardId: e.target.value })}
                      required
                    >
                      <option value="" disabled style={{ color: '#111' }}>{t(userCardsLang, 'selectCard')}</option>
                      {cards.filter(c => c.status === 'Active').map(c => (
                        <option key={c.id} value={c.id} style={{ color: getBalanceColor(c.balance, true) }}>
                          {c.cardType} •••• {c.cardNumber.slice(-4)} ({t(userCardsLang, 'availableBalance')}: {c.balance.toFixed(2)} AZN)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label>{t(userCardsLang, 'certificateFee')}</label>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: '#ffcc00', border: '1px solid rgba(255,204,0,0.3)', textAlign: 'center', fontWeight: 'bold' }}>
                      {t(userCardsLang, 'certificateFeeValue')}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="cards-page__button cards-page__button--primary"
                    disabled={arayislarStatus === 'loading' || !arayislarForm.paymentCardId}
                  >
                    {arayislarStatus === 'loading' ? (
                      <>
                        <img src={loaderIcon} alt="Loading..." className="btn-loader btn-loader-black" />
                        {t(userCardsLang, 'submitting')}
                      </>
                    ) : (
                      t(userCardsLang, 'orderCertificateBtn')
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {showReferencesModal && (
        <div className="card-modal-overlay" onClick={() => setShowReferencesModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2>{t(userCardsLang, 'referencesModalTitle')}</h2>
              <button className="close-btn" onClick={() => setShowReferencesModal(false)}>✕</button>
            </div>
            <div className="card-modal__content">
              {referencesStatus === 'success' ? (
                <div className="success-message modal-success-state">
                  <img src={loaderSuccessIcon} className="modal-success-icon" alt="Success" />
                  <p>{t(userCardsLang, 'statementSentSuccess')}</p>
                </div>
              ) : (
                <form onSubmit={handleSendReference} className="modal-form">
                  <div className="form-group">
                    <label>{t(userCardsLang, 'selectCard')}</label>
                    <select
                      value={referencesForm.cardId}
                      onChange={e => setReferencesForm({ ...referencesForm, cardId: e.target.value })}
                      required
                    >
                      <option value="all" style={{ color: '#111' }}>{t(userCardsLang, 'selectAllCards')}</option>
                      {cards.map(c => (
                        <option key={c.id} value={c.id} style={{ color: '#111' }}>{c.cardType} •••• {c.cardNumber.slice(-4)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t(userCardsLang, 'periodLabel')}</label>
                    <select
                      value={referencesForm.period}
                      onChange={e => setReferencesForm({ ...referencesForm, period: e.target.value })}
                      required
                    >
                      <option value="3" style={{ color: '#111' }}>{t(userCardsLang, 'threeMonths')}</option>
                      <option value="6" style={{ color: '#111' }}>{t(userCardsLang, 'sixMonths')}</option>
                      <option value="12" style={{ color: '#111' }}>{t(userCardsLang, 'twelveMonths')}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t(userCardsLang, 'languageLabel')}</label>
                    <select
                      value={referencesForm.language}
                      onChange={e => setReferencesForm({ ...referencesForm, language: e.target.value })}
                      required
                    >
                      <option value="en" style={{ color: '#111' }}>English</option>
                      <option value="ru" style={{ color: '#111' }}>Русский</option>
                      <option value="az" style={{ color: '#111' }}>Azərbaycan</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="cards-page__button cards-page__button--primary"
                    disabled={referencesStatus === 'loading'}
                    style={{ marginTop: '16px' }}
                  >
                    {referencesStatus === 'loading' ? (
                      <>
                        <img src={loaderIcon} alt="Loading..." className="btn-loader btn-loader-black" />
                        {t(userCardsLang, 'submitting')}
                      </>
                    ) : (
                      t(userCardsLang, 'sendToEmailBtn')
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="card-modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="card-modal" onClick={e => e.stopPropagation()}>
            <div className="card-modal__header">
              <h2 data-lang-key="scanQrCode">{t(userCardsLang, 'scanQrCode')}</h2>
              <button className="close-btn" onClick={() => setShowQrModal(false)}>✕</button>
            </div>
            <div className="card-modal__content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', minHeight: '300px', position: 'relative', padding: 0 }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
              />
              {/* Target frame */}
              <div style={{ position: 'absolute', width: '200px', height: '200px', border: '2px solid rgba(255,255,255,0.8)', borderRadius: '12px', boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}></div>
              <div style={{ position: 'absolute', bottom: '20px', color: '#fff', fontSize: '14px', zIndex: 1, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                {t(userCardsLang, 'scanQrCode')}...
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Cards

