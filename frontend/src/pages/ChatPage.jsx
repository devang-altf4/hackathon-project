import { useState, useEffect, useRef } from 'react'
// Force rebuild
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = 'http://localhost:5000/api'
const SOCKET_URL = 'http://localhost:5000'

export function ChatPage() {
  const { user, getToken } = useAuth()
  const navigate = useNavigate()
  const { conversationId } = useParams()
  const token = getToken()

  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')

  const [walletBalance, setWalletBalance] = useState(0)
  
  const [socket, setSocket] = useState(null)
  const [showOfferModal, setShowOfferModal] = useState(false)
  
  // Offer Form State
  const [offerPrice, setOfferPrice] = useState('')
  const [offerQuantity, setOfferQuantity] = useState('')

  const messagesEndRef = useRef(null)

  // Initialize Socket
  useEffect(() => {
    const newSocket = io(SOCKET_URL)
    setSocket(newSocket)
    return () => newSocket.disconnect()
  }, [])

  // Fetch Wallet Balance
  useEffect(() => {
     if (user) {
        fetch(`${API_URL}/wallet`, {
           headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setWalletBalance(data.balance))
        .catch(err => console.error(err))
     }
  }, [user])

  // Fetch Conversations
  useEffect(() => {
    fetchConversations()
  }, [])

  // Join Room & Fetch Messages when active conversation changes
  useEffect(() => {
    if (activeConversation && socket) {
      console.log('Joining conversation:', activeConversation._id)
      socket.emit('join_conversation', activeConversation._id)
      fetchMessages(activeConversation._id)

      // Listen for incoming messages
      socket.on('receive_message', (message) => {
        setMessages((prev) => [...prev, message])
        scrollToBottom()
      })

      return () => {
        socket.off('receive_message')
      }
    }
  }, [activeConversation, socket])

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchConversations = async () => {
    try {
      console.log('Fetching conversations...')
      const res = await fetch(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        console.log('Conversations fetched:', data)
        setConversations(data)
        if (conversationId) {
             const target = data.find(c => c._id === conversationId);
             if (target) setActiveConversation(target);
        } else if (data.length > 0 && !activeConversation) {
          setActiveConversation(data[0]) 
        }
      } else {
        console.error('Failed to fetch conversations:', res.status, res.statusText)
      }
    } catch (err) {
      console.error('Error fetching conversations', err)
    }
  }

  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`${API_URL}/chat/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (err) {
      console.error('Error fetching messages', err)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const res = await fetch(`${API_URL}/chat/${activeConversation._id}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newMessage, type: 'text' })
      })

      if (res.ok) {
        const message = await res.json()
        socket.emit('send_message', { conversationId: activeConversation._id, message })
        setMessages((prev) => [...prev, message])
        setNewMessage('')
      }
    } catch (err) {
      console.error('Error sending message', err)
    }
  }

  const sendOffer = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/${activeConversation._id}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: `Offer: ${offerQuantity} ${activeConversation.listing.unit} for ₹${offerPrice}`,
          type: 'offer',
          offerDetails: {
            price: Number(offerPrice),
            quantity: Number(offerQuantity),
            status: 'pending'
          }
        })
      })

      if (res.ok) {
        const message = await res.json()
        socket.emit('send_message', { conversationId: activeConversation._id, message })
        setMessages((prev) => [...prev, message])
        setShowOfferModal(false)
      }
    } catch (err) {
      console.error('Error sending offer', err)
    }
  }

  const acceptOffer = async (message) => {
    try {
      const res = await fetch(`${API_URL}/chat/${activeConversation._id}/messages/${message._id}/accept`, {
         method: 'PUT',
         headers: { Authorization: `Bearer ${token}` }
      });
       if (res.ok) {
          const updatedMessage = await res.json();
           fetchMessages(activeConversation._id);
       }
    } catch (err) {
       console.error("Error accepting offer", err);
    }
  }

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }



  const handlePayWallet = async (purchaseId, amount) => {
     if (!window.confirm(`Pay ₹${amount} using Wallet Balance (Current: ₹${walletBalance})?`)) return;

     try {
        const res = await fetch(`${API_URL}/payment/pay-wallet`, {
           method: 'POST',
           headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
           },
           body: JSON.stringify({ purchaseId })
        })

        const data = await res.json()
        if (res.ok) {
           alert("Payment Successful via Wallet!")
           setWalletBalance(prev => prev - amount)
           navigate(`/provenance/${activeConversation.listing._id}`)
        } else {
           alert(data.message || "Wallet payment failed")
        }
     } catch (err) {
        console.error("Wallet Pay Error", err)
     }
  }

  const handlePay = async (offerDetails) => {
     try {
        const purchaseRes = await fetch(`${API_URL}/purchases`, {
              method: 'POST',
              headers: {
                 Authorization: `Bearer ${token}`,
                 'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                 listingId: activeConversation.listing._id,
                 quantity: offerDetails.quantity,
                 notes: 'Payment Processing',
                 status: 'pending', 
                 paymentStatus: 'pending'
              })
        });

        if(!purchaseRes.ok) throw new Error("Failed to create purchase record");
        const purchase = await purchaseRes.json();

        if (walletBalance >= offerDetails.price) {
           if (window.confirm(`You have sufficient wallet balance (₹${walletBalance}).\nClick OK to Pay with Wallet.\nClick Cancel to pay via Razorpay.`)) {
              handlePayWallet(purchase._id, offerDetails.price);
              return;
           }
        }

        const res = await loadRazorpay()
        if (!res) {
           alert('Razorpay SDK failed to load. Are you online?')
           return
        }

        const orderRes = await fetch(`${API_URL}/payment/create-order`, {
           method: 'POST',
           headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
           body: JSON.stringify({
              amount: offerDetails.price,
              currency: 'INR',
              receipt: `receipt_${Date.now()}`,
              notes: { listingId: activeConversation.listing._id, buyerId: user.id, type: 'PURCHASE' }
           })
        });

        if (!orderRes.ok) throw new Error("Failed to create order");
        const orderData = await orderRes.json();

        const options = {
           key: import.meta.env.VITE_RAZORPAY_KEY_ID,
           amount: orderData.amount,
           currency: orderData.currency,
           name: "EcoLoop Marketplace",
           description: `Payment for ${activeConversation.listing.title}`,
           order_id: orderData.id,
           handler: async function (response) {
              try {
                  const verifyRes = await fetch(`${API_URL}/payment/verify`, {
                     method: 'POST',
                     headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        purchaseId: purchase._id,
                        type: 'PURCHASE'
                     })
                  });
                  const verifyData = await verifyRes.json();
                  if (verifyData.status === 'success') {
                     alert("Payment Successful! Redirecting...");
                     navigate(`/provenance/${purchase.listing._id}`);
                  } else {
                     alert("Payment Verification Failed");
                  }
              } catch (err) {
                 console.error("Verification error", err);
              }
           },
           prefill: { name: user.name, email: user.email, contact: user.phoneNumber },
           theme: { color: "#3399cc" }
        };
        const rzp1 = new window.Razorpay(options);
        rzp1.open();

     } catch (err) {
        console.error("Payment initiation failed", err);
        alert("Could not initiate payment.");
     }
  }

  const dispatchOrder = async (message) => {
     if(!window.confirm("Confirm dispatch of this order?")) return;

     try {
        const res = await fetch(`${API_URL}/purchases/${message.orderDetails.purchaseId}/status`, {
           method: 'PUT',
           headers: { 
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json'
           },
           body: JSON.stringify({ status: 'in_transit' })
        });

        if (res.ok) {
           // Emit socket event to notify other party (optional, but good)
           // socket.emit('order_update', { conversationId: activeConversation._id });
           fetchMessages(activeConversation._id);
        }
     } catch (err) {
        console.error("Error dispatching order", err);
     }
  }

  // Helper to get the other participant in the conversation

  const getOtherParticipant = (conv) => {
     if (!conv || !conv.participants || !user) return null;
     return conv.participants.find(p => p._id !== user.id) || conv.participants[0];
  }

  // Helper to generate a consistent color based on the name
  const getColorForName = (name) => {
      if (!name) return '#00a884';
      const colors = ['#00a884', '#25d366', '#128c7e', '#075e54', '#34b7f1', '#00acc1'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-sidebar">
          <div className="sidebar-header">
             <h2>💬 Chats</h2>
          </div>
          <div className="conversations-list">
             {conversations.length === 0 ? (
                <div className="no-conversations" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                   <p>No conversations yet.</p>
                </div>
             ) : (
                 conversations.map(conv => {
                    const otherUser = getOtherParticipant(conv);
                    const initial = otherUser?.name?.[0]?.toUpperCase() || '?';
                    const avatarColor = getColorForName(otherUser?.name);
    
                    return (
                      <div 
                         key={conv._id} 
                         className={`conversation-item ${activeConversation?._id === conv._id ? 'active' : ''}`}
                         onClick={() => setActiveConversation(conv)}
                      >
                         <div className="conv-avatar" style={{ backgroundColor: avatarColor }}>
                            {initial}
                         </div>
                         <div className="conv-info">
                            <h4>{otherUser?.name || 'User'}</h4>
                            <p>{conv.lastMessage}</p>
                         </div>
                      </div>
                    );
                 })
             )}
          </div>
        </div>

        <div className="chat-main">
           {activeConversation ? (
              <>
                 <header className="chat-header">
                    <button className="back-btn" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
                       ←
                    </button>
                    <div className="header-avatar" style={{ backgroundColor: getColorForName(getOtherParticipant(activeConversation)?.name) }}>
                       {getOtherParticipant(activeConversation)?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="chat-header-info">
                       <h3>{getOtherParticipant(activeConversation)?.name || 'User'}</h3>
                       <span>{activeConversation.listing?.title}</span>
                    </div>
                    {user.role === 'buyer' && (
                       <button className="btn-offer" onClick={() => {
                          setOfferPrice(activeConversation.listing?.price || '');
                          setOfferQuantity(activeConversation.listing?.quantity || '');
                          setShowOfferModal(true);
                       }}>
                          💰 Make Offer
                       </button>
                    )}
                 </header>

                 <div className="messages-area">
                    {messages.map(msg => (
                       <div key={msg._id} className={`message-bubble ${msg.sender._id === user.id ? 'sent' : 'received'} ${msg.type}`}>
                          {msg.type === 'text' && <p>{msg.content}</p>}
                          
                          {msg.type === 'system' && <p className="system-msg">{msg.content}</p>}

                          {msg.type === 'offer' && (
                             <div className="offer-card">
                                <h4>💰 Offer Received</h4>
                                <div className="offer-details">
                                   <p>Price: ₹{msg.offerDetails.price}</p>
                                   <p>Quantity: {msg.offerDetails.quantity}</p>
                                   <p className={`offer-status ${msg.offerDetails.status}`}>{msg.offerDetails.status}</p>
                                </div>
                                {user.role === 'seller' && msg.offerDetails.status === 'pending' && (
                                   <button className="btn-accept" onClick={() => acceptOffer(msg)}>✅ Accept Offer</button>
                                )}
                                {user.role === 'buyer' && msg.offerDetails.status === 'accepted' && (
                                   <button className="btn-pay" onClick={() => handlePay(msg.offerDetails)}>💳 Pay Now</button>
                                )}
                             </div>
                          )}

                          {msg.type === 'order' && (
                             <div className="offer-card" style={{ borderLeft: '4px solid #4CAF50' }}>
                                <h4>📦 Order Confirmed</h4>
                                <div className="offer-details">
                                   <p><strong>Price:</strong> ₹{msg.orderDetails?.price}</p>
                                   <p><strong>Quantity:</strong> {msg.orderDetails?.quantity}</p>
                                   <p className={`offer-status ${msg.orderDetails?.status}`}>
                                      Status: {msg.orderDetails?.status}
                                   </p>
                                </div>
                                {user.role === 'seller' && msg.orderDetails?.status === 'pending' && (
                                   <button className="btn-accept" onClick={() => dispatchOrder(msg)}>
                                      🚚 Dispatch Order
                                   </button>
                                )}
                                {msg.orderDetails?.status === 'dispatched' && (
                                   <div style={{ marginTop: '10px', color: '#4CAF50', fontWeight: 'bold' }}>
                                      ✅ Order Dispatched
                                   </div>
                                )}
                             </div>
                          )}
                          <span className="msg-time">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       </div>
                    ))}
                    <div ref={messagesEndRef} />
                 </div>

                 <form className="chat-input-area" onSubmit={sendMessage}>
                    <input 
                       type="text" 
                       placeholder="Type a message..." 
                       value={newMessage}
                       onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit">➤</button>
                 </form>
              </>
           ) : (
              <div className="no-chat-selected">
                 <h3>Select a conversation to start chatting</h3>
              </div>
           )}
        </div>
      </div>

      {showOfferModal && (
        <div className="modal-overlay">
           <div className="modal-content">
              <h3>Make an Offer</h3>
              <div className="form-group">
                 <label>Price (₹)</label>
                 <input type="number" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} />
              </div>
              <div className="form-group">
                 <label>Quantity</label>
                 <input type="number" value={offerQuantity} onChange={e => setOfferQuantity(e.target.value)} />
              </div>
              <div className="modal-actions">
                 <button onClick={() => setShowOfferModal(false)}>Cancel</button>
                 <button className="btn-primary" onClick={sendOffer}>Send Offer</button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

// End of file
