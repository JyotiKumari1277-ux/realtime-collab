const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null, // agar activity kisi specific task se related hai
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true, // jaise "created task", "moved to in-progress", "updated description"
    },
  },
  { timestamps: true } // createdAt hi hume time dega, jaise "10 jul, 5:52 pm"
);

module.exports = mongoose.model('Activity', activitySchema);