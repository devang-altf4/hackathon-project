import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const API_URL = 'http://localhost:5000/api'

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] } }
}

const fadeInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] } }
}

const fadeInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

// Animated Logo Component
function AnimatedLogo({ size = 120 }) {
  return (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 1, type: "spring", stiffness: 100 }}
    >
      <motion.circle 
        cx="50" 
        cy="50" 
        r="45" 
        stroke="url(#signupGradient1)" 
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="80 200"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "50px 50px" }}
      />
      <motion.circle 
        cx="50" 
        cy="50" 
        r="32" 
        stroke="url(#signupGradient2)" 
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="60 150"
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "50px 50px" }}
      />
      <motion.circle 
        cx="50" 
        cy="50" 
        r="20" 
        stroke="url(#signupGradient1)" 
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="40 100"
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "50px 50px" }}
      />
      <motion.circle 
        cx="50" 
        cy="50" 
        r="8" 
        fill="url(#signupGradient1)"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Recycling arrows */}
      <motion.path 
        d="M50 20 L58 30 L50 30 Z" 
        fill="#4ade80"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "50px 50px" }}
      />
      <motion.path 
        d="M75 55 L75 65 L65 55 Z" 
        fill="#22c55e"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1.33 }}
        style={{ transformOrigin: "50px 50px" }}
      />
      <motion.path 
        d="M25 55 L35 55 L25 65 Z" 
        fill="#16a34a"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 2.66 }}
        style={{ transformOrigin: "50px 50px" }}
      />
      <defs>
        <linearGradient id="signupGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id="signupGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
      </defs>
    </motion.svg>
  )
}

// Role options - only Buyer and Seller
const roles = [
  { 
    id: 'seller', 
    label: 'Seller',
    description: 'I generate & sell industrial waste'
  },
  { 
    id: 'buyer', 
    label: 'Buyer',
    description: 'I buy & recycle waste materials'
  },
  {
    id: 'waste_worker',
    label: 'Waste Worker',
    description: 'I collect & sort waste materials'
  }
]

function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState('seller')
  const [showPassword, setShowPassword] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!agreeTerms) {
      setError('Please agree to the Terms and Conditions')
      return
    }

    setIsLoading(true)

    try {
      // Call backend API for registration
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          email,
          phoneNumber,
          password,
          role: selectedRole
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      // Store token and user data
      localStorage.setItem('token', data.token)
      login({
        id: data.user.id,
        email,
        name: data.user.name,
        role: data.user.role,
        userType: data.user.role
      })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page login-page">
      {/* Left Panel - Branding (Same as Login) */}
      <motion.div 
        className="auth-branding"
        initial="hidden"
        animate="visible"
        variants={fadeInLeft}
      >
        <div className="auth-branding-content">
          <motion.div 
            className="auth-logo-large"
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <AnimatedLogo size={200} />
          </motion.div>
          
          <motion.div 
            className="auth-branding-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </motion.div>
          
          <motion.h1 
            className="auth-branding-title"
            variants={fadeInUp}
          >
            Join the<br />
            <span className="text-gradient">EcoLoop</span>
          </motion.h1>
          
          <motion.p 
            className="auth-branding-text"
            variants={fadeInUp}
          >
            Start your journey in the circular economy. Connect with businesses, trade waste materials, and make a positive environmental impact.
          </motion.p>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <motion.div 
        className="auth-form-panel"
        initial="hidden"
        animate="visible"
        variants={fadeInRight}
      >
        <div className="auth-form-container">
          <motion.div 
            className="auth-form-header"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.h2 variants={staggerItem}>Create Account</motion.h2>
            <motion.p variants={staggerItem}>Start your journey in the circular economy.</motion.p>
          </motion.div>

          {/* Role Selection - Buyer/Seller Toggle */}
          <motion.div 
            className="role-selection"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {roles.map((role) => (
              <motion.button
                key={role.id}
                className={`role-btn ${selectedRole === role.id ? 'active' : ''}`}
                onClick={() => setSelectedRole(role.id)}
                variants={staggerItem}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <AnimatePresence>
                  {selectedRole === role.id && (
                    <motion.div 
                      className="role-btn-bg"
                      layoutId="signupRoleBackground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </AnimatePresence>
                <span className="role-label">{role.label}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* Role Description */}
          <AnimatePresence mode="wait">
            <motion.p 
              key={selectedRole}
              className="role-description"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {roles.find(r => r.id === selectedRole)?.description}
            </motion.p>
          </AnimatePresence>

          {/* Signup Form */}
          <motion.form 
            className="auth-form"
            onSubmit={handleSubmit}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {error && (
              <motion.div 
                className="auth-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <motion.div className="form-group" variants={staggerItem}>
              <label>Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </motion.div>

            <motion.div className="form-group" variants={staggerItem}>
              <label>Email</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </motion.div>

            <motion.div className="form-group" variants={staggerItem}>
              <label>Phone Number</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </span>
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </motion.div>

            <motion.div className="form-group" variants={staggerItem}>
              <label>Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div className="form-group" variants={staggerItem}>
              <label className="checkbox-label-inline">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="checkbox-text">
                  I agree to the <Link to="/terms">Terms and Conditions</Link> and <Link to="/privacy">Privacy Policy</Link>
                </span>
              </label>
            </motion.div>

            <motion.button 
              type="submit" 
              className="auth-submit-btn primary"
              variants={staggerItem}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner-small"></span>
              ) : (
                <>
                  Create Account
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </motion.button>
          </motion.form>

          <motion.p 
            className="auth-switch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Already have an account? <Link to="/login">Log in</Link>
          </motion.p>

          <motion.p 
            className="auth-copyright"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            © 2026 EcoLoop. All rights reserved.
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}

export default SignupPage
