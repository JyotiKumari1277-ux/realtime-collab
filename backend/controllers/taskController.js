const Task = require('../models/Task');
const Activity = require('../models/Activity');

// @desc   Create new task in a room
// @route  POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { roomId, title, description, priority } = req.body;

    if (!roomId || !title) {
      return res.status(400).json({ message: 'roomId and title are required' });
    }

    const task = await Task.create({
      room: roomId,
      title,
      description: description || '',
      priority: priority || 'medium',
      createdBy: req.user._id,
    });

    await Activity.create({
      room: roomId,
      task: task._id,
      user: req.user._id,
      action: `created task "${title}"`,
    });

    const io = req.app.get('io');
    io.to(roomId.toString()).emit('taskCreated', task);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get all tasks of a room
// @route  GET /api/tasks/:roomId
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ room: req.params.roomId }).populate(
      'assignee',
      'name email'
    );
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Update task (status, priority, description, assignee)
// @route  PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (req.body.version !== undefined && req.body.version !== task.version) {
      return res.status(409).json({
        message: 'This task was updated by someone else. Please refresh.',
        currentTask: task,
      });
    }

    // ---- VERSION HISTORY: purana state save karo update se pehle ----
    task.history.push({
      description: task.description,
      priority: task.priority,
      status: task.status,
      updatedAt: new Date(),
      updatedBy: req.user._id,
    });

    const { title, description, status, priority, assignee } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignee !== undefined) task.assignee = assignee;

    task.version += 1;
    await task.save();

    await Activity.create({
      room: task.room,
      task: task._id,
      user: req.user._id,
      action: `updated task "${task.title}"`,
    });

    const io = req.app.get('io');
    io.to(task.room.toString()).emit('taskUpdated', task);

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Restore a task to a previous version from history
// @route  PUT /api/tasks/:id/restore/:historyIndex
const restoreTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const historyIndex = parseInt(req.params.historyIndex, 10);
    const snapshot = task.history[historyIndex];

    if (!snapshot) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // current state ko bhi history mein daal do restore karne se pehle
    task.history.push({
      description: task.description,
      priority: task.priority,
      status: task.status,
      updatedAt: new Date(),
      updatedBy: req.user._id,
    });

    task.description = snapshot.description;
    task.priority = snapshot.priority;
    task.status = snapshot.status;
    task.version += 1;
    await task.save();

    await Activity.create({
      room: task.room,
      task: task._id,
      user: req.user._id,
      action: `restored task "${task.title}" to a previous version`,
    });

    const io = req.app.get('io');
    io.to(task.room.toString()).emit('taskUpdated', task);

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Delete a task
// @route  DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const roomId = task.room;
    const taskId = task._id;
    const taskTitle = task.title;

    await task.deleteOne();

    await Activity.create({
      room: roomId,
      task: taskId,
      user: req.user._id,
      action: `deleted task "${taskTitle}"`,
    });

    const io = req.app.get('io');
    io.to(roomId.toString()).emit('taskDeleted', { taskId });

    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask, restoreTask };