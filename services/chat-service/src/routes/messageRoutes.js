const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getChatHistory
} = require('../controllers/messageController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, sendMessage);
router.get('/:receiverId', verifyToken, getChatHistory);

module.exports = router;
