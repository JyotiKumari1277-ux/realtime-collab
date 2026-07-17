const express = require('express');
const router = express.Router();
const {
  createRoom,
  joinRoom,
  getMyRooms,
  getRoomById,
  inviteMember,
  updateMemberRole,
  renameRoom,
  deleteRoom,
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createRoom);
router.post('/join', protect, joinRoom);
router.get('/', protect, getMyRooms);
router.get('/:id', protect, getRoomById);
router.post('/:id/invite', protect, inviteMember);
router.put('/:id/members/:memberId/role', protect, updateMemberRole);
router.put('/:id/rename', protect, renameRoom);
router.delete('/:id', protect, deleteRoom);

module.exports = router;