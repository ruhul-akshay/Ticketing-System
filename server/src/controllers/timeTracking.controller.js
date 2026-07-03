import * as timeTrackingService from '../services/timeTracking.service.js';

export const getProjects = async (req, res) => {
  try {
    const projects = await timeTrackingService.getActiveProjects();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const tasks = await timeTrackingService.getProjectTasks(req.params.projectId);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const startTracking = async (req, res) => {
  try {
    const entry = await timeTrackingService.startTimeTracking(req.user._id, req.body);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const stopTracking = async (req, res) => {
  try {
    const entry = await timeTrackingService.stopTimeTracking(req.user._id);
    res.json(entry);
  } catch (err) {
    if (err.message === 'No active task found to stop') {
      res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ message: err.message });
    }
  }
};
