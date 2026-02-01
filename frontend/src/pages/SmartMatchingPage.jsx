import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://localhost:5000/api'

const categories = [
  { value: 'plastic', label: 'Plastic', icon: '♻️' },
  { value: 'metal', label: 'Metal', icon: '🔩' },
  { value: 'paper', label: 'Paper', icon: '📄' },
  { value: 'electronic', label: 'Electronic', icon: '💻' },
  { value: 'organic', label: 'Organic', icon: '🌿' },
  { value: 'textile', label: 'Textile', icon: '👕' },
  { value: 'glass', label: 'Glass', icon: '🫙' },
  { value: 'other', label: 'Other', icon: '📦' }
]

function SmartMatchingPage() {
  const { user, getToken } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useState({
    category: '',
    quantity: '',
    location: ''
  })
  const [matches, setMatches] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [notification, setNotification] = useState(null)
  const [selectedMatch, setSelectedMatch] = useState(null)

  const token = getToken()

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    
    if (!searchParams.category) {
      showNotification('Please select a material category', 'error')
      return
    }

    setIsSearching(true)
    setHasSearched(false)

    try {
      const response = await fetch(`${API_URL}/matches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchParams)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to find matches')
      }

      setMatches(data)
      setHasSearched(true)
      
      if (data.length === 0) {
        showNotification('No matches found. Try adjusting your criteria.', 'info')
      } else {
        showNotification(`Found ${data.length} potential matches!`, 'success')
      }
    } catch (error) {
      showNotification(error.message, 'error')
    } finally {
      setIsSearching(false)
    }
  }

  const handleContactSeller = async (listing) => {
    try {
      const res = await fetch(`${API_URL}/chat/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listingId: listing._id,
          sellerId: listing.seller._id || listing.seller // Handle both populated and unpopulated cases
        })
      })

      if (res.ok) {
        const conversation = await res.json()
        navigate(`/chat/${conversation._id}`)
      } else {
        const err = await res.json()
        showNotification(err.message || 'Failed to start chat', 'error')
      }
    } catch (error) {
      console.error('Error starting chat:', error)
      showNotification('Failed to connect to server', 'error')
    }
  }

  const getScoreColor = (score) => {
    if (score >= 15) return '#22c55e'
    if (score >= 10) return '#3b82f6'
    if (score >= 5) return '#f59e0b'
    return '#94a3b8'
  }

  const getScoreLabel = (score) => {
    if (score >= 15) return 'Excellent Match'
    if (score >= 10) return 'Great Match'
    if (score >= 5) return 'Good Match'
    return 'Partial Match'
  }

  return (
    <div className="smart-matching-page">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            className={`matching-notification ${notification.type}`}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="matching-header">
        <div className="matching-header-content">
          <Link to="/dashboard" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </Link>
          <div className="header-title">
            <h1>🔗 Smart Matching</h1>
            <p>Find the perfect suppliers using AI-powered matching algorithms</p>
          </div>
        </div>
      </header>

      <main className="matching-main">
        {/* Search Panel */}
        <motion.section 
          className="search-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="search-panel-header">
            <div className="panel-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <div>
              <h2>Find Matching Suppliers</h2>
              <p>Our algorithm considers material type, location proximity, quantity availability, and pricing</p>
            </div>
          </div>

          <form className="search-form" onSubmit={handleSearch}>
            <div className="form-row">
              <div className="form-group">
                <label>Material Category *</label>
                <div className="category-grid">
                  {categories.map(cat => (
                    <button
                      type="button"
                      key={cat.value}
                      className={`category-btn ${searchParams.category === cat.value ? 'active' : ''}`}
                      onClick={() => setSearchParams({...searchParams, category: cat.value})}
                    >
                      <span className="cat-icon">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row two-cols">
              <div className="form-group">
                <label>Quantity Needed (Optional)</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    placeholder="e.g., 500"
                    value={searchParams.quantity}
                    onChange={(e) => setSearchParams({...searchParams, quantity: e.target.value})}
                    min="0"
                  />
                  <span className="unit-label">kg</span>
                </div>
              </div>
              <div className="form-group">
                <label>Preferred Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Mumbai, Delhi"
                  value={searchParams.location}
                  onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
                />
              </div>
            </div>

            <motion.button 
              type="submit" 
              className="search-btn"
              disabled={isSearching || !searchParams.category}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSearching ? (
                <>
                  <span className="spinner"></span>
                  Finding Matches...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7l3-7z"/>
                  </svg>
                  Find Best Matches
                </>
              )}
            </motion.button>
          </form>
        </motion.section>

        {/* Algorithm Info */}
        <motion.section 
          className="algorithm-info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3>🧠 How Our Matching Works</h3>
          <div className="algo-cards">
            <div className="algo-card">
              <div className="algo-icon" style={{background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)'}}>
                <span>📍</span>
              </div>
              <h4>Location Matching</h4>
              <p>+10 points for same city/region to minimize transport costs</p>
            </div>
            <div className="algo-card">
              <div className="algo-icon" style={{background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)'}}>
                <span>📦</span>
              </div>
              <h4>Quantity Scoring</h4>
              <p>+5 points for full quantity, +2 for partial availability</p>
            </div>
            <div className="algo-card">
              <div className="algo-icon" style={{background: 'linear-gradient(135deg, #fef3c7, #fde68a)'}}>
                <span>♻️</span>
              </div>
              <h4>Material Match</h4>
              <p>Exact category matching with quality considerations</p>
            </div>
            <div className="algo-card">
              <div className="algo-icon" style={{background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)'}}>
                <span>💰</span>
              </div>
              <h4>Price Optimization</h4>
              <p>Competitive pricing analysis for best value deals</p>
            </div>
          </div>
        </motion.section>

        {/* Results */}
        {hasSearched && (
          <motion.section 
            className="results-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="results-header">
              <h2>
                {matches.length > 0 
                  ? `🎯 ${matches.length} Matches Found` 
                  : '🔍 No Matches Found'
                }
              </h2>
              {matches.length > 0 && (
                <p>Sorted by compatibility score (highest first)</p>
              )}
            </div>

            {matches.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No suppliers match your criteria</h3>
                <p>Try adjusting your search parameters or check back later for new listings.</p>
              </div>
            ) : (
              <div className="results-grid">
                {matches.map((match, index) => (
                  <motion.div 
                    key={match.listing._id}
                    className="match-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="match-card-header">
                      <div className="match-rank">#{index + 1}</div>
                      <div 
                        className="match-score"
                        style={{ 
                          background: `${getScoreColor(match.score)}20`,
                          color: getScoreColor(match.score)
                        }}
                      >
                        <span className="score-value">{match.score}</span>
                        <span className="score-label">{getScoreLabel(match.score)}</span>
                      </div>
                    </div>

                    <div className="match-content">
                      <span className="match-category">
                        {categories.find(c => c.value === match.listing.category)?.icon} {match.listing.category}
                      </span>
                      <h3>{match.listing.title}</h3>
                      <p className="match-desc">{match.listing.description}</p>

                      <div className="match-details">
                        <div className="detail-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          <span>{match.listing.location}</span>
                        </div>
                        <div className="detail-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                          </svg>
                          <span>{match.listing.quantity} {match.listing.unit}</span>
                        </div>
                        <div className="detail-item price">
                          <span>₹{match.listing.price?.toLocaleString()}</span>
                        </div>
                      </div>

                      {match.matchDetails.length > 0 && (
                        <div className="match-reasons">
                          {match.matchDetails.map((detail, i) => (
                            <span key={i} className="reason-tag">✓ {detail}</span>
                          ))}
                        </div>
                      )}

                      <div className="match-seller">
                        <div className="seller-avatar">
                          {match.listing.seller?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="seller-info">
                          <span className="seller-name">{match.listing.seller?.name || 'Seller'}</span>
                          <span className="seller-label">Verified Supplier</span>
                        </div>
                      </div>
                    </div>

                    <div className="match-actions">
                      <motion.button 
                        className="btn-contact"
                        onClick={() => handleContactSeller(match.listing)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        Contact Seller
                      </motion.button>
                      <motion.button 
                        className="btn-track"
                        onClick={() => navigate(`/provenance/${match.listing._id}`)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        View Provenance
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        )}
      </main>
    </div>
  )
}

export default SmartMatchingPage
