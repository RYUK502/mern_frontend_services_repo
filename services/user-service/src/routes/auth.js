const express = require('express');
const router = express.Router();
const {
  register,
  login,
  me,
  approveUser,
  rejectUser,
  listOrders,
  approveOrder,
  rejectOrder
} = require('../controllers/authController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', require('../controllers/authController').logout);
router.get('/me', verifyToken, me);
router.post('/approve/:id', verifyToken, isAdmin, approveUser);
router.delete('/reject/:id', verifyToken, isAdmin, rejectUser);

// Admin registration order management
router.get('/orders', verifyToken, isAdmin, listOrders);
router.post('/orders/:id/approve', verifyToken, isAdmin, approveOrder);
router.delete('/orders/:id/reject', verifyToken, isAdmin, rejectOrder);

module.exports = router;
