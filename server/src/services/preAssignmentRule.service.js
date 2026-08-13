import PreAssignmentRule from '../models/PreAssignmentRule.js';
import { AppError } from '../utils/AppError.js';

export const fetchRules = async () => {
  return await PreAssignmentRule.find()
    .populate('clientUser', 'name email')
    .populate('client', 'name')
    .populate('department', 'name')
    .populate('assignedTo', 'name email')
    .populate('ccConsultants', 'name email')
    .sort({ evaluationOrder: 1 });
};

export const createPreAssignmentRule = async (data) => {
  const { name, conditionType, clientUser, client, department, categories, erpIncidentType, assignedTo, ccConsultants, evaluationOrder, isActive } = data;

  if (!name?.trim()) {
    throw new AppError('Rule name is required.', 400);
  }
  if (!conditionType) {
    throw new AppError('Condition type is required.', 400);
  }
  if (!assignedTo) {
    throw new AppError('Primary assigned consultant is required.', 400);
  }

  // Validation of matching entities based on conditionType
  if (conditionType === 'clientUser' && !clientUser) {
    throw new AppError('Specific Client User is required for this condition type.', 400);
  }
  if (conditionType === 'client' && !client) {
    throw new AppError('Specific Client Company is required for this condition type.', 400);
  }
  if (conditionType === 'department' && !department) {
    throw new AppError('Specific Department is required for this condition type.', 400);
  }
  if (conditionType === 'erpIncidentType' && (!erpIncidentType || erpIncidentType.length === 0)) {
    throw new AppError('ERP Incident Type is required for this condition type.', 400);
  }

  const rule = new PreAssignmentRule({
    name: name.trim(),
    conditionType,
    clientUser: conditionType === 'clientUser' ? clientUser : null,
    client: conditionType === 'client' ? client : null,
    department: conditionType === 'department' ? department : null,
    categories: conditionType === 'department' ? (categories || []) : [],
    erpIncidentType: conditionType === 'erpIncidentType' ? (erpIncidentType || []) : [],
    assignedTo,
    ccConsultants: Array.isArray(ccConsultants) ? ccConsultants : [],
    evaluationOrder: evaluationOrder || 0,
    isActive: isActive !== undefined ? isActive : true
  });

  await rule.save();

  return await PreAssignmentRule.findById(rule._id)
    .populate('clientUser', 'name email')
    .populate('client', 'name')
    .populate('department', 'name')
    .populate('assignedTo', 'name email')
    .populate('ccConsultants', 'name email');
};

export const updatePreAssignmentRule = async (id, data) => {
  const { name, conditionType, clientUser, client, department, categories, erpIncidentType, assignedTo, ccConsultants, evaluationOrder, isActive } = data;
  
  const rule = await PreAssignmentRule.findById(id);
  if (!rule) {
    throw new AppError('Pre-assignment rule not found.', 404);
  }

  if (name !== undefined) rule.name = name.trim();
  if (conditionType !== undefined) rule.conditionType = conditionType;
  if (assignedTo !== undefined) rule.assignedTo = assignedTo;
  if (ccConsultants !== undefined) rule.ccConsultants = Array.isArray(ccConsultants) ? ccConsultants : [];
  if (evaluationOrder !== undefined) rule.evaluationOrder = evaluationOrder;
  if (isActive !== undefined) rule.isActive = isActive;

  if (conditionType !== undefined || clientUser !== undefined || client !== undefined || department !== undefined || categories !== undefined || erpIncidentType !== undefined) {
    const type = conditionType || rule.conditionType;
    rule.clientUser = type === 'clientUser' ? (clientUser !== undefined ? clientUser : rule.clientUser) : null;
    rule.client = type === 'client' ? (client !== undefined ? client : rule.client) : null;
    rule.department = type === 'department' ? (department !== undefined ? department : rule.department) : null;
    rule.categories = type === 'department' ? (categories !== undefined ? categories : rule.categories) : [];
    rule.erpIncidentType = type === 'erpIncidentType' ? (erpIncidentType !== undefined ? erpIncidentType : rule.erpIncidentType) : [];
  }

  await rule.save();

  return await PreAssignmentRule.findById(rule._id)
    .populate('clientUser', 'name email')
    .populate('client', 'name')
    .populate('department', 'name')
    .populate('assignedTo', 'name email')
    .populate('ccConsultants', 'name email');
};

export const deletePreAssignmentRule = async (id) => {
  const rule = await PreAssignmentRule.findByIdAndDelete(id);
  if (!rule) {
    throw new AppError('Pre-assignment rule not found.', 404);
  }
  return rule;
};
