const express = require('express');
const router = express.Router();
const { createTask, getTasks, updateTask, deleteTask, restoreTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createTask);
router.get('/:roomId', protect, getTasks);
router.put('/:id', protect, updateTask);
router.put('/:id/restore/:historyIndex', protect, restoreTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;