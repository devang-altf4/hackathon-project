import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://localhost:5000/api'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

function DashboardPage() {
  const { user, logout, getToken } = useAuth()
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('dashboard')
  const [activeView, setActiveView] = useState('overview')
  const [myListings, setMyListings] = useState([])
  const [availableListings, setAvailableListings] = useState([])
  const [myPurchases, setMyPurchases] = useState([])
  const [buyerTab, setBuyerTab] = useState('browse') // 'browse' or 'purchases'
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  const [statsFilter, setStatsFilter] = useState('thisMonth')
  const [isPurchasing, setIsPurchasing] = useState(null)
  
  // Listing form state
  const [listingForm, setListingForm] = useState({
    title: '',
    description: '',
    category: 'plastic',
    quantity: '',
    unit: 'kg',
    price: '',
    location: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const token = getToken()

  useEffect(() => {
    if (user?.role === 'seller') {
      fetchMyListings()
    } else if (user?.role === 'buyer') {
      fetchAvailableListings()
      fetchMyPurchases()
    }
  }, [user])

  const fetchMyListings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/listings/my-listings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setMyListings(data)
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableListings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/listings`)
      if (response.ok) {
        const data = await response.json()
        setAvailableListings(data)
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMyPurchases = async () => {
    try {
      const response = await fetch(`${API_URL}/purchases/my-purchases`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setMyPurchases(data)
      }
    } catch (error) {
      console.error('Error fetching purchases:', error)
    }
  }

  const handleStartChat = async (listing) => {
    setIsPurchasing(listing._id)
    try {
      const response = await fetch(`${API_URL}/chat/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listingId: listing._id,
          sellerId: listing.seller._id
        })
      })

      if (response.ok) {
        const conversation = await response.json()
        navigate(`/chat/${conversation._id}`)
      } else {
         const data = await response.json()
         showNotification(data.message || 'Failed to start chat', 'error')
      }
    } catch (error) {
      console.error('Error starting chat:', error)
      showNotification('Failed to connect to seller', 'error')
    } finally {
      setIsPurchasing(null)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#fef3c7', color: '#d97706' },
      confirmed: { bg: '#dbeafe', color: '#2563eb' },
      collected: { bg: '#e0e7ff', color: '#4f46e5' },
      in_transit: { bg: '#fae8ff', color: '#a855f7' },
      delivered: { bg: '#dcfce7', color: '#16a34a' },
      completed: { bg: '#d1fae5', color: '#059669' },
      cancelled: { bg: '#fee2e2', color: '#dc2626' }
    }
    return colors[status] || colors.pending
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleCreateListing = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_URL}/listings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(listingForm)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create listing')
      }

      showNotification('🎉 Listing submitted for review! You will be notified once approved.')
      setListingForm({
        title: '',
        description: '',
        category: 'plastic',
        quantity: '',
        unit: 'kg',
        price: '',
        location: ''
      })
      setActiveNav('my-listings')
      setActiveView('my-listings')
      fetchMyListings()
    } catch (error) {
      showNotification(error.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleNavClick = (nav) => {
    setActiveNav(nav)
    if (nav === 'dashboard') {
      setActiveView('overview')
    } else if (nav === 'my-listings') {
      setActiveView('my-listings')
      fetchMyListings()
    } else if (nav === 'create') {
      setActiveView('create')
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#d97706', text: '⏳ Pending Review' },
      approved: { bg: '#dcfce7', color: '#16a34a', text: '✅ Approved' },
      rejected: { bg: '#fee2e2', color: '#dc2626', text: '❌ Rejected' }
    }
    return styles[status] || styles.pending
  }

  const getCategoryStyle = (category) => {
    const styles = {
      plastic: { color: '#3b82f6', bg: '#eff6ff', icon: '🥤' },
      metal: { color: '#64748b', bg: '#f1f5f9', icon: '⚙️' },
      paper: { color: '#eab308', bg: '#fefce8', icon: '📄' },
      electronic: { color: '#8b5cf6', bg: '#f5f3ff', icon: '🔌' },
      organic: { color: '#22c55e', bg: '#f0fdf4', icon: '🌱' },
      glass: { color: '#06b6d4', bg: '#ecfeff', icon: '🍾' },
      textile: { color: '#ec4899', bg: '#fdf2f8', icon: '👕' }
    }
    return styles[category?.toLowerCase()] || styles.plastic
  }

  const categories = [
    { value: 'plastic', label: 'Plastic' },
    { value: 'metal', label: 'Metal' },
    { value: 'paper', label: 'Paper' },
    { value: 'electronic', label: 'Electronic' },
    { value: 'organic', label: 'Organic' },
    { value: 'textile', label: 'Textile' },
    { value: 'glass', label: 'Glass' },
    { value: 'other', label: 'Other' }
  ]

  // Calculate stats
  const activeListingsCount = myListings.filter(l => l.status === 'approved').length
  const pendingListingsCount = myListings.filter(l => l.status === 'pending').length
  const totalWaste = myListings.reduce((acc, l) => acc + (l.quantity || 0), 0)

  // ============= WASTE WORKER DASHBOARD =============
  if (user?.role === 'waste_worker') {
    return (
      <div className="worker-dashboard" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
         <nav className="navbar">
            <div className="nav-container">
                <Link to="/" className="nav-logo">
                    <div className="nav-logo-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <span>EcoLoop Worker</span>
                </Link>
                <div className="nav-actions">
                    <button onClick={handleLogout} className="btn btn-outline">Logout</button>
                </div>
            </div>
         </nav>

         <main className="page-container" style={{ paddingTop: '6rem' }}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="worker-welcome" 
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', padding: '3rem', borderRadius: '16px', marginBottom: '3rem', textAlign: 'center' }}
            >
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Welcome, {user.name} 👷</h1>
                <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>Manage your earnings, transfers, and wallet securely.</p>
            </motion.div>

            <div className="worker-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                <motion.div 
                    whileHover={{ y: -5 }}
                    onClick={() => navigate('/wallet')}
                    style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer', textAlign: 'center' }}
                >
                    <div style={{ width: '80px', height: '80px', background: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem' }}>💳</div>
                    <h2 style={{ marginBottom: '0.5rem' }}>My Wallet</h2>
                    <p style={{ color: '#64748b' }}>Check balance & transaction history</p>
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    onClick={() => navigate('/wallet')} // Wallet page handles transfers too
                    style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer', textAlign: 'center' }}
                >
                    <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem' }}>💸</div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Transfer Funds</h2>
                    <p style={{ color: '#64748b' }}>Send money to peers or withdraw</p>
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    onClick={() => window.open('https://wa.me/919876543210', '_blank')}
                    style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer', textAlign: 'center' }}
                >
                    <div style={{ width: '80px', height: '80px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem' }}>🆘</div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Support</h2>
                    <p style={{ color: '#64748b' }}>Contact Admin for help</p>
                </motion.div>
            </div>
         </main>
      </div>
    )
  }

  // ============= BUYER DASHBOARD =============
  if (user?.role === 'buyer') {
    return (
      <div className="buyer-dashboard">
        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              className={`dashboard-notification ${notification.type}`}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buyer Header */}
        <header className="buyer-header">
          <div className="buyer-header-content">
            <Link to="/" className="buyer-logo">
              <div className="logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span>EcoLoop</span>
            </Link>
            <div className="buyer-header-actions">
              <motion.button 
                className="btn-smart-match"
                onClick={() => navigate('/smart-matching')}
                whileHover={{ scale: 1.02 }}
              >
                🔗 Smart Matching
              </motion.button>
              <motion.button 
                className="btn-smart-match"
                onClick={() => navigate('/chat')}
                whileHover={{ scale: 1.02 }}
              >
                💬 Messages
              </motion.button>
              <motion.button 
                className="btn-smart-match"
                onClick={() => navigate('/wallet')}
                whileHover={{ scale: 1.02 }}
              >
                💳 Wallet
              </motion.button>
              <motion.button 
                className="btn-smart-match"
                onClick={() => navigate('/transparency')}
                whileHover={{ scale: 1.02 }}
              >
                🌐 Ledger
              </motion.button>
              <div className="buyer-user-menu">
                <span className="buyer-user-name">{user?.name}</span>
                <button className="buyer-logout" onClick={handleLogout}>Logout</button>
              </div>
            </div>
          </div>
        </header>

        {/* Buyer Main Content */}
        <main className="buyer-main">
          <div className="buyer-welcome">
            <h1>Welcome, <span className="highlight">{user?.name}</span>! 👋</h1>
            <p>Browse available materials from verified sellers in the circular economy marketplace.</p>
          </div>

          {/* Quick Stats for Buyer */}
          <div className="buyer-stats">
            <div className="buyer-stat-card">
              <span className="stat-icon">📦</span>
              <div>
                <span className="stat-number">{availableListings.length}</span>
                <span className="stat-label">Available Listings</span>
              </div>
            </div>
            <div className="buyer-stat-card">
              <span className="stat-icon">🛒</span>
              <div>
                <span className="stat-number">{myPurchases.length}</span>
                <span className="stat-label">My Purchases</span>
              </div>
            </div>
            <div className="buyer-stat-card">
              <span className="stat-icon">♻️</span>
              <div>
                <span className="stat-number">{myPurchases.reduce((acc, p) => acc + (p.quantity || 0), 0)} kg</span>
                <span className="stat-label">Materials Purchased</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="buyer-tabs">
            <button 
              className={`buyer-tab ${buyerTab === 'browse' ? 'active' : ''}`}
              onClick={() => setBuyerTab('browse')}
            >
              🛒 Browse Materials
            </button>
            <button 
              className={`buyer-tab ${buyerTab === 'purchases' ? 'active' : ''}`}
              onClick={() => setBuyerTab('purchases')}
            >
              📦 My Purchases ({myPurchases.length})
            </button>
          </div>

          {/* Browse Tab */}
          {buyerTab === 'browse' && (
            <section className="buyer-listings-section">
              <div className="section-header">
                <h2>🛒 Available Materials</h2>
                <button className="refresh-btn" onClick={fetchAvailableListings}>↻ Refresh</button>
              </div>

              {isLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading available listings...</p>
                </div>
              ) : availableListings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <h3>No materials available</h3>
                  <p>Check back later for new listings from sellers.</p>
                </div>
              ) : (
                <div className="buyer-listings-grid">
                  {availableListings.map((listing) => (
                    <motion.div 
                      key={listing._id}
                      className="buyer-listing-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4 }}
                    >
                      <div className="card-header">
                        <span className="category-badge">{listing.category}</span>
                        <span className="price-tag">₹{listing.price}</span>
                      </div>
                      <h3>{listing.title}</h3>
                      <p className="card-desc">{listing.description}</p>
                      <div className="card-details">
                        <span>📍 {listing.location}</span>
                        <span>📦 {listing.quantity} {listing.unit}</span>
                      </div>
                      <div className="card-seller">
                        <div className="seller-avatar">{listing.seller?.name?.charAt(0) || 'S'}</div>
                        <span>{listing.seller?.name || 'Seller'}</span>
                      </div>
                      <div className="card-actions">
                        <motion.button 
                          className="btn-purchase"
                          onClick={() => handleStartChat(listing)}
                          disabled={isPurchasing === listing._id}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isPurchasing === listing._id ? (
                            <>
                              <span className="loading-spinner-small"></span>
                              Connecting...
                            </>
                          ) : (
                            '💬 Chat & Offer'
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* My Purchases Tab */}
          {buyerTab === 'purchases' && (
            <section className="buyer-purchases-section">
              <div className="section-header">
                <h2>📦 My Purchases</h2>
                <button className="refresh-btn" onClick={fetchMyPurchases}>↻ Refresh</button>
              </div>

              {myPurchases.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🛒</div>
                  <h3>No purchases yet</h3>
                  <p>Start by browsing and purchasing materials from sellers.</p>
                  <motion.button 
                    className="btn-browse"
                    onClick={() => setBuyerTab('browse')}
                    whileHover={{ scale: 1.02 }}
                  >
                    Browse Materials
                  </motion.button>
                </div>
              ) : (
                <div className="purchases-grid">
                  {myPurchases.map((purchase) => (
                    <motion.div 
                      key={purchase._id}
                      className="purchase-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4 }}
                    >
                      <div className="purchase-header">
                        <span className="category-badge">{purchase.listing?.category}</span>
                        <span 
                          className="status-badge"
                          style={{ 
                            background: getStatusColor(purchase.status).bg,
                            color: getStatusColor(purchase.status).color
                          }}
                        >
                          {purchase.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3>{purchase.listing?.title}</h3>
                      <div className="purchase-info">
                        <div className="info-row">
                          <span className="label">Quantity:</span>
                          <span className="value">{purchase.quantity} {purchase.listing?.unit}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Total Price:</span>
                          <span className="value price">₹{purchase.totalPrice}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Seller:</span>
                          <span className="value">{purchase.listing?.seller?.name || 'Seller'}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Purchased:</span>
                          <span className="value">{new Date(purchase.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="purchase-actions">
                        <motion.button 
                          className="btn-track-purchase"
                          onClick={() => navigate(`/provenance/${purchase.listing?._id}`)}
                          whileTap={{ scale: 0.98 }}
                        >
                          🔗 Track Provenance
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    )
  }

  // ============= SELLER DASHBOARD =============
  return (
    <div className="seller-dashboard">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            className={`dashboard-notification ${notification.type}`}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        className="seller-sidebar"
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span>EcoLoop</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span>Dashboard</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeNav === 'my-listings' ? 'active' : ''}`}
            onClick={() => handleNavClick('my-listings')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>My Listings</span>
          </button>



          <button 
            className="sidebar-nav-item"
            onClick={() => navigate('/smart-matching')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7l3-7z"/>
            </svg>
            <span>Smart Matching</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeNav === 'chat' ? 'active' : ''}`}
            onClick={() => navigate('/chat')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Messages</span>
          </button>

          <button 
            className={`sidebar-nav-item ${activeNav === 'wallet' ? 'active' : ''}`}
            onClick={() => navigate('/wallet')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span>Wallet</span>
          </button>

          <button 
            className="sidebar-nav-item"
            onClick={() => navigate('/transparency')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
               <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>Public Ledger</span>
          </button>


        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name || 'User'}</span>
              <span className="sidebar-user-role">Seller Account</span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="seller-main">
        {/* Header */}
        <motion.header 
          className="seller-header"
          initial={{ y: -60 }}
          animate={{ y: 0 }}
        >
          <div className="header-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search waste streams, listings, or partners..." />
          </div>
          <div className="header-actions">
            <button className="header-icon-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="notification-dot"></span>
            </button>
          </div>
        </motion.header>

        {/* Content */}
        <main className="seller-content">
          {/* Overview View */}
          {activeView === 'overview' && (
            <motion.div 
              className="dashboard-overview"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Welcome Section */}
              <motion.div className="welcome-section" variants={staggerItem}>
                <h1>Welcome back, <span className="welcome-name">{user?.name || 'User'}</span>!</h1>
                <p>Here's your circular economy performance overview for today.</p>
              </motion.div>

              <div className="dashboard-layout">
                {/* Left Column */}
                <div className="dashboard-left">
                  {/* Quick Stats */}
                  <motion.div className="stats-section" variants={staggerItem}>
                    <div className="stats-header">
                      <h2>Quick Stats</h2>
                      <div className="stats-filter">
                        <button 
                          className={statsFilter === 'thisMonth' ? 'active' : ''}
                          onClick={() => setStatsFilter('thisMonth')}
                        >
                          This Month
                        </button>
                        <button 
                          className={statsFilter === 'allTime' ? 'active' : ''}
                          onClick={() => setStatsFilter('allTime')}
                        >
                          All Time
                        </button>
                      </div>
                    </div>
                    <div className="stats-cards">
                      <div className="stat-card blue">
                        <span className="stat-number">{activeListingsCount}</span>
                        <span className="stat-label">ACTIVE LISTINGS</span>
                      </div>
                      <div className="stat-card green">
                        <span className="stat-number">0</span>
                        <span className="stat-label">COMPLETED TRADES</span>
                      </div>
                      <div className="stat-card purple">
                        <span className="stat-number">₹0<small>k</small></span>
                        <span className="stat-label">TOTAL EARNINGS</span>
                      </div>
                      <div className="stat-card orange">
                        <span className="stat-number">{totalWaste}<small>kg</small></span>
                        <span className="stat-label">WASTE PROCESSED</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Recent Activity */}
                  <motion.div className="activity-section" variants={staggerItem}>
                    <div className="activity-header">
                      <h2>Recent Activity</h2>
                      <button className="view-all-link">View All</button>
                    </div>
                    <div className="activity-content">
                      <div className="activity-empty">
                        <div className="activity-empty-icon">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </div>
                        <h3>No recent activity</h3>
                        <p>Start by listing new materials or browsing available trades to kickstart your circular journey.</p>
                        <button className="browse-btn" onClick={() => handleNavClick('my-listings')}>
                          Browse Marketplace
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Right Column */}
                <div className="dashboard-right">
                  {/* Quick Actions */}
                  <motion.div className="actions-section" variants={staggerItem}>
                    <h2>Quick Actions</h2>
                    <motion.button 
                      className="action-btn-primary"
                      onClick={() => { setActiveNav('create'); setActiveView('create'); }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      List New Waste
                    </motion.button>
                    <motion.button 
                      className="action-btn-secondary"
                      onClick={() => handleNavClick('my-listings')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      View My Listings
                    </motion.button>

                  </motion.div>


                </div>
              </div>

            </motion.div>
          )}

          {/* Create Listing View */}
          {activeView === 'create' && user?.role === 'seller' && (
            <motion.div 
              className="create-listing-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="create-listing-card">
                <div className="create-listing-header">
                  <h2>📦 Create New Listing</h2>
                  <p>Your listing will be reviewed by our team before going live.</p>
                </div>

                <form className="create-listing-form" onSubmit={handleCreateListing}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Title *</label>
                      <input
                        type="text"
                        placeholder="e.g., Industrial Plastic Waste"
                        value={listingForm.title}
                        onChange={(e) => setListingForm({...listingForm, title: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        value={listingForm.category}
                        onChange={(e) => setListingForm({...listingForm, category: e.target.value})}
                        required
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Location *</label>
                      <input
                        type="text"
                        placeholder="City, State"
                        value={listingForm.location}
                        onChange={(e) => setListingForm({...listingForm, location: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row three-cols">
                    <div className="form-group">
                      <label>Quantity *</label>
                      <input
                        type="number"
                        placeholder="100"
                        value={listingForm.quantity}
                        onChange={(e) => setListingForm({...listingForm, quantity: e.target.value})}
                        required
                        min="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Unit *</label>
                      <select
                        value={listingForm.unit}
                        onChange={(e) => setListingForm({...listingForm, unit: e.target.value})}
                        required
                      >
                        <option value="kg">Kilograms</option>
                        <option value="tons">Tons</option>
                        <option value="pieces">Pieces</option>
                        <option value="liters">Liters</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Price (₹) *</label>
                      <input
                        type="number"
                        placeholder="5000"
                        value={listingForm.price}
                        onChange={(e) => setListingForm({...listingForm, price: e.target.value})}
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description *</label>
                    <textarea
                      placeholder="Describe your waste material, its condition, and any relevant details..."
                      value={listingForm.description}
                      onChange={(e) => setListingForm({...listingForm, description: e.target.value})}
                      required
                      rows={4}
                    />
                  </div>

                  <div className="form-info-box">
                    <span className="info-icon">ℹ️</span>
                    <p>Your listing will be reviewed by our admin team. Once approved, it will be visible to all buyers on the marketplace.</p>
                  </div>

                  <div className="form-actions">
                    <motion.button 
                      type="button" 
                      className="btn btn-outline"
                      onClick={() => handleNavClick('dashboard')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isSubmitting ? (
                        <span className="loading-spinner-small"></span>
                      ) : (
                        'Submit for Review'
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* My Listings View */}
          {activeView === 'my-listings' && user?.role === 'seller' && (
            <motion.div 
              className="my-listings-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="listings-page-header">
                <div>
                  <h1>My Listings</h1>
                  <p>Manage your waste listings and verify their status</p>
                </div>
                <motion.button 
                  className="btn-create-new"
                  onClick={() => { setActiveNav('create'); setActiveView('create'); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Create New Listing
                </motion.button>
              </div>

              {/* Stats Row */}
              <div className="listing-stats-row">
                <div className="l-stat-card">
                   <div className="l-stat-icon active">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                   </div>
                   <div>
                     <span className="l-stat-value">{activeListingsCount}</span>
                     <span className="l-stat-label">Active Listings</span>
                   </div>
                </div>
                <div className="l-stat-card">
                   <div className="l-stat-icon pending">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                   </div>
                   <div>
                     <span className="l-stat-value">{pendingListingsCount}</span>
                     <span className="l-stat-label">Pending Approval</span>
                   </div>
                </div>
                 <div className="l-stat-card">
                   <div className="l-stat-icon total">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                   </div>
                   <div>
                     <span className="l-stat-value">{totalWaste} <small>total</small></span>
                     <span className="l-stat-label">Volume Listed</span>
                   </div>
                </div>
             </div>

              {isLoading ? (
                <div className="loading-state-centered">
                  <div className="loading-spinner-large"></div>
                  <p>Loading your inventory...</p>
                </div>
              ) : myListings.length === 0 ? (
                <div className="empty-state-card">
                  <div className="empty-state-icon">📦</div>
                  <h3>No listings found</h3>
                  <p>You haven't listed any waste materials yet. Start your circular economy journey today.</p>
                  <motion.button 
                    className="btn btn-primary"
                    onClick={() => { setActiveNav('create'); setActiveView('create'); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    List Your First Item
                  </motion.button>
                </div>
              ) : (
                <div className="seller-listings-grid-v5">
                  {myListings.map((listing, index) => {
                    const status = getStatusBadge(listing.status)
                    const catStyle = getCategoryStyle(listing.category)
                    
                    return (
                      <motion.div 
                        key={listing._id}
                        className="v5-card"
                        variants={{
                           hidden: { opacity: 0, y: 50, scale: 0.9 },
                           visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 12, delay: index * 0.05 } }
                        }}
                        initial="hidden"
                        animate="visible"
                        whileHover={{ 
                          y: -8, 
                          boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.15)",
                          borderColor: catStyle.color
                        }}
                        layout
                        style={{ border: `2px solid ${catStyle.color}20` }}
                      >
                        {/* Visual Header */}
                        <div className="v5-card-visual" style={{ background: catStyle.bg }}>
                           <div className="v5-category-tag" style={{ color: catStyle.color, background: 'rgba(255,255,255,0.9)' }}>
                             {catStyle.icon} {listing.category}
                           </div>
                           <div className="v5-status-badge" style={{ background: status.bg, color: status.color }}>
                             {status.text}
                           </div>
                        </div>

                        <div className="v5-card-content">
                          <div className="v5-main-info">
                             <h3 className="v5-title">{listing.title}</h3>
                             <div className="v5-price-row">
                               <span className="v5-currency">₹</span>
                               <span className="v5-price">{listing.price}</span>
                               <span className="v5-unit">for {listing.quantity} {listing.unit}</span>
                             </div>
                          </div>

                          <div className="v5-details-grid">
                             <div className="v5-detail-item">
                               <span className="v5-label">Location</span>
                               <span className="v5-value">{listing.location}</span>
                             </div>
                             <div className="v5-detail-item">
                               <span className="v5-label">Listed On</span>
                               <span className="v5-value">{new Date(listing.createdAt).toLocaleDateString()}</span>
                             </div>
                          </div>


                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}

export default DashboardPage

