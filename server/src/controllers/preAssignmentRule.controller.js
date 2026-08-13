import * as preAssignmentRuleService from '../services/preAssignmentRule.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getRules = asyncHandler(async (req, res) => {
  const rules = await preAssignmentRuleService.fetchRules();
  res.json(rules);
});

export const createRule = asyncHandler(async (req, res) => {
  const rule = await preAssignmentRuleService.createPreAssignmentRule(req.body);
  res.status(201).json(rule);
});

export const updateRule = asyncHandler(async (req, res) => {
  const rule = await preAssignmentRuleService.updatePreAssignmentRule(req.params.id, req.body);
  res.json(rule);
});

export const deleteRule = asyncHandler(async (req, res) => {
  await preAssignmentRuleService.deletePreAssignmentRule(req.params.id);
  res.json({ message: 'Pre-assignment rule deleted successfully.', id: req.params.id });
});
