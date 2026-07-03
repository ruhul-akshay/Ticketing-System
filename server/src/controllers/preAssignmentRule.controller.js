import PreAssignmentRule from '../models/PreAssignmentRule.js';

export const getRules = async (req, res) => {
  try {
    const rules = await PreAssignmentRule.find()
      .populate('clientUser', 'name email')
      .populate('client', 'name')
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('ccConsultants', 'name email')
      .sort({ evaluationOrder: 1 });
    res.json(rules);
  } catch (error) {
    console.error('Get rules error:', error);
    res.status(500).json({ message: 'Failed to retrieve pre-assignment rules.' });
  }
};

export const createRule = async (req, res) => {
  try {
    const { name, conditionType, clientUser, client, department, categories, erpIncidentType, assignedTo, ccConsultants, evaluationOrder, isActive } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Rule name is required.' });
    }
    if (!conditionType) {
      return res.status(400).json({ message: 'Condition type is required.' });
    }
    if (!assignedTo) {
      return res.status(400).json({ message: 'Primary assigned consultant is required.' });
    }

    // Validation of matching entities based on conditionType
    if (conditionType === 'clientUser' && !clientUser) {
      return res.status(400).json({ message: 'Specific Client User is required for this condition type.' });
    }
    if (conditionType === 'client' && !client) {
      return res.status(400).json({ message: 'Specific Client Company is required for this condition type.' });
    }
    if (conditionType === 'department' && !department) {
      return res.status(400).json({ message: 'Specific Department is required for this condition type.' });
    }
    if (conditionType === 'erpIncidentType' && (!erpIncidentType || erpIncidentType.length === 0)) {
      return res.status(400).json({ message: 'ERP Incident Type is required for this condition type.' });
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

    const populated = await PreAssignmentRule.findById(rule._id)
      .populate('clientUser', 'name email')
      .populate('client', 'name')
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('ccConsultants', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create rule error:', error);
    res.status(500).json({ message: error.message || 'Failed to create pre-assignment rule.' });
  }
};

export const updateRule = async (req, res) => {
  try {
    const { name, conditionType, clientUser, client, department, categories, erpIncidentType, assignedTo, ccConsultants, evaluationOrder, isActive } = req.body;
    const rule = await PreAssignmentRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({ message: 'Pre-assignment rule not found.' });
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

    const populated = await PreAssignmentRule.findById(rule._id)
      .populate('clientUser', 'name email')
      .populate('client', 'name')
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('ccConsultants', 'name email');

    res.json(populated);
  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({ message: error.message || 'Failed to update pre-assignment rule.' });
  }
};

export const deleteRule = async (req, res) => {
  try {
    const rule = await PreAssignmentRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Pre-assignment rule not found.' });
    }
    res.json({ message: 'Pre-assignment rule deleted successfully.', id: req.params.id });
  } catch (error) {
    console.error('Delete rule error:', error);
    res.status(500).json({ message: 'Failed to delete pre-assignment rule.' });
  }
};
