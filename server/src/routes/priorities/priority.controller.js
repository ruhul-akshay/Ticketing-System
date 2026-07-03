import * as priorityService from './priority.service.js';
import mongoose from 'mongoose';

/* =========================
   GET ALL
========================= */
export const getPriorities = async (req, res) => {
  try {
    const priorities = await priorityService.getAllPriorities();
    res.json(priorities);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch priorities' });
  }
};

/* =========================
   CREATE
========================= */
export const createPriority = async (req, res) => {
  try {
    const { name, level, color, description } = req.body;

    if (!name || !level)
      return res.status(400).json({ message: 'Name and level are required' });

    const priority = await priorityService.createPriority({
      name,
      level,
      color,
      description
    });

    res.status(201).json(priority);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* =========================
   UPDATE
========================= */
export const updatePriority = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'Invalid ID' });

    const priority = await priorityService.updatePriority(
      req.params.id,
      req.body
    );

    if (!priority)
      return res.status(404).json({ message: 'Priority not found' });

    res.json(priority);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update priority' });
  }
};

/* =========================
   DELETE
========================= */
export const deletePriority = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'Invalid ID' });

    const priority = await priorityService.deletePriority(req.params.id);

    if (!priority)
      return res.status(404).json({ message: 'Priority not found' });

    res.json({ message: 'Priority removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete priority' });
  }
};