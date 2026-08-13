import Project from '../models/Project.js';
import Task from '../models/Task.js';
import TimeEntry from '../models/TimeEntry.js';
import { AppError } from '../utils/AppError.js';

export const getActiveProjects = async () => {
  return await Project.find({ active: true });
};

export const getProjectTasks = async (projectId) => {
  return await Task.find({ project: projectId, isCompleted: false });
};

export const startTimeTracking = async (userId, { projectId, taskId }) => {
  // 1. Auto-stop any previous active project/task for this user
  const activeEntry = await TimeEntry.findOne({ 
    user: userId, 
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
    user: userId,
    project: projectId,
    task: taskId,
    startTime: new Date(),
    status: 'active'
  });

  await newEntry.save();
  return newEntry;
};

export const stopTimeTracking = async (userId) => {
  const activeEntry = await TimeEntry.findOne({ 
    user: userId, 
    status: 'active' 
  });

  if (!activeEntry) {
    throw new AppError('No active task found to stop', 400);
  }

  activeEntry.stopTime = new Date();
  activeEntry.status = 'completed';
  activeEntry.duration = Math.round((activeEntry.stopTime - activeEntry.startTime) / 60000);
  await activeEntry.save();

  // Mark the task itself as completed
  await Task.findByIdAndUpdate(activeEntry.task, { isCompleted: true });

  return activeEntry;
};
