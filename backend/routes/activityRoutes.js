const express = require('express');
const router = express.Router();
const { getRoomActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:roomId', protect, getRoomActivity);

module.exports = router;