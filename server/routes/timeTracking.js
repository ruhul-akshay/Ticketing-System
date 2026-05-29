import express from 'express';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import TimeEntry from '../models/TimeEntry.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get available projects
router.get('/projects', authenticate, async (req, res) => {
  try {
    const projects = await Project.find({ active: true });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get tasks for a project
router.get('/projects/:projectId/tasks', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId, isCompleted: false });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start tracking a task
router.post('/start', authenticate, async (req, res) => {
  try {
    const { projectId, taskId } = req.body;

    // 1. Auto-stop any previous active project/task for this user
    const activeEntry = await TimeEntry.findOne({ 
      user: req.user._id, 
      status: 'active' 
    });

    if (activeEntry) {
      activeEntry.stopTime = new Date();
      activeEntry.status = 'completed';
      activeEntry.duration = Math.round((activeEntry.stopTime - activeEntry.startTime) / 60000);
      await activeEntry.save();
    }

    // 2. Start the new task
    const newEntry = new TimeEntry({
      user: req.user._id,
      project: projectId,
      task: taskId,
      startTime: new Date(),
      status: 'active'
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Stop tracking (Task Completion)
router.post('/stop', authenticate, async (req, res) => {
  try {
    const activeEntry = await TimeEntry.findOne({ 
      user: req.user._id, 
      status: 'active' 
    });

    if (!activeEntry) {
      return res.status(400).json({ message: 'No active task found to stop' });
    }

    activeEntry.stopTime = new Date();
    activeEntry.status = 'completed';
    activeEntry.duration = Math.round((activeEntry.stopTime - activeEntry.startTime) / 60000);
    await activeEntry.save();

    // Mark the task itself as completed
    await Task.findByIdAndUpdate(activeEntry.task, { isCompleted: true });

    res.json(activeEntry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
