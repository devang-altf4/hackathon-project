import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:5000/api'

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function WalletPage() {
  const { user, getToken } = useAuth()
  const navigate = useNavigate()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [notification, setNotification] = useState(null)
  
  // Transfer State
  const [activeTab, setActiveTab] = useState('add_funds') // 'add_funds' or 'transfer'
  const [transferEmail, setTransferEmail] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferNote, setTransferNote] = useState('')

  const token = getToken()

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    try {
      const res = await fetch(`${API_URL}/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setBalance(data.balance)
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleAddFunds = async (e) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const isLoaded = await loadRazorpay()
      if (!isLoaded) {
          showNotification('Razorpay SDK failed to load', 'error')
          setIsProcessing(false)
          return
      }

      // 1. Create Order
      const res = await fetch(`${API_URL}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Number(amount),
          currency: 'INR',
          receipt: `wallet_rc_${Date.now()}`,
          notes: { type: 'WALLET_RECHARGE' }
        })
      })

      const orderData = await res.json()
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "EcoLoop Wallet",
        description: "Add Funds to Wallet",
        order_id: orderData.id,
        handler: async function (response) {
            // Verify
            try {
                const verifyRes = await fetch(`${API_URL}/payment/verify`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        type: 'WALLET_RECHARGE',
                        amount: Number(amount)
                    })
                })
                
                const verifyData = await verifyRes.json()
                if (verifyData.status === 'success') {
                    showNotification('Funds added successfully! 💰')
                    setAmount('')
                    fetchWalletData()
                } else {
                    showNotification('Verification failed', 'error')
                }
            } catch (err) {
                showNotification('Payment verification error', 'error')
            }
        },
        prefill: {
            name: user?.name,
            email: user?.email,
            contact: user?.phoneNumber
        },
        theme: {
            color: "#16a34a"
        }
      }

      const rzp1 = new window.Razorpay(options)
      rzp1.open()

    } catch (error) {
      console.error('Payment Error:', error)
      showNotification('Failed to initiate payment', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTransfer = async (e) => {
      e.preventDefault()
      setIsProcessing(true)
      
      try {
          const res = await fetch(`${API_URL}/wallet/transfer`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  email: transferEmail,
                  amount: Number(transferAmount),
                  note: transferNote
              })
          })
          
          const data = await res.json()
          
          if (res.ok) {
              showNotification(`Transferred ₹${transferAmount} to ${transferEmail}`)
              setTransferEmail('')
              setTransferAmount('')
              setTransferNote('')
              fetchWalletData()
          } else {
              showNotification(data.message || 'Transfer failed', 'error')
          }
      } catch (error) {
          showNotification('Error processing transfer', 'error')
      } finally {
          setIsProcessing(false)
      }
  }

  return (
    <div className="page-container" style={{ paddingTop: '2rem' }}>
       {/* Go Back */}
       <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={{ marginBottom: '1rem' }}>
          ← Back to Dashboard
       </button>

       {/* Notification */}
       <AnimatePresence>
        {notification && (
          <motion.div 
            className={`dashboard-notification ${notification.type}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

       <div className="wallet-header">
           <h1>My Wallet 💳</h1>
           <div className="balance-card">
               <span>Current Balance</span>
               <h2>₹{balance.toLocaleString()}</h2>
           </div>
       </div>

       <div className="wallet-grid">
           {/* Left: Actions */}
           <div className="wallet-actions-card">
               <div className="tabs">
                   <button 
                    className={`tab ${activeTab === 'add_funds' ? 'active' : ''}`}
                    onClick={() => setActiveTab('add_funds')}
                   >
                       Add Funds
                   </button>
                   <button 
                    className={`tab ${activeTab === 'transfer' ? 'active' : ''}`}
                    onClick={() => setActiveTab('transfer')}
                   >
                       Transfer / Pay Worker
                   </button>
               </div>

               <div className="tab-content">
                   {activeTab === 'add_funds' ? (
                       <form onSubmit={handleAddFunds} className="fund-form">
                           <div className="form-group">
                               <label>Amount (₹)</label>
                               <input 
                                   type="number" 
                                   value={amount} 
                                   onChange={(e) => setAmount(e.target.value)} 
                                   placeholder="Enter amount to add" 
                                   min="1"
                                   required 
                               />
                           </div>
                           <button type="submit" className="btn btn-primary" disabled={isProcessing}>
                               {isProcessing ? 'Processing...' : 'Add Funds with Razorpay'}
                           </button>
                       </form>
                   ) : (
                       <form onSubmit={handleTransfer} className="fund-form">
                           <div className="alert-box">
                               💸 Send money securely to Waste Workers or Peers using their email.
                           </div>
                           <div className="form-group">
                               <label>Recipient Email</label>
                               <input 
                                   type="email" 
                                   value={transferEmail} 
                                   onChange={(e) => setTransferEmail(e.target.value)} 
                                   placeholder="worker@example.com" 
                                   required 
                               />
                           </div>
                           <div className="form-group">
                               <label>Amount (₹)</label>
                               <input 
                                   type="number" 
                                   value={transferAmount} 
                                   onChange={(e) => setTransferAmount(e.target.value)} 
                                   placeholder="0.00" 
                                   min="1"
                                   required 
                               />
                           </div>
                           <div className="form-group">
                               <label>Note (Optional)</label>
                               <input 
                                   type="text" 
                                   value={transferNote} 
                                   onChange={(e) => setTransferNote(e.target.value)} 
                                   placeholder="Payment for collection..." 
                               />
                           </div>
                           <button type="submit" className="btn btn-primary" disabled={isProcessing}>
                               {isProcessing ? 'Processing...' : 'Send Money'}
                           </button>
                       </form>
                   )}
               </div>
           </div>

           {/* Right: Transactions */}
           <div className="transactions-card">
               <h3>Transaction History</h3>
               {isLoading ? (
                   <div className="loading-spinner"></div>
               ) : transactions.length === 0 ? (
                   <p className="empty-text">No transactions yet.</p>
               ) : (
                   <div className="transaction-list">
                       {transactions.map(tx => (
                           <div key={tx._id} className="transaction-item">
                               <div className="tx-icon" style={{ background: tx.type === 'credit' ? '#dcfce7' : '#fee2e2', color: tx.type === 'credit' ? '#16a34a' : '#dc2626' }}>
                                   {tx.type === 'credit' ? '↓' : '↑'}
                               </div>
                               <div className="tx-details">
                                   <div className="tx-desc">{tx.description}</div>
                                   <div className="tx-date">{new Date(tx.timestamp).toLocaleString()}</div>
                               </div>
                               <div className={`tx-amount ${tx.type}`}>
                                   {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                               </div>
                           </div>
                       ))}
                   </div>
               )}
           </div>
       </div>

       <style>{`
          .wallet-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 2rem; border-radius: 12px; color: white; }
          .balance-card h2 { font-size: 2.5rem; margin: 0; color: #4ade80; }
          .balance-card span { color: #94a3b8; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
          
          .wallet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
          @media (max-width: 768px) { .wallet-grid { grid-template-columns: 1fr; } }
          
          .wallet-actions-card, .transactions-card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
          
          .tabs { display: flex; border-bottom: 2px solid #e2e8f0; margin-bottom: 1.5rem; }
          .tab { padding: 0.75rem 1.5rem; background: none; border: none; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; }
          .tab.active { color: #2563eb; border-bottom-color: #2563eb; }
          
          .form-group { margin-bottom: 1rem; }
          .form-group label { display: block; margin-bottom: 0.5rem; color: #475569; font-weight: 500; }
          .form-group input { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; }
          
          .transaction-list { display: flex; flex-direction: column; gap: 1rem; max-height: 400px; overflow-y: auto; }
          .transaction-item { display: flex; align-items: center; padding: 1rem; background: #f8fafc; border-radius: 8px; }
          .tx-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 1rem; }
          .tx-details { flex: 1; }
          .tx-desc { font-weight: 600; color: #1e293b; }
          .tx-date { font-size: 0.8rem; color: #64748b; }
          .tx-amount { font-weight: 700; font-size: 1.1rem; }
          .tx-amount.credit { color: #16a34a; }
          .tx-amount.debit { color: #dc2626; }
          
          .alert-box { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; }
       `}</style>
    </div>
  )
}

export default WalletPage
