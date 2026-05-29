import * as departmentService from './department.service.js';
import { isValidObjectId } from './department.helpers.js';

/* =========================
   GET ALL
========================= */
export const getDepartments = async (req, res) => {
  try {
    const departments = await departmentService.getAllDepartments(req.user);
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch departments' });
  }
};

/* =========================
   CREATE
========================= */
export const createDepartment = async (req, res) => {
  try {
    if (!req.body.name?.trim())
      return res.status(400).json({ message: 'Department name is required' });

    const department = await departmentService.createDepartment(req.body);
    res.status(201).json(department);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* =========================
   UPDATE
========================= */
export const updateDepartment = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Invalid department ID' });

    const department = await departmentService.updateDepartment(
      req.params.id,
      req.body
    );

    if (!department)
      return res.status(404).json({ message: 'Department not found' });

    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update department' });
  }
};

/* =========================
   DELETE
========================= */
export const deleteDepartment = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Invalid department ID' });

    const department = await departmentService.deleteDepartment(req.params.id);

    if (!department)
      return res.status(404).json({ message: 'Department not found' });

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete department' });
  }
};

/* =========================
   ADD CATEGORY
========================= */
export const addCategory = async (req, res) => {
  try {
    const department = await departmentService.addCategory(
      req.params.departmentId,
      req.body
    );

    if (!department)
      return res.status(404).json({ message: 'Department not found' });

    res.status(201).json(department);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* =========================
   UPDATE CATEGORY
========================= */
export const updateCategory = async (req, res) => {
  try {
    const result = await departmentService.updateCategory(
      req.params.departmentId,
      req.params.categoryId,
      req.body
    );

    if (!result)
      return res.status(404).json({ message: 'Department not found' });

    if (result === 'CATEGORY_NOT_FOUND')
      return res.status(404).json({ message: 'Category not found' });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category' });
  }
};

/* =========================
   DELETE CATEGORY
========================= */
export const deleteCategory = async (req, res) => {
  try {
    const department = await departmentService.deleteCategory(
      req.params.departmentId,
      req.params.categoryId
    );

    if (!department)
      return res.status(404).json({ message: 'Department not found' });

    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete category' });
  }
};