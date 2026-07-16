const Activity = require('../models/Activity');

// @desc   Get recent activity for a room
// @route  GET /api/activity/:roomId
const getRoomActivity = async (req, res) => {
  try {
    const activities = await Activity.find({ room: req.params.roomId })
      .populate('user', 'name')
      .sort({ createdAt: -1 }) // sabse naya sabse upar
      .limit(20); // last 20 activities hi dikhao

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getRoomActivity };