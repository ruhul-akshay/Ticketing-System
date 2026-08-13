import * as timeTrackingService from '../services/timeTracking.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getProjects = asyncHandler(async (req, res) => {
  const projects = await timeTrackingService.getActiveProjects();
  res.json(projects);
});

export const getTasks = asyncHandler(async (req, res) => {
  const tasks = await timeTrackingService.getProjectTasks(req.params.projectId);
  res.json(tasks);
});

export const startTracking = asyncHandler(async (req, res) => {
  const entry = await timeTrackingService.startTimeTracking(req.user._id, req.body);
  res.status(201).json(entry);
});

export const stopTracking = asyncHandler(async (req, res) => {
  const entry = await timeTrackingService.stopTimeTracking(req.user._id);
  res.json(entry);
});
