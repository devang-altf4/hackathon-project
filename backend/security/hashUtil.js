const crypto = require('crypto');

const calculateHash = (listingId, action, actorId, timestamp, previousHash, metaData = {}) => {
  const data = JSON.stringify({
    listingId,
    action,
    actorId,
    timestamp,
    previousHash,
    metaData
  });
  
  return crypto.createHash('sha256').update(data).digest('hex');
};

module.exports = { calculateHash };
