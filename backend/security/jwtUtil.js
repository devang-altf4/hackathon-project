const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret_hackathon_key', {
    expiresIn: '1d',
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'secret_hackathon_key');
};

module.exports = {
  generateToken,
  verifyToken,
};
