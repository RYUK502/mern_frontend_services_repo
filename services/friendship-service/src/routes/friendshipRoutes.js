const express = require('express');
const router = express.Router();
const {
  sendRequest,
  acceptRequest,
  rejectRequest,
  removeFriend,
  getFriends,
  getPending
} = require('../controllers/friendshipController');

const { verifyToken } = require('../middleware/authMiddleware');

router.post('/request', verifyToken, sendRequest);
router.post('/accept', verifyToken, acceptRequest);
router.post('/reject', verifyToken, rejectRequest);
router.delete('/remove', verifyToken, removeFriend);
router.get('/list', verifyToken, getFriends);
router.get('/pending', verifyToken, getPending);

module.exports = router;
