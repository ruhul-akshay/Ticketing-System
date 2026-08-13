import Priority from '../models/Priority.js';
import { AppError } from '../utils/AppError.js';

/* =========================
   GET ALL
 ========================= */
export const getAllPriorities = async () => {
  let priorities = await Priority.find({ isActive: true }).sort({ level: 1 });
  if (priorities.length === 0) {
    const count = await Priority.countDocuments();
    if (count === 0) {
      await Priority.create([
        { name: 'Low', level: 10, color: '#10b981', description: 'General issues with minor impact.' },
        { name: 'Medium', level: 30, color: '#3b82f6', description: 'Standard service requests and normal operations.' },
        { name: 'High', level: 70, color: '#f59e0b', description: 'Urgent issues affecting workflows.' },
        { name: 'Critical', level: 100, color: '#ef4444', description: 'Severe outages or system breakdown.' }
      ]);
      priorities = await Priority.find({ isActive: true }).sort({ level: 1 });
    }
  }
  return priorities;
};

/* =========================
   CREATE
 ========================= */
export const createPriority = async (data) => {
  if (!data.name?.trim()) {
    throw new AppError('Priority name is required', 400);
  }
  const exists = await Priority.findOne({
    name: { $regex: `^${data.name.trim()}$`, $options: 'i' }
  });

  if (exists) {
    throw new AppError('Priority already exists', 409);
  }

  return await Priority.create(data);
};

/* =========================
   UPDATE
 ========================= */
export const updatePriority = async (id, data) => {
  const priority = await Priority.findByIdAndUpdate(id, data, { new: true });
  if (!priority) {
    throw new AppError('Priority not found', 404);
  }
  return priority;
};

/* =========================
   DELETE (Soft Delete)
 ========================= */
export const deletePriority = async (id) => {
  const priority = await Priority.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!priority) {
    throw new AppError('Priority not found', 404);
  }
  return priority;
};
