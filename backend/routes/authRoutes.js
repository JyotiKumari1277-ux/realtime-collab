const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);

router.get('/profile', protect, (req, res) => {
  res.json({ message: 'You are logged in!', user: req.user });
});

module.exports = router;