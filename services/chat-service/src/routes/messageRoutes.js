const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getChatHistory,
  deleteMessage,
  updateMessage,
  reactToMessage
} = require('../controllers/messageController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, sendMessage);
router.get('/:receiverId', verifyToken, getChatHistory);
// Delete message
router.delete('/:messageId', verifyToken, deleteMessage);
// Update message
router.put('/:messageId', verifyToken, updateMessage);
// React to message
router.post('/:messageId/react', verifyToken, reactToMessage);

module.exports = router;
