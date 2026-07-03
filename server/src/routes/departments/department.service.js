import Department from '../../models/Department.js';

/* =========================
   GET ALL DEPARTMENTS
========================= */
export const getAllDepartments = async (user) => {
  let query = {};

  if ((user.role === 'consultant' || user.role === 'admin') && user.department) {
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

  const categoryName = typeof categoryData === 'string' ? categoryData : categoryData?.name;
  if (!categoryName?.trim()) throw new Error('Category name is required');

  const exists = department.categories.some(
    c => c.toLowerCase() === categoryName.trim().toLowerCase()
  );

  if (exists) throw new Error('Category already exists');

  department.categories.push(categoryName.trim());
  await department.save();

  return department;
};

/* =========================
   UPDATE CATEGORY
========================= */
export const updateCategory = async (departmentId, categoryId, data) => {
  const department = await Department.findById(departmentId);
  if (!department) return null;

  const newName = typeof data === 'string' ? data : data?.name;
  if (!newName?.trim()) throw new Error('New category name is required');

  // categoryId could be the category name string or an index
  const index = department.categories.findIndex(c => c === categoryId);
  if (index === -1) {
    const idx = parseInt(categoryId, 10);
    if (!isNaN(idx) && idx >= 0 && idx < department.categories.length) {
      department.categories[idx] = newName.trim();
    } else {
      return 'CATEGORY_NOT_FOUND';
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
  if (!department) return null;

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