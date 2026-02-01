import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://localhost:5000/api'

const statusConfig = {
  CREATED: { 
    icon: '📝', 
    color: '#8b5cf6', 
    bg: '#f5f3ff',
    label: 'Created'
  },
  SUBMITTED_FOR_REVIEW: { 
    icon: '📋', 
    color: '#3b82f6', 
    bg: '#eff6ff',
    label: 'Submitted for Review'
  },
  APPROVED: { 
    icon: '✅', 
    color: '#22c55e', 
    bg: '#f0fdf4',
    label: 'Approved'
  },
  REJECTED: { 
    icon: '❌', 
    color: '#ef4444', 
    bg: '#fef2f2',
    label: 'Rejected'
  },
  SOLD: { 
    icon: '🤝', 
    color: '#f59e0b', 
    bg: '#fffbeb',
    label: 'Sold'
  },
  COLLECTED: { 
    icon: '📦', 
    color: '#06b6d4', 
    bg: '#ecfeff',
    label: 'Collected'
  },
  IN_TRANSIT: { 
    icon: '🚚', 
    color: '#8b5cf6', 
    bg: '#f5f3ff',
    label: 'In Transit'
  },
  DELIVERED: { 
    icon: '📬', 
    color: '#10b981', 
    bg: '#d1fae5',
    label: 'Delivered'
  },
  RECYCLED: { 
    icon: '♻️', 
    color: '#22c55e', 
    bg: '#dcfce7',
    label: 'Recycled'
  },
  REMANUFACTURED: { 
    icon: '🏭', 
    color: '#0ea5e9', 
    bg: '#e0f2fe',
    label: 'Remanufactured'
  }
}

function ProvenancePage() {
  const { listingId } = useParams()
  const { user, getToken } = useAuth()
  const navigate = useNavigate()
  const [provenanceData, setProvenanceData] = useState(null)
  const [listing, setListing] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notification, setNotification] = useState(null)
  const [updateStatus, setUpdateStatus] = useState({
    status: '',
    details: '',
    location: ''
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)

  const token = getToken()

  useEffect(() => {
    if (listingId) {
      fetchProvenanceData()
    }
  }, [listingId])

  const fetchProvenanceData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/provenance/${listingId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch provenance data')
      }
      
      setProvenanceData(data)
    } catch (error) {
      showNotification(error.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleStatusUpdate = async (e) => {
    e.preventDefault()
    
    if (!updateStatus.status) {
      showNotification('Please select a status', 'error')
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`${API_URL}/status/${listingId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateStatus)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status')
      }

      showNotification('Status updated successfully! Blockchain record created.', 'success')
      setShowUpdateForm(false)
      setUpdateStatus({ status: '', details: '', location: '' })
      fetchProvenanceData()
    } catch (error) {
      showNotification(error.message, 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  const getAvailableStatuses = () => {
    if (!user) return []
    
    if (user.role === 'seller') {
      return ['COLLECTED', 'IN_TRANSIT']
    } else if (user.role === 'buyer') {
      return ['DELIVERED', 'RECYCLED', 'REMANUFACTURED']
    }
    return []
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatHash = (hash) => {
    if (!hash) return ''
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`
  }

  return (
    <div className="provenance-page">
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            className={`provenance-notification ${notification.type}`}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="provenance-header">
        <div className="provenance-header-content">
          <Link to="/dashboard" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Dashboard
          </Link>
          <div className="header-title">
            <h1>🔗 Material Provenance</h1>
            <p>Blockchain-inspired transparency from collection to remanufacturing</p>
          </div>
        </div>
      </header>

      <main className="provenance-main">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner-large"></div>
            <p>Loading provenance data...</p>
          </div>
        ) : !provenanceData ? (
          <div className="no-data">
            <div className="no-data-icon">🔍</div>
            <h3>No provenance data found</h3>
            <p>This listing doesn't have any tracking records yet.</p>
            <Link to="/dashboard" className="btn-back">
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Verification Banner */}
          

            {/* Update Status Form */}
            {user && getAvailableStatuses().length > 0 && (
              <motion.section 
                className="update-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="update-header" onClick={() => setShowUpdateForm(!showUpdateForm)}>
                  <div className="update-header-left">
                    <div className="update-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    </div>
                    <div>
                      <h3>Update Material Status</h3>
                      <p>Add a new record to the blockchain chain</p>
                    </div>
                  </div>
                  <motion.div 
                    className="expand-icon"
                    animate={{ rotate: showUpdateForm ? 180 : 0 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </motion.div>
                </div>

                <AnimatePresence>
                  {showUpdateForm && (
                    <motion.form 
                      className="update-form"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      onSubmit={handleStatusUpdate}
                    >
                      <div className="form-row">
                        <div className="form-group">
                          <label>New Status *</label>
                          <div className="status-options">
                            {getAvailableStatuses().map(status => (
                              <button
                                type="button"
                                key={status}
                                className={`status-option ${updateStatus.status === status ? 'active' : ''}`}
                                onClick={() => setUpdateStatus({...updateStatus, status})}
                              >
                                <span className="status-icon">{statusConfig[status]?.icon}</span>
                                <span>{statusConfig[status]?.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="form-row two-cols">
                        <div className="form-group">
                          <label>Location</label>
                          <input
                            type="text"
                            placeholder="Current location of material"
                            value={updateStatus.location}
                            onChange={(e) => setUpdateStatus({...updateStatus, location: e.target.value})}
                          />
                        </div>
                        <div className="form-group">
                          <label>Additional Details</label>
                          <input
                            type="text"
                            placeholder="Any additional notes"
                            value={updateStatus.details}
                            onChange={(e) => setUpdateStatus({...updateStatus, details: e.target.value})}
                          />
                        </div>
                      </div>

                      <motion.button 
                        type="submit" 
                        className="submit-btn"
                        disabled={isUpdating || !updateStatus.status}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isUpdating ? (
                          <>
                            <span className="spinner"></span>
                            Creating Record...
                          </>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                            Add to Blockchain
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.section>
            )}

            {/* Blockchain Timeline */}
            <motion.section 
              className="blockchain-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="blockchain-header">
                <h2>📜 Provenance Chain</h2>
                <p>Complete history of this material's journey</p>
              </div>

              <div className="blockchain-timeline">
                {provenanceData.chain?.map((record, index) => {
                  const config = statusConfig[record.action] || { icon: '📝', color: '#64748b', bg: '#f8fafc', label: record.action }
                  const isFirst = index === 0
                  const isLast = index === provenanceData.chain.length - 1

                  return (
                    <motion.div 
                      key={record._id}
                      className={`blockchain-block ${isLast ? 'latest' : ''}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="block-connector">
                        <div 
                          className="block-icon"
                          style={{ background: config.bg, color: config.color }}
                        >
                          {config.icon}
                        </div>
                        {!isLast && <div className="connector-line"></div>}
                      </div>

                      <div className="block-content">
                        <div className="block-header">
                          <h4 style={{ color: config.color }}>{config.label}</h4>
                          <span className="block-time">{formatDate(record.timestamp)}</span>
                        </div>
                        
                        <p className="block-description">{record.details}</p>

                        <div className="block-meta">
                          <div className="meta-item">
                            <span className="meta-label">Actor:</span>
                            <span className="meta-value">{record.actor?.name || 'System'} ({record.actorRole})</span>
                          </div>
                          {record.metaData?.location && (
                            <div className="meta-item">
                              <span className="meta-label">Location:</span>
                              <span className="meta-value">{record.metaData.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="block-hashes">
                          <div className="hash-item">
                            <span className="hash-label">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                              Hash:
                            </span>
                            <code className="hash-value">{formatHash(record.hash)}</code>
                          </div>
                          <div className="hash-item">
                            <span className="hash-label">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6"/>
                              </svg>
                              Previous:
                            </span>
                            <code className="hash-value">
                              {isFirst ? 'GENESIS_BLOCK' : formatHash(record.previousHash)}
                            </code>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.section>

            {/* Technical Details */}
            <motion.section 
              className="technical-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3>🔐 Technical Information</h3>
              <div className="tech-cards">
                <div className="tech-card">
                  <h4>Hashing Algorithm</h4>
                  <p>SHA-256 cryptographic hash function ensures data integrity</p>
                </div>
                <div className="tech-card">
                  <h4>Chain Linking</h4>
                  <p>Each record references the previous hash, creating an immutable chain</p>
                </div>
                <div className="tech-card">
                  <h4>Tamper Detection</h4>
                  <p>Any modification breaks the chain, making alterations detectable</p>
                </div>
              </div>
            </motion.section>
          </>
        )}
      </main>
    </div>
  )
}

export default ProvenancePage
