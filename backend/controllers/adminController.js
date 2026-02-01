const Admin = require('../models/Admin');
const { hashPassword, comparePassword } = require('../security/passwordUtil');
const { generateToken } = require('../security/jwtUtil');

// Seed admin user on startup
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
      console.log('Admin user seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

// Admin login
const loginAdmin = async (req, res) => {
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
    res.json({ 
      token, 
      user: { 
        id: admin._id, 
        name: admin.name, 
        email: admin.email,
        role: 'admin',
        isAdmin: true 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { seedAdmin, loginAdmin };
