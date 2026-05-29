import Department from '../../models/Department.js';

/* =========================
   GET ALL DEPARTMENTS
========================= */
export const getAllDepartments = async (user) => {
  let query = {};

  if (user.role === 'admin' && user.department) {
    query._id = user.department;
  }

  return await Department.find(query);
};

/* =========================
   CREATE DEPARTMENT
========================= */
export const createDepartment = async ({ name, description, categories = [] }) => {
  const exists = await Department.findOne({
    name: { $regex: `^${name}$`, $options: 'i' }
  });

  if (exists) {
    throw new Error('Department already exists');
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
  return await Department.findByIdAndUpdate(id, data, { new: true });
};

/* =========================
   DELETE DEPARTMENT
========================= */
export const deleteDepartment = async (id) => {
  return await Department.findByIdAndDelete(id);
};

/* =========================
   ADD CATEGORY
========================= */
export const addCategory = async (departmentId, categoryData) => {
  const department = await Department.findById(departmentId);
  if (!department) return null;

  const exists = department.categories.some(
    c => c.name.toLowerCase() === categoryData.name.toLowerCase()
  );

  if (exists) throw new Error('Category already exists');

  department.categories.push(categoryData);
  await department.save();

  return department;
};

/* =========================
   UPDATE CATEGORY
========================= */
export const updateCategory = async (departmentId, categoryId, data) => {
  const department = await Department.findById(departmentId);
  if (!department) return null;

  const category = department.categories.id(categoryId);
  if (!category) return 'CATEGORY_NOT_FOUND';

  Object.assign(category, data);
  await department.save();

  return department;
};

/* =========================
   DELETE CATEGORY
========================= */
export const deleteCategory = async (departmentId, categoryId) => {
  const department = await Department.findById(departmentId);
  if (!department) return null;

  department.categories.pull(categoryId);
  await department.save();

  return department;
};