import * as departmentService from '../services/department.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await departmentService.getAllDepartments(req.user);
  res.json(departments);
});

export const createDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.createDepartment(req.body);
  res.status(201).json(department);
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.updateDepartment(req.params.id, req.body);
  res.json(department);
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  await departmentService.deleteDepartment(req.params.id);
  res.json({ message: 'Department deleted successfully' });
});

export const addCategory = asyncHandler(async (req, res) => {
  const department = await departmentService.addCategory(
    req.params.departmentId,
    req.body
  );
  res.status(201).json(department);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const result = await departmentService.updateCategory(
    req.params.departmentId,
    req.params.categoryId,
    req.body
  );
  res.json(result);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const department = await departmentService.deleteCategory(
    req.params.departmentId,
    req.params.categoryId
  );
  res.json(department);
});
