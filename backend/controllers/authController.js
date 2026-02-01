const User = require('../models/User');
const { hashPassword, comparePassword } = require('../security/passwordUtil');
const { generateToken } = require('../security/jwtUtil');

exports.register = async (req, res) => {
  try {
    console.log('Register request received:', req.body);
    const { name, email, password, role, phoneNumber } = req.body;

    if (!['buyer', 'seller', 'waste_worker'].includes(role)) {
      console.log('Invalid role:', role);
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    console.log('Password hashed successfully');

    const user = await User.create({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
    });
    console.log('User created successfully:', user._id);

    const token = generateToken({ id: user._id, role: user.role });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.loginBuyer = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'buyer') {
        // Securely handle invalid credentials or wrong role
        return res.status(401).json({ message: 'Invalid credentials or access denied' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user._id, role: user.role });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'seller') {
        return res.status(401).json({ message: 'Invalid credentials or access denied' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user._id, role: user.role });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.loginWasteWorker = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.role !== 'waste_worker') {
        return res.status(401).json({ message: 'Invalid credentials or access denied' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: user._id, role: user.role });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
