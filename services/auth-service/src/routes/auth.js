const express = require('express');
const router = express.Router();
const {
  register,
  login,
  me,
  approveUser
} = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, me);
router.post('/approve/:id', verifyToken, isAdmin, approveUser);

module.exports = router;
