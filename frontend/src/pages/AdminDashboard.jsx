import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'react-qr-code'

const API_URL = 'http://localhost:5000/api'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

function AdminDashboard() {
  const [pendingListings, setPendingListings] = useState([])
  const [allListings, setAllListings] = useState([])
  const [activeTab, setActiveTab] = useState('pending')
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [notification, setNotification] = useState(null)
  const [selectedListing, setSelectedListing] = useState(null)
  
  // WhatsApp State
  const [whatsappStatus, setWhatsappStatus] = useState({ qr: null, ready: false })

  const navigate = useNavigate()

  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}')
  const token = localStorage.getItem('admin_token')

  useEffect(() => {
    if (!token) {
      navigate('/admin')
      return
    }
    fetchListings()
    
    // Poll for WhatsApp Status
    const pollInterval = setInterval(fetchWhatsAppStatus, 3000)
    return () => clearInterval(pollInterval)
  }, [token, navigate])

  const fetchWhatsAppStatus = async () => {
      try {
          const res = await fetch(`${API_URL}/admin/whatsapp/status`, {
              headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
              const data = await res.json()
              setWhatsappStatus(data)
          }
      } catch (err) {
          console.error("Error fetching WhatsApp status", err)
      }
  }

  const fetchListings = async () => {
    setIsLoading(true)
    try {
      const [pendingRes, allRes] = await Promise.all([
        fetch(`${API_URL}/admin/listings/pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/admin/listings/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (pendingRes.ok && allRes.ok) {
        const pendingData = await pendingRes.json()
        const allData = await allRes.json()
        setPendingListings(pendingData)
        setAllListings(allData)
      } else {
        throw new Error('Failed to fetch listings')
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
      showNotification('Error fetching listings. Please refresh.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      const response = await fetch(`${API_URL}/admin/listings/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminNotes: 'Approved by admin' })
      })

      if (!response.ok) throw new Error('Failed to approve')

      showNotification('✅ Listing approved! Seller has been notified.')
      setSelectedListing(null)
      fetchListings()
    } catch (error) {
      showNotification('Error approving listing', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    setActionLoading(id)
    try {
      const response = await fetch(`${API_URL}/admin/listings/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adminNotes: 'Does not meet our guidelines' })
      })

      if (!response.ok) throw new Error('Failed to reject')

      showNotification('Listing rejected')
      setSelectedListing(null)
      fetchListings()
    } catch (error) {
      showNotification('Error rejecting listing', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/admin')
  }

  const getCategoryIcon = (category) => {
    const icons = {
      plastic: '🧴', metal: '🔩', paper: '📄', electronic: '💻',
      organic: '🌿', textile: '👕', glass: '🪟', other: '📦'
    }
    return icons[category] || '📦'
  }

  const getCategoryColor = (category) => {
    const colors = {
      plastic: '#3b82f6', metal: '#6b7280', paper: '#f59e0b', electronic: '#8b5cf6',
      organic: '#22c55e', textile: '#ec4899', glass: '#06b6d4', other: '#9ca3af'
    }
    return colors[category] || colors.other
  }

  const getStatusConfig = (status) => {
    const configs = {
      pending: { bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#b45309', text: 'Pending', icon: '⏳' },
      approved: { bg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', color: '#15803d', text: 'Approved', icon: '✅' },
      rejected: { bg: 'linear-gradient(135deg, #fee2e2, #fecaca)', color: '#b91c1c', text: 'Rejected', icon: '❌' }
    }
    return configs[status] || configs.pending
  }

  const displayListings = activeTab === 'pending' ? pendingListings : allListings

  return (
    <div className="admin-dashboard">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            className={`admin-notification ${notification.type}`}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listing Detail Modal */}
      <AnimatePresence>
        {selectedListing && (
          <motion.div 
            className="admin-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedListing(null)}
          >
            <motion.div 
              className="admin-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-category" style={{ backgroundColor: getCategoryColor(selectedListing.category) }}>
                  {getCategoryIcon(selectedListing.category)} {selectedListing.category}
                </div>
                <button className="modal-close" onClick={() => setSelectedListing(null)}>✕</button>
              </div>
              
              <h2>{selectedListing.title}</h2>
              <p className="modal-description">{selectedListing.description}</p>
              
              <div className="modal-details">
                <div className="modal-detail">
                  <span className="detail-icon">📍</span>
                  <div>
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{selectedListing.location}</span>
                  </div>
                </div>
                <div className="modal-detail">
                  <span className="detail-icon">📦</span>
                  <div>
                    <span className="detail-label">Quantity</span>
                    <span className="detail-value">{selectedListing.quantity} {selectedListing.unit}</span>
                  </div>
                </div>
                <div className="modal-detail">
                  <span className="detail-icon">💰</span>
                  <div>
                    <span className="detail-label">Price</span>
                    <span className="detail-value">₹{selectedListing.price?.toLocaleString()}</span>
                  </div>
                </div>
                <div className="modal-detail">
                  <span className="detail-icon">👤</span>
                  <div>
                    <span className="detail-label">Seller</span>
                    <span className="detail-value">{selectedListing.seller?.name || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div className="modal-meta">
                <span>📅 Submitted: {new Date(selectedListing.createdAt).toLocaleDateString('en-IN', { 
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}</span>
              </div>

              {selectedListing.status === 'pending' && (
                <div className="modal-actions">
                  <motion.button 
                    className="modal-btn reject"
                    onClick={() => handleReject(selectedListing._id)}
                    disabled={actionLoading === selectedListing._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ✕ Reject
                  </motion.button>
                  <motion.button 
                    className="modal-btn approve"
                    onClick={() => handleApprove(selectedListing._id)}
                    disabled={actionLoading === selectedListing._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {actionLoading === selectedListing._id ? (
                      <span className="loading-spinner-small"></span>
                    ) : (
                      <>✓ Approve Listing</>
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header 
        className="admin-header"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="admin-header-content">
          <div className="admin-header-left">
            <motion.div 
              className="admin-logo-small"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </motion.div>
            <div>
              <h1>Admin Dashboard</h1>
              <p>EcoLoop Management Console</p>
            </div>
          </div>
          <div className="admin-header-right">
            <div className="admin-user-badge">
              <span className="admin-avatar">👑</span>
              <span className="admin-user-name">{adminUser.name || 'Admin'}</span>
            </div>
            <motion.button 
              className="admin-logout-btn"
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="admin-main">
        {/* WhatsApp Status Section */}
        <motion.div 
            className="whatsapp-section"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '2rem', padding: '1.5rem', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
        >
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#25D366' }}>💬</span> WhatsApp Notification Service
            </h2>
            
            {whatsappStatus.ready ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#15803d', background: '#dcfce7', padding: '1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <div>
                        <strong>Service Active</strong>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Sellers will receive automated updates on approval.</p>
                    </div>
                </div>
            ) : whatsappStatus.qr ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                        <QRCode value={whatsappStatus.qr} size={180} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>Scan to Enable Notifications</h3>
                        <p style={{ margin: 0, color: '#64748b' }}>Open WhatsApp on your phone {'>'} Menu {'>'} Linked Devices {'>'} Link a Device</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#b45309', background: '#fef3c7', padding: '1rem', borderRadius: '8px' }}>
                    <span className="loading-spinner-small"></span>
                    <div>
                        <strong>Initializing Service...</strong>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Please wait while we generate the connection QR code.</p>
                    </div>
                </div>
            )}
            
            <motion.button
                onClick={async () => {
                    if (confirm('Are you sure you want to restart the WhatsApp service? This will disconnect any active session.')) {
                        setWhatsappStatus(prev => ({ ...prev, qr: null, ready: false }));
                        try {
                            const res = await fetch(`${API_URL}/admin/whatsapp/reset`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (res.ok) showNotification('WhatsApp Service Restarting...', 'info');
                            else showNotification('Failed to restart service', 'error');
                        } catch (e) {
                            showNotification('Error resetting service', 'error');
                        }
                    }
                }}
                style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', color: '#475569' }}
                whileHover={{ background: '#cbd5e1' }}
            >
                🔄 Reset Service
            </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          className="admin-stats"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="admin-stat-card pending" variants={staggerItem}>
            <div className="stat-icon-wrapper pending">
              <span>⏳</span>
            </div>
            <div className="stat-info">
              <span className="stat-value">{pendingListings.length}</span>
              <span className="stat-label">Pending Review</span>
            </div>
            <div className="stat-decoration"></div>
          </motion.div>
          
          <motion.div className="admin-stat-card approved" variants={staggerItem}>
            <div className="stat-icon-wrapper approved">
              <span>✅</span>
            </div>
            <div className="stat-info">
              <span className="stat-value">{allListings.filter(l => l.status === 'approved').length}</span>
              <span className="stat-label">Approved</span>
            </div>
            <div className="stat-decoration"></div>
          </motion.div>
          
          <motion.div className="admin-stat-card rejected" variants={staggerItem}>
            <div className="stat-icon-wrapper rejected">
              <span>❌</span>
            </div>
            <div className="stat-info">
              <span className="stat-value">{allListings.filter(l => l.status === 'rejected').length}</span>
              <span className="stat-label">Rejected</span>
            </div>
            <div className="stat-decoration"></div>
          </motion.div>
          
          <motion.div className="admin-stat-card total" variants={staggerItem}>
            <div className="stat-icon-wrapper total">
              <span>📊</span>
            </div>
            <div className="stat-info">
              <span className="stat-value">{allListings.length}</span>
              <span className="stat-label">Total Listings</span>
            </div>
            <div className="stat-decoration"></div>
          </motion.div>
        </motion.div>

        {/* Tabs & Refresh */}
        <div className="admin-controls">
          <div className="admin-tabs">
            <button 
              className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <span className="tab-icon">⏳</span>
              Pending ({pendingListings.length})
            </button>
            <button 
              className={`admin-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span className="tab-icon">📋</span>
              All Listings ({allListings.length})
            </button>
          </div>
          <motion.button 
            className="admin-refresh-btn"
            onClick={fetchListings}
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄
          </motion.button>
        </div>

        {/* Listings Grid */}
        <motion.div 
          className="admin-listings-container"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          {isLoading ? (
            <div className="admin-loading">
              <motion.div 
                className="loading-spinner-large"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p>Loading listings...</p>
            </div>
          ) : displayListings.length === 0 ? (
            <motion.div 
              className="admin-empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="empty-illustration">
                {activeTab === 'pending' ? '🎉' : '📭'}
              </div>
              <h3>{activeTab === 'pending' ? 'All caught up!' : 'No listings yet'}</h3>
              <p>{activeTab === 'pending' 
                ? 'There are no pending listings to review. Great job!' 
                : 'Listings will appear here once sellers create them.'}</p>
            </motion.div>
          ) : (
            <motion.div 
              className="admin-listings-grid"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {displayListings.map((listing) => {
                const statusConfig = getStatusConfig(listing.status)
                return (
                  <motion.div 
                    key={listing._id}
                    className="admin-listing-card"
                    variants={staggerItem}
                    whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}
                    onClick={() => setSelectedListing(listing)}
                  >
                    <div className="listing-card-header">
                      <div 
                        className="category-badge"
                        style={{ backgroundColor: getCategoryColor(listing.category) }}
                      >
                        {getCategoryIcon(listing.category)} {listing.category}
                      </div>
                      <div 
                        className="status-badge"
                        style={{ background: statusConfig.bg, color: statusConfig.color }}
                      >
                        {statusConfig.icon} {statusConfig.text}
                      </div>
                    </div>

                    <h3 className="listing-title">{listing.title}</h3>
                    <p className="listing-description">{listing.description}</p>

                    <div className="listing-quick-info">
                      <span>📍 {listing.location}</span>
                      <span>📦 {listing.quantity} {listing.unit}</span>
                      <span className="listing-price">₹{listing.price?.toLocaleString()}</span>
                    </div>

                    <div className="listing-footer">
                      <div className="listing-seller-info">
                        <span className="seller-avatar">👤</span>
                        <span>{listing.seller?.name || 'Unknown Seller'}</span>
                      </div>
                      <span className="listing-date">
                        {new Date(listing.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    {listing.status === 'pending' && (
                      <div className="listing-actions">
                        <motion.button 
                          className="action-btn approve"
                          onClick={(e) => { e.stopPropagation(); handleApprove(listing._id); }}
                          disabled={actionLoading === listing._id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {actionLoading === listing._id ? '...' : '✓ Approve'}
                        </motion.button>
                        <motion.button 
                          className="action-btn reject"
                          onClick={(e) => { e.stopPropagation(); handleReject(listing._id); }}
                          disabled={actionLoading === listing._id}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          ✕ Reject
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="admin-footer">
        <p>EcoLoop Admin Panel • {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default AdminDashboard
