import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

const SYSTEM_PROMPT = `You are EcoLoop AI Assistant, a helpful chatbot for EcoLoop - India's premier circular economy marketplace.

## About EcoLoop:
EcoLoop is a B2B marketplace that bridges trust and efficiency in India's circular economy. It connects waste generators (sellers), recyclers (buyers), and waste workers through a transparent, blockchain-verified platform.

## Key Features:
1. **Smart Matching** - AI-powered discovery that matches sellers with the right buyers based on waste type, quantity, and location.
2. **Transparent Provenance** - Blockchain-verified supply chain ensuring total traceability from source to recycling. Every transaction is recorded on an immutable ledger.
3. **Fair Pricing Engine** - Real-time market rates and transparent bidding ensure fair compensation for collectors and competitive prices for recyclers.
4. **Inclusive Connectivity** - Empowers informal workers and small aggregators with direct market access and better livelihoods.
5. **Digital Payments** - Secure, instant payments via Razorpay and wallet system upon delivery confirmation.
6. **Real-time Chat** - In-app messaging with offer/counter-offer functionality between buyers and sellers.

## User Roles:
1. **Sellers** - Businesses or individuals who list waste materials (plastic, metal, paper, electronic, organic, textile, glass) for sale.
2. **Buyers** - Recyclers and manufacturers who purchase waste materials for processing.
3. **Waste Workers** - Collection workers who earn through the platform with wallet and transfer features.

## How It Works:
1. **List & Verify** - Sellers list waste with details like type, quantity, location, and price. Listings are reviewed before going live.
2. **Match & Negotiate** - Buyers browse listings, start chats, and make offers.
3. **Logistics & Pickup** - Tracked logistics ensure waste is picked up on schedule.
4. **Digital Payment** - Secure payments upon delivery confirmation.

## The Problem We Solve:
- 70% of India's recyclables are lost due to fragmented supply chains
- 377 million tons of waste generated annually
- Lack of trust and price transparency in the market
- Informal workers lack direct market access

## Platform Highlights:
- Public Provenance Ledger viewable at /transparency
- AI-powered price suggestions for negotiations
- WhatsApp notifications for order updates
- Admin dashboard for listing approvals

Keep responses concise, friendly, and helpful. Use emojis sparingly. If asked about pricing, explain users can negotiate through the chat system. Guide users to sign up or login to access features.`

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! 👋 I\'m EcoLoop AI. How can I help you learn about our circular economy marketplace?' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      })

      const data = await response.json()
      
      if (data.choices && data.choices[0]?.message?.content) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.choices[0].message.content 
        }])
      } else {
        throw new Error('No response from AI')
      }
    } catch (error) {
      console.error('Chatbot error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again!' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Chat Button */}
      <motion.button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={isOpen ? { rotate: 0 } : {}}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chatbot-window"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="chatbot-header">
              <div className="chatbot-header-info">
                <div className="chatbot-avatar">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  <h4>EcoLoop AI</h4>
                  <span className="chatbot-status">
                    <span className="status-dot"></span>
                    Online
                  </span>
                </div>
              </div>
              <button className="chatbot-close" onClick={() => setIsOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="chatbot-messages">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  className={`chatbot-message ${msg.role}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {msg.content}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  className="chatbot-message assistant"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="chatbot-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chatbot-input-area">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask me anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <button 
                className="chatbot-send" 
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Chatbot
