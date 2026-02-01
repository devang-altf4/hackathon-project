import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://localhost:5000/api'

const actionConfig = {
  CREATED: { icon: '📝', color: '#8b5cf6', bg: '#f5f3ff', label: 'Created' },
  SUBMITTED_FOR_REVIEW: { icon: '📋', color: '#3b82f6', bg: '#eff6ff', label: 'Submitted' },
  APPROVED: { icon: '✅', color: '#22c55e', bg: '#f0fdf4', label: 'Approved' },
  REJECTED: { icon: '❌', color: '#ef4444', bg: '#fef2f2', label: 'Rejected' },
  SOLD: { icon: '🤝', color: '#f59e0b', bg: '#fffbeb', label: 'Sold' },
  COLLECTED: { icon: '📦', color: '#06b6d4', bg: '#ecfeff', label: 'Collected' },
  IN_TRANSIT: { icon: '🚚', color: '#8b5cf6', bg: '#f5f3ff', label: 'In Transit' },
  DELIVERED: { icon: '📬', color: '#10b981', bg: '#d1fae5', label: 'Delivered' },
  RECYCLED: { icon: '♻️', color: '#22c55e', bg: '#dcfce7', label: 'Recycled' },
  REMANUFACTURED: { icon: '🏭', color: '#0ea5e9', bg: '#e0f2fe', label: 'Remanufactured' }
}

function TransparencyPage() {
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const res = await fetch(`${API_URL}/public/provenance`)
      if (res.ok) {
        const data = await res.json()
        setRecords(data)
      }
    } catch (err) {
      console.error('Error fetching provenance records', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="ledger-page">
      {/* Header */}
      <header className="ledger-header">
        <div className="ledger-header-container">
          <Link to="/" className="ledger-logo">
            <div className="ledger-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span>EcoLoop Ledger</span>
          </Link>
          <div className="ledger-nav-actions">
            {user ? (
              <>
                <Link to="/dashboard" className="ledger-btn ledger-btn-outline">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="ledger-btn ledger-btn-ghost">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="ledger-btn ledger-btn-outline">Login</Link>
                <Link to="/signup" className="ledger-btn ledger-btn-primary">Join Now</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="ledger-hero">
        <motion.div 
          className="ledger-hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="ledger-hero-badge">
            <span>🔗</span> Blockchain-Powered Transparency
          </div>
          <h1>Public Provenance Ledger</h1>
          <p>Track the complete journey of waste materials in real-time. Every transaction is cryptographically verified and immutable.</p>
          <div className="ledger-stats">
            <div className="ledger-stat">
              <span className="ledger-stat-number">{records.length}</span>
              <span className="ledger-stat-label">Total Records</span>
            </div>
            <div className="ledger-stat">
              <span className="ledger-stat-number">
                {records.filter(r => r.action === 'RECYCLED' || r.action === 'REMANUFACTURED').length}
              </span>
              <span className="ledger-stat-label">Items Recycled</span>
            </div>
            <div className="ledger-stat">
              <span className="ledger-stat-number">100%</span>
              <span className="ledger-stat-label">Verified</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      <main className="ledger-main">
        <div className="ledger-container">
          {isLoading ? (
            <div className="ledger-loading">
              <div className="ledger-spinner"></div>
              <p>Loading provenance records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="ledger-empty">
              <div className="ledger-empty-icon">📭</div>
              <h3>No Records Yet</h3>
              <p>The ledger is empty. Records will appear here as transactions occur.</p>
            </div>
          ) : (
            <motion.div 
              className="ledger-table-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="ledger-table-header">
                <h2>📜 Transaction Records</h2>
                <span className="ledger-record-count">{records.length} records</span>
              </div>
              <div className="ledger-table-wrapper">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Material</th>
                      <th>Actor</th>
                      <th>Details</th>
                      <th>Block Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => {
                      const config = actionConfig[record.action] || { icon: '📝', color: '#64748b', bg: '#f8fafc', label: record.action }
                      return (
                        <motion.tr 
                          key={record._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <td className="ledger-td-timestamp">
                            <div className="ledger-timestamp">
                              <span className="ledger-date">{formatDate(record.timestamp).split(',')[0]}</span>
                              <span className="ledger-time">{formatDate(record.timestamp).split(',')[1]}</span>
                            </div>
                          </td>
                          <td>
                            <span 
                              className="ledger-action-badge"
                              style={{ backgroundColor: config.bg, color: config.color }}
                            >
                              <span>{config.icon}</span>
                              {config.label}
                            </span>
                          </td>
                          <td className="ledger-td-material">
                            <div className="ledger-material">
                              <span className="ledger-material-title">
                                {record.listingId?.title || 'Unknown Item'}
                              </span>
                              {record.listingId?.quantity && (
                                <span className="ledger-material-qty">
                                  {record.listingId.quantity} {record.listingId.unit}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="ledger-td-actor">
                            <div className="ledger-actor">
                              <span className="ledger-actor-name">{record.actor?.name || 'System'}</span>
                              <span className="ledger-actor-role">{record.actorRole}</span>
                            </div>
                          </td>
                          <td className="ledger-td-details">
                            <span className="ledger-details" title={record.details}>
                              {record.details}
                            </span>
                          </td>
                          <td className="ledger-td-hash">
                            <code className="ledger-hash" title={record.hash}>
                              {record.hash.substring(0, 12)}...
                            </code>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="ledger-footer">
        <p>🔐 All records are cryptographically secured using SHA-256 hashing</p>
      </footer>
    </div>
  )
}

export default TransparencyPage
