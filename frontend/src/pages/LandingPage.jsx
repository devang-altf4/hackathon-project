import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion'
import Chatbot from '../components/Chatbot'
import '../index.css'

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
  }
}

const fadeInDown = {
  hidden: { opacity: 0, y: -60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
  }
}

const fadeInLeft = {
  hidden: { opacity: 0, x: -80 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
  }
}

const fadeInRight = {
  hidden: { opacity: 0, x: 80 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.6, -0.05, 0.01, 0.99] }
  }
}

const floatingAnimation = {
  y: [0, -15, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut"
  }
}

const pulseAnimation = {
  scale: [1, 1.05, 1],
  opacity: [1, 0.8, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
}

const rotateAnimation = {
  rotate: [0, 360],
  transition: {
    duration: 20,
    repeat: Infinity,
    ease: "linear"
  }
}

const glowPulse = {
  boxShadow: [
    "0 0 20px rgba(176, 196, 222, 0.3)",
    "0 0 40px rgba(176, 196, 222, 0.6)",
    "0 0 20px rgba(176, 196, 222, 0.3)"
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
}

// Animated Counter Component
function AnimatedCounter({ end, duration = 2, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  useEffect(() => {
    if (!isInView) return
    
    let startTime
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      setCount(progress * end)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isInView, end, duration])

  return (
    <motion.span 
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, type: "spring" }}
    >
      {prefix}{typeof end === 'number' && end < 10 ? count.toFixed(1) : Math.floor(count)}{suffix}
    </motion.span>
  )
}

// Magnetic Button Component
function MagneticButton({ children, className, ...props }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const ref = useRef(null)

  const handleMouseMove = (e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * 0.3
    const y = (e.clientY - rect.top - rect.height / 2) * 0.3
    setPosition({ x, y })
  }

  const handleMouseLeave = () => setPosition({ x: 0, y: 0 })

  return (
    <motion.button
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Parallax Image Component
function ParallaxImage({ children, className }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })
  const y = useTransform(scrollYProgress, [0, 1], [100, -100])
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 })

  return (
    <motion.div ref={ref} className={className} style={{ y: smoothY }}>
      {children}
    </motion.div>
  )
}

// Animated Section Component
function AnimatedSection({ children, className, id }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
    >
      {children}
    </motion.section>
  )
}

// EcoLoop Logo Component
function EcoLoopLogo({ size = 32, animated = true }) {
  return (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none"
      animate={animated ? rotateAnimation : {}}
    >
      {/* Outer Ring */}
      <motion.circle 
        cx="50" 
        cy="50" 
        r="45" 
        stroke="url(#gradient1)" 
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="80 200"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, rotate: 360 }}
        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
      />
      
      {/* Middle Ring */}
      <motion.circle 
        cx="50" 
        cy="50" 
        r="32" 
        stroke="url(#gradient2)" 
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="60 150"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, rotate: -360 }}
        transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
      />
      
      {/* Inner Ring */}
      <motion.circle 
        cx="50" 
        cy="50" 
        r="20" 
        stroke="url(#gradient1)" 
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="40 100"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1, rotate: 360 }}
        transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
      />
      
      {/* Center Dot */}
      <motion.circle 
        cx="50" 
        cy="50" 
        r="8" 
        fill="url(#gradient1)"
        animate={pulseAnimation}
      />
      
      {/* Recycling Arrows */}
      <motion.path 
        d="M50 25 L60 35 L50 35 L50 25" 
        fill="#b0c4de"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "50px 50px" }}
      />
      <motion.path 
        d="M70 55 L70 65 L60 55 L70 55" 
        fill="#8fa4c4"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1.33 }}
        style={{ transformOrigin: "50px 50px" }}
      />
      <motion.path 
        d="M30 55 L40 55 L30 65 L30 55" 
        fill="#d4e1f0"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 2.66 }}
        style={{ transformOrigin: "50px 50px" }}
      />
      
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b0c4de" />
          <stop offset="100%" stopColor="#8fa4c4" />
        </linearGradient>
        <linearGradient id="gradient2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d4e1f0" />
          <stop offset="100%" stopColor="#b0c4de" />
        </linearGradient>
      </defs>
    </motion.svg>
  )
}

// Animated Background Orbs
function BackgroundOrbs() {
  return (
    <div className="background-orbs">
      <motion.div 
        className="orb orb-1"
        animate={{
          x: [0, 100, 0, -100, 0],
          y: [0, -50, 100, -50, 0],
          scale: [1, 1.2, 1, 0.8, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="orb orb-2"
        animate={{
          x: [0, -80, 0, 80, 0],
          y: [0, 80, -50, 80, 0],
          scale: [1, 0.9, 1.1, 0.9, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="orb orb-3"
        animate={{
          x: [0, 50, -50, 50, 0],
          y: [0, -100, 50, -100, 0],
          scale: [1, 1.1, 0.9, 1.1, 1]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}

// Floating Particles
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 2,
    duration: Math.random() * 10 + 10
  }))

  return (
    <div className="floating-particles-container">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size
          }}
          animate={{
            y: [0, -30, 0, 30, 0],
            x: [0, 15, 0, -15, 0],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Progress Bar */}
      <motion.div 
        className="scroll-progress"
        style={{ scaleX }}
      />

      {/* ========== NAVBAR ========== */}
      <motion.nav 
        className={`navbar ${scrolled ? 'scrolled' : ''}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
      >
        <div className="nav-container">
          <motion.a 
            href="#" 
            className="nav-logo"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div className="nav-logo-icon" animate={glowPulse}>
              <EcoLoopLogo size={24} />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              EcoLoop
            </motion.span>
          </motion.a>
          
          <motion.ul 
            className="nav-links"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {['Home', 'How it Works', 'Live Listings', 'Impact Dashboard'].map((item, i) => (
              <motion.li key={item} variants={staggerItem}>
                <motion.a 
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  whileHover={{ color: '#8fa4c4', y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  {item}
                </motion.a>
              </motion.li>
            ))}
          </motion.ul>
          
          <motion.div 
            className="nav-actions"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <MagneticButton className="btn btn-outline" onClick={() => navigate('/login')}>
              Login
            </MagneticButton>
            <MagneticButton className="btn btn-primary" onClick={() => navigate('/signup')}>
              Join Now
            </MagneticButton>
          </motion.div>
        </div>
      </motion.nav>

      {/* ========== HERO SECTION ========== */}
      <section className="hero" id="home">
        <BackgroundOrbs />
        <FloatingParticles />
        
        <div className="hero-container">
          <motion.div 
            className="hero-content"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div className="hero-badge" variants={fadeInDown}>
              <motion.span 
                className="hero-badge-dot"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              LIVE MARKETPLACE
            </motion.div>
            
            <motion.h1 className="hero-title" variants={fadeInUp}>
              Bridging Trust & Efficiency in India's{' '}
              <motion.span 
                className="hero-title-accent"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{
                  background: 'linear-gradient(90deg, #b0c4de, #8fa4c4, #d4e1f0, #b0c4de)',
                  backgroundSize: '300% 100%',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                Circular Economy
              </motion.span>
            </motion.h1>
            
            <motion.p className="hero-description" variants={fadeInUp}>
              A transparent marketplace connecting waste generators, recyclers, and workers to close the loop on resource recovery.
            </motion.p>
            
            <motion.div className="hero-buttons" variants={fadeInUp}>
              <MagneticButton className="btn btn-dark btn-ripple" onClick={() => navigate('/list-waste')}>
                <span>List Waste</span>
                <motion.svg 
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </motion.svg>
              </MagneticButton>
              <MagneticButton className="btn btn-outline" onClick={() => navigate('/browse-materials')}>Find Materials</MagneticButton>
            </motion.div>
            
            <motion.div className="hero-social-proof" variants={fadeInUp}>
              <motion.div 
                className="avatar-stack"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {['JD', 'MK', 'RS'].map((initials, i) => (
                  <motion.div 
                    key={initials}
                    className="avatar"
                    variants={staggerItem}
                    whileHover={{ scale: 1.2, zIndex: 10 }}
                  >
                    {initials}
                  </motion.div>
                ))}
              </motion.div>
              <motion.span 
                className="social-proof-text"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Joined by <strong>1,200+</strong> businesses this month
              </motion.span>
            </motion.div>
          </motion.div>
          
          <ParallaxImage className="hero-image-wrapper">
            <motion.div 
              className="hero-image"
              initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1.2, ease: [0.6, -0.05, 0.01, 0.99], delay: 0.3 }}
              whileHover={{ scale: 1.02, rotateY: 5 }}
              style={{
                background: 'linear-gradient(135deg, #1a1f2e 0%, #2a3441 100%)',
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                transformStyle: 'preserve-3d'
              }}
            >
              <motion.div 
                style={{ position: 'absolute', inset: 0 }}
                animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
              />
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                color: 'white',
                textAlign: 'center',
                zIndex: 1
              }}>
                <motion.div animate={floatingAnimation}>
                  <EcoLoopLogo size={100} />
                </motion.div>
                <motion.span 
                  style={{ fontSize: '1.25rem', fontWeight: '600' }}
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Industrial Waste Processing
                </motion.span>
                <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>Certified Recycling Facilities</span>
              </div>
            </motion.div>
            
            <motion.div 
              className="hero-stats-card"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1, duration: 0.8, type: "spring" }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <motion.div className="stats-icon" animate={pulseAnimation}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8fa4c4" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </motion.div>
              <div className="stats-info">
                <div className="stats-label">REAL-TIME RECOVERY</div>
                <div className="stats-value">Plastic PET Bottles</div>
              </div>
              <motion.span 
                className="stats-badge"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                +12.5%
              </motion.span>
            </motion.div>
          </ParallaxImage>
        </div>
      </section>

      {/* ========== PROBLEM SECTION ========== */}
      <AnimatedSection className="problem-section">
        <div className="section-container">
          <motion.h2 className="section-title" variants={fadeInUp}>
            Why <motion.span 
              className="section-title-accent"
              animate={{ color: ['#b0c4de', '#8fa4c4', '#b0c4de'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >70%</motion.span> of India's Recyclables are Lost
          </motion.h2>
          <motion.p className="section-subtitle" variants={fadeInUp}>
            The current linear economy fails to capture value due to systemic inefficiencies. EcoLoop is building the infrastructure to fix this.
          </motion.p>
          
          <motion.div className="problem-cards" variants={staggerContainer}>
            {[
              { icon: '📊', label: 'ANNUAL WASTE GENERATION', stat: 377, suffix: 'M', unit: 'Tons', text: 'Millions of tons of potentially valuable material end up in landfills every single year due to lack of collection.', color: 'red' },
              { icon: '⚙️', label: 'SUPPLY CHAIN', title: 'Fragmented Systems', text: 'Disconnected stakeholders mean materials travel inefficiently, losing value and quality at every informal handover.', color: 'blue' },
              { icon: '🔒', label: 'MARKET CHALLENGE', title: 'The Trust Gap', text: 'Without verified data, buyers and sellers struggle with price transparency and material quality assurance.', color: 'purple' }
            ].map((card, i) => (
              <motion.div 
                key={i}
                className="problem-card"
                variants={staggerItem}
                whileHover={{ 
                  scale: 1.03, 
                  y: -10,
                  boxShadow: "0 20px 40px rgba(176, 196, 222, 0.2)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div 
                  className={`problem-card-icon ${card.color}`}
                  animate={i === 1 ? rotateAnimation : floatingAnimation}
                >
                  {card.icon}
                </motion.div>
                <div className="problem-card-label">{card.label}</div>
                {card.stat ? (
                  <div className="problem-card-stat">
                    <AnimatedCounter end={card.stat} suffix={card.suffix} /> <span style={{ fontSize: '1rem', fontWeight: '400' }}>{card.unit}</span>
                  </div>
                ) : (
                  <h3 className="problem-card-title">{card.title}</h3>
                )}
                <p className="problem-card-text">{card.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ========== FEATURES SECTION ========== */}
      <AnimatedSection className="features-section" id="live-listings">
        <div className="section-container">
          <div className="features-header">
            <div className="features-header-left">
              <motion.h2 className="section-title" variants={fadeInLeft}>Core Platform Features</motion.h2>
              <motion.p className="section-subtitle" variants={fadeInLeft}>
                Empowering the circular economy with technology and transparency. Our tools are designed for scale.
              </motion.p>
            </div>
            <motion.a 
              href="#" 
              className="view-all-link"
              variants={fadeInRight}
              whileHover={{ x: 10, color: '#8fa4c4' }}
            >
              View all features →
            </motion.a>
          </div>
          
          <motion.div className="features-grid" variants={staggerContainer}>
            {[
              { icon: '🎯', title: 'Smart Matching', text: 'AI-powered discovery matches you with the right buyers or sellers based on waste type, quantity, and location.' },
              { icon: '🔗', title: 'Transparent Provenance', text: 'Blockchain-verified supply chain ensuring total traceability from source to recycling, building trust at every step.' },
              { icon: '💰', title: 'Fair Pricing Engine', text: 'Real-time market rates and transparent bidding ensure fair compensation for collectors and competitive prices for recyclers.' },
              { icon: '🌐', title: 'Inclusive Connectivity', text: 'Empowering informal workers and small aggregators with direct market access, dignity, and better livelihoods.' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                className="feature-card"
                variants={staggerItem}
                whileHover={{ 
                  scale: 1.05, 
                  y: -8,
                  boxShadow: "0 25px 50px rgba(176, 196, 222, 0.25)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div 
                  className="feature-icon"
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.5 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-text">{feature.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ========== PROCESS SECTION ========== */}
      <AnimatedSection className="process-section" id="how-it-works">
        <div className="section-container">
          <div className="process-header">
            <motion.span className="process-badge" variants={scaleIn}>PROCESS</motion.span>
            <motion.h2 className="section-title" variants={fadeInUp}>Seamless Circular Economy</motion.h2>
            <motion.p className="section-subtitle" variants={fadeInUp}>
              Our 4-step process ensures transparency, compliance, and efficiency from waste generation to certified recycling.
            </motion.p>
          </div>
          
          <motion.div className="process-steps" variants={staggerContainer}>
            {[
              { icon: '✓', title: 'List & Verify', text: 'Generators list waste details, instantly verified by our AI models.' },
              { icon: '🤝', title: 'Match & Negotiate', text: 'Smart matching connects you with certified recyclers for fair pricing.' },
              { icon: '🚚', title: 'Logistics & Pickup', text: 'Real-time tracked logistics ensure waste is picked up on schedule.' },
              { icon: '💳', title: 'Digital Payment', text: 'Secure, instant payments via blockchain smart contracts upon delivery.' }
            ].map((step, i) => (
              <motion.div 
                key={i}
                className="process-step"
                variants={staggerItem}
                whileHover={{ scale: 1.08 }}
              >
                <motion.div 
                  className="process-step-icon"
                  whileHover={{ 
                    rotate: [0, -10, 10, 0],
                    boxShadow: "0 0 30px rgba(176, 196, 222, 0.5)"
                  }}
                  animate={glowPulse}
                >
                  {step.icon}
                </motion.div>
                <h3 className="process-step-title">{step.title}</h3>
                <p className="process-step-text">{step.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ========== STAKEHOLDERS SECTION ========== */}
      <AnimatedSection className="stakeholders-section">
        <div className="section-container">
          <div className="stakeholders-header">
            <motion.h2 className="section-title" variants={fadeInUp}>Our Stakeholders</motion.h2>
            <motion.p className="section-subtitle" variants={fadeInUp} style={{ textAlign: 'left', margin: 0 }}>
              Tailored solutions for every partner in the value chain.
            </motion.p>
          </div>
          
          <div className="stakeholder-content">
            <motion.div 
              className="stakeholder-image"
              variants={fadeInLeft}
              whileHover={{ scale: 1.02 }}
              style={{
                background: 'linear-gradient(135deg, #1a1f2e 0%, #2a3441 100%)',
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-xl)'
              }}
            >
              <div style={{ display: 'flex', gap: '1rem', padding: '2rem' }}>
                {[1, 2, 3].map((i) => (
                  <motion.div 
                    key={i}
                    animate={floatingAnimation}
                    transition={{ delay: i * 0.2 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    style={{
                      width: '100px',
                      height: '150px',
                      background: 'linear-gradient(180deg, #3a4556 0%, #2a3441 100%)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <EcoLoopLogo size={50} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div className="stakeholder-info" variants={fadeInRight}>
              <motion.div 
                className="verified-badge"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.span 
                  className="verified-badge-dot"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                VERIFIED COMPLIANCE
              </motion.div>
              
              <h3 className="stakeholder-title">
                Responsible Disposal & <motion.span 
                  className="stakeholder-title-accent"
                  animate={{ color: ['#b0c4de', '#8fa4c4', '#b0c4de'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >EPR Credits</motion.span>
              </h3>
              
              <p className="stakeholder-description">
                Dispose of industrial waste responsibly, earn sustainability credits, and track your environmental impact in real-time. We ensure 100% compliance with local waste management regulations.
              </p>
              
              <motion.div 
                className="stakeholder-buttons"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
              >
                <MagneticButton className="btn btn-primary" onClick={() => navigate('/login')}>
                  Start Listing Waste →
                </MagneticButton>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ========== IMPACT SECTION ========== */}
      <AnimatedSection className="impact-section" id="impact">
        <BackgroundOrbs />
        <div className="section-container">
          <div className="impact-header">
            <div className="impact-header-left">
              <motion.div className="impact-badge" variants={scaleIn}>
                <motion.span 
                  className="impact-badge-dot"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                LIVE DASHBOARD
              </motion.div>
              <motion.h2 className="impact-title" variants={fadeInUp}>Real-Time Impact</motion.h2>
            </div>
            <motion.div className="impact-header-right" variants={fadeInRight}>
              <p className="impact-description">
                Data updated every 5 minutes from verified blockchain transactions.
              </p>
            </motion.div>
          </div>
          
          <motion.div className="impact-cards" variants={staggerContainer}>
            {[
              { icon: '♻️', value: 1.2, suffix: 'M+', label: 'KG Waste Diverted', trend: '+12%' },
              { icon: '🌱', value: 850, suffix: 't', label: 'CO2e Saved', trend: '+8%' },
              { icon: '₹', value: 4.5, suffix: 'Cr', label: 'Value Transacted', trend: '+24%' }
            ].map((card, i) => (
              <motion.div 
                key={i}
                className="impact-card"
                variants={staggerItem}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  boxShadow: "0 30px 60px rgba(176, 196, 222, 0.3)"
                }}
              >
                <div className="impact-card-header">
                  <motion.div 
                    className="impact-card-icon"
                    animate={i === 0 ? rotateAnimation : (i === 1 ? floatingAnimation : pulseAnimation)}
                  >
                    {card.icon}
                  </motion.div>
                  <motion.div 
                    className="impact-card-trend"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ↗ {card.trend}
                  </motion.div>
                </div>
                <div className="impact-card-value">
                  <AnimatedCounter end={card.value} suffix={card.suffix} duration={2.5} />
                </div>
                <div className="impact-card-label">{card.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ========== CTA SECTION ========== */}
      <AnimatedSection className="cta-section">
        <div className="section-container">
          <motion.h2 className="cta-title" variants={fadeInUp}>Ready to close the loop?</motion.h2>
          <motion.p className="cta-description" variants={fadeInUp}>
            Join thousands of conscious businesses and recyclers making a measurable impact on the planet and the economy.
          </motion.p>
          <motion.div variants={scaleIn}>
            <MagneticButton 
              className="btn btn-dark btn-ripple" 
              style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}
              onClick={() => navigate('/login')}
            >
              <motion.span
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Get Started Now
              </motion.span>
            </MagneticButton>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ========== FOOTER ========== */}
      <motion.footer 
        className="footer"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="footer-container">
          <motion.div 
            className="footer-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div className="footer-brand" variants={staggerItem}>
              <motion.div className="footer-logo" whileHover={{ scale: 1.05 }}>
                <motion.div className="footer-logo-icon" animate={glowPulse}>
                  <EcoLoopLogo size={24} />
                </motion.div>
                EcoLoop
              </motion.div>
              <p className="footer-brand-text">
                Connecting waste generators, recyclers, and informal workers to build a transparent, circular economy for India.
              </p>
            </motion.div>
            
            {[
              { title: 'Platform', links: ['For Factories', 'For Recyclers', 'Waste Warriors', 'Pricing'] },
              { title: 'Support', links: ['Tier 3 Support', 'Documentation', 'Compliance Guide', 'Contact Us'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'E-Waste Rules 2022'] }
            ].map((column, i) => (
              <motion.div key={column.title} className="footer-column" variants={staggerItem}>
                <h4>{column.title}</h4>
                <ul className="footer-links">
                  {column.links.map((link) => (
                    <li key={link}>
                      <motion.a 
                        href="#"
                        whileHover={{ x: 5, color: '#b0c4de' }}
                        transition={{ duration: 0.2 }}
                      >
                        {link}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            className="footer-bottom"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <div className="footer-copyright">
              © 2026 EcoLoop. All rights reserved.
            </div>
            <div className="footer-badges">
              {['BLOCKCHAIN SECURED', 'ISO CERTIFIED'].map((badge) => (
                <motion.div 
                  key={badge}
                  className="footer-badge"
                  whileHover={{ scale: 1.1 }}
                >
                  <motion.span 
                    className="footer-badge-icon"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {badge}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.footer>

      {/* Chatbot */}
      <Chatbot />
    </>
  )
}

export default LandingPage
