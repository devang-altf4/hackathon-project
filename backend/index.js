const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// ============= MODELS =============
// User Model
const User = require('./models/User');

// Admin Model
const Admin = require('./models/Admin');

// Listing Model
const Listing = require('./models/Listing');

// ============= UTILITIES =============
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initializeWhatsApp } = require('./services/whatsappService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Initialize WhatsApp - Removed global init
// initializeWhatsApp();

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// ============= MIDDLEWARE =============
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const checkRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
  };
};

const checkAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.isAdmin)) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin only' });
  }
};

// ============= SEED ADMIN =============
const seedAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ email: 'admin4@gmail.com' });
    if (!existingAdmin) {
      const hashedPassword = await hashPassword('1234567');
      await Admin.create({
        email: 'admin4@gmail.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin'
      });
      console.log('✅ Admin user seeded: admin4@gmail.com / 1234567');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

// ============= AUTH ROUTES =============
app.use('/api/auth', require('./routes/authRoutes'));

// ============= ADMIN ROUTES =============
// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken({ id: admin._id, role: 'admin', isAdmin: true });
    
    // Start WhatsApp Service on Admin Login
    try {
        initializeWhatsApp();
    } catch (waError) {
        console.error('Failed to trigger WhatsApp init:', waError);
    }

    res.json({ 
      token, 
      user: { id: admin._id, name: admin.name, email: admin.email, role: 'admin', isAdmin: true } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get WhatsApp Status (poll this from frontend)
app.get('/api/admin/whatsapp/status', authenticate, checkAdmin, (req, res) => {
    const { getQr, isClientReady, initializeWhatsApp, isInitializing } = require('./services/whatsappService');
    
    // Ensure service is running if admin is checking status
    if (!isClientReady() && !isInitializing()) {
        try {
            initializeWhatsApp();
        } catch (e) {
            console.error('Auto-init WhatsApp error:', e);
        }
    }

    res.json({ 
        qr: getQr(), 
        ready: isClientReady() 
    });
});

// Admin: Reset WhatsApp
app.post('/api/admin/whatsapp/reset', authenticate, checkAdmin, (req, res) => {
    const { resetWhatsApp } = require('./services/whatsappService');
    resetWhatsApp();
    res.json({ message: 'WhatsApp client reset started' });
});

// Admin: Get pending listings
app.get('/api/admin/listings/pending', authenticate, checkAdmin, async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'pending' })
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending listings', error: error.message });
  }
});

// Admin: Get all listings
app.get('/api/admin/listings/all', authenticate, checkAdmin, async (req, res) => {
  try {
    const listings = await Listing.find()
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
});

// Admin: Approve listing
app.put('/api/admin/listings/:id/approve', authenticate, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const listing = await Listing.findByIdAndUpdate(
      id,
      { status: 'approved', adminNotes: adminNotes || '', reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true }
    ).populate('seller', 'name email');
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Send WhatsApp Notification
    if (listing.seller && listing.seller.phoneNumber) {
        const { sendMessage } = require('./services/whatsappService');
        const message = `🎉 Good news, ${listing.seller.name}! \n\nYour listing "${listing.title}" has been APPROVED by the admin. \n\nIt is now live on the marketplace for buyers to see. \n\nCheck it out here: http://localhost:5173/tracker/${listing._id}`;
        sendMessage(listing.seller.phoneNumber, message);
    }
    
    res.json({ message: 'Listing approved successfully', listing });
  } catch (error) {
    res.status(500).json({ message: 'Error approving listing', error: error.message });
  }
});

// Admin: Reject listing
app.put('/api/admin/listings/:id/reject', authenticate, checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const listing = await Listing.findByIdAndUpdate(
      id,
      { status: 'rejected', adminNotes: adminNotes || 'Does not meet guidelines', reviewedBy: req.user.id, reviewedAt: new Date() },
      { new: true }
    ).populate('seller', 'name email');
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json({ message: 'Listing rejected', listing });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting listing', error: error.message });
  }
});

// ============= SOCKET.IO SETUP =============
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity in this hackathon
    methods: ["GET", "POST"]
  }
});

// Make io available in routes
app.set('io', io);

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation: ${conversationId}`);
  });

  socket.on('send_message', (data) => {
    // data: { conversationId, message }
    // Broadcast to others in the room
    socket.to(data.conversationId).emit('receive_message', data.message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ============= PROVENANCE ROUTES =============
app.use('/api/provenance', require('./routes/provenanceRoutes'));
app.use('/api/public', require('./routes/publicRoutes')); // Public Routes


// ============= LISTING ROUTES =============
app.use('/api/chat', require('./routes/chatRoutes')); // Chat Routes
app.use('/api/status', require('./routes/statusRoutes')); // New route for tracking
app.use('/api/matches', require('./routes/matchRoutes')); // Smart Matching
app.use('/api/purchases', require('./routes/purchaseRoutes')); // Purchase tracking
app.use('/api/payment', require('./routes/paymentRoutes')); // Payment Routes
app.use('/api/wallet', require('./routes/walletRoutes')); // Wallet Routes
app.use('/api/ai', require('./routes/aiRoutes')); // AI Routes
// Get approved listings (public - for buyers)
app.get('/api/listings', async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'approved' })
      .populate('seller', 'name email')
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
});

// Create listing (seller only - goes to pending)
app.post('/api/listings', authenticate, checkRole('seller'), async (req, res) => {
  try {
    const { title, description, category, quantity, unit, price, location, images } = req.body;
    const listing = await Listing.create({
      title, description, category, quantity, unit, price, location,
      images: images || [],
      seller: req.user.id,
      status: 'pending'
    });
    res.status(201).json({ message: 'Listing submitted for review', listing });
  } catch (error) {
    res.status(500).json({ message: 'Error creating listing', error: error.message });
  }
});

// Get seller's own listings
app.get('/api/listings/my-listings', authenticate, checkRole('seller'), async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user.id }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching listings', error: error.message });
  }
});

// ============= BASE ROUTE =============
app.get('/', (req, res) => {
  res.send('Hackathon Backend API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// ============= DATABASE & SERVER =============
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/hackathon_db')
  .then(async () => {
    console.log('✅ MongoDB Connected');
    await seedAdmin();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API: http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB Connection Error:', err));
