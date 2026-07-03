import Priority from '../../models/Priority.js';

/* =========================
   GET ALL
========================= */
export const getAllPriorities = async () => {
  return await Priority.find({ isActive: true }).sort({ level: 1 });
};

/* =========================
   CREATE
========================= */
export const createPriority = async (data) => {
  const exists = await Priority.findOne({
    name: { $regex: `^${data.name}$`, $options: 'i' }
  });

  if (exists) {
    throw new Error('Priority already exists');
  }

  return await Priority.create(data);
};

/* =========================
   UPDATE
========================= */
export const updatePriority = async (id, data) => {
  return await Priority.findByIdAndUpdate(id, data, { new: true });
};

/* =========================
   DELETE (Soft Delete)
========================= */
export const deletePriority = async (id) => {
  return await Priority.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
};