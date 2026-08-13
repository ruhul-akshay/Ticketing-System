import * as priorityService from '../services/priority.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getPriorities = asyncHandler(async (req, res) => {
  const priorities = await priorityService.getAllPriorities();
  res.json(priorities);
});

export const createPriority = asyncHandler(async (req, res) => {
  const priority = await priorityService.createPriority(req.body);
  res.status(201).json(priority);
});

export const updatePriority = asyncHandler(async (req, res) => {
  const priority = await priorityService.updatePriority(req.params.id, req.body);
  res.json(priority);
});

export const deletePriority = asyncHandler(async (req, res) => {
  await priorityService.deletePriority(req.params.id);
  res.json({ message: 'Priority deleted successfully' });
});
