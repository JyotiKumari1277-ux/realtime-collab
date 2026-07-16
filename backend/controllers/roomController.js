const Room = require('../models/Room');
const Activity = require('../models/Activity');
const User = require('../models/User');

// Generate random room code (jaise "X7K9P2")
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// @desc   Create new room/workspace
// @route  POST /api/rooms
const createRoom = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    const roomCode = generateRoomCode();

    const room = await Room.create({
      name,
      roomCode,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Join existing room using roomCode
// @route  POST /api/rooms/join
const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.body;

    const room = await Room.findOne({ roomCode });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const alreadyMember = room.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!alreadyMember) {
      room.members.push({ user: req.user._id, role: 'editor' });
      await room.save();
    }

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get all rooms current user is part of
// @route  GET /api/rooms
const getMyRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ 'members.user': req.user._id });
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get single room by ID (agar user uska member hai)
// @route  GET /api/rooms/:id
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate(
      'members.user',
      'name email'
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const isMember = room.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this room' });
    }

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Invite a member by email
// @route  POST /api/rooms/:id/invite
const inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    const allowedRoles = ['editor', 'viewer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const requester = room.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requester || requester.role !== 'owner') {
      return res.status(403).json({ message: 'Only the owner can invite members' });
    }

    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const alreadyMember = room.members.some(
      (m) => m.user.toString() === userToInvite._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    room.members.push({ user: userToInvite._id, role });
    await room.save();

    const updatedRoom = await Room.findById(room._id).populate(
      'members.user',
      'name email'
    );

    res.status(200).json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Update a member's role
// @route  PUT /api/rooms/:id/members/:memberId/role
const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['owner', 'editor', 'viewer'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const requester = room.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requester || requester.role !== 'owner') {
      return res.status(403).json({ message: 'Only the owner can change roles' });
    }

    const targetMember = room.members.find(
      (m) => m.user.toString() === req.params.memberId
    );
    if (!targetMember) {
      return res.status(404).json({ message: 'Member not found in this room' });
    }

    const isLastOwner =
      targetMember.role === 'owner' &&
      room.members.filter((m) => m.role === 'owner').length === 1;

    if (isLastOwner && role !== 'owner') {
      return res.status(400).json({ message: 'Room must have at least one owner' });
    }

    targetMember.role = role;
    await room.save();

    const updatedRoom = await Room.findById(room._id).populate(
      'members.user',
      'name email'
    );

    res.status(200).json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createRoom,
  joinRoom,
  getMyRooms,
  getRoomById,
  inviteMember,
  updateMemberRole,
};