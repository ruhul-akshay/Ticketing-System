import Department from '../models/Department.js';
import { AppError } from '../utils/AppError.js';

/* =========================
   GET ALL DEPARTMENTS
 ========================= */
export const getAllDepartments = async (user) => {
  let query = {};

  if ((user?.role === 'consultant' || user?.role === 'admin') && user.department) {
    query._id = user.department;
  }

  return await Department.find(query);
};

/* =========================
   CREATE DEPARTMENT
 ========================= */
export const createDepartment = async ({ name, description, categories = [] }) => {
  if (!name?.trim()) {
    throw new AppError('Department name is required', 400);
  }

  const exists = await Department.findOne({
    name: { $regex: `^${name.trim()}$`, $options: 'i' }
  });

  if (exists) {
    throw new AppError('Department already exists', 409);
  }

  return await Department.create({
    name: name.trim(),
    description: description?.trim() || '',
    categories: Array.isArray(categories) ? categories : []
  });
};

/* =========================
   UPDATE DEPARTMENT
 ========================= */
export const updateDepartment = async (id, data) => {
  const department = await Department.findByIdAndUpdate(id, data, { new: true });
  if (!department) {
    throw new AppError('Department not found', 404);
  }
  return department;
};

/* =========================
   DELETE DEPARTMENT
 ========================= */
export const deleteDepartment = async (id) => {
  const department = await Department.findByIdAndDelete(id);
  if (!department) {
    throw new AppError('Department not found', 404);
  }
  return department;
};

/* =========================
   ADD CATEGORY
 ========================= */
export const addCategory = async (departmentId, categoryData) => {
  const department = await Department.findById(departmentId);
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  const categoryName = typeof categoryData === 'string' ? categoryData : categoryData?.name;
  if (!categoryName?.trim()) {
    throw new AppError('Category name is required', 400);
  }

  const exists = department.categories.some(
    c => c.toLowerCase() === categoryName.trim().toLowerCase()
  );

  if (exists) {
    throw new AppError('Category already exists', 409);
  }

  department.categories.push(categoryName.trim());
  await department.save();

  return department;
};

/* =========================
   UPDATE CATEGORY
 ========================= */
export const updateCategory = async (departmentId, categoryId, data) => {
  const department = await Department.findById(departmentId);
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  const newName = typeof data === 'string' ? data : data?.name;
  if (!newName?.trim()) {
    throw new AppError('New category name is required', 400);
  }

  const index = department.categories.findIndex(c => c === categoryId);
  if (index === -1) {
    const idx = parseInt(categoryId, 10);
    if (!isNaN(idx) && idx >= 0 && idx < department.categories.length) {
      department.categories[idx] = newName.trim();
    } else {
      throw new AppError('Category not found', 404);
    }
  } else {
    department.categories[index] = newName.trim();
  }

  await department.save();
  return department;
};

/* =========================
   DELETE CATEGORY
 ========================= */
export const deleteCategory = async (departmentId, categoryId) => {
  const department = await Department.findById(departmentId);
  if (!department) {
    throw new AppError('Department not found', 404);
  }

  const index = department.categories.indexOf(categoryId);
  if (index !== -1) {
    department.categories.splice(index, 1);
  } else {
    const idx = parseInt(categoryId, 10);
    if (!isNaN(idx) && idx >= 0 && idx < department.categories.length) {
      department.categories.splice(idx, 1);
    }
  }

  await department.save();
  return department;
};
