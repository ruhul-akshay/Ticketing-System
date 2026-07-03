import { create } from 'zustand';
import api from '../api/mockAxios';

export const usePreAssignmentRuleStore = create((set, get) => ({
  rules: [],
  isLoading: false,
  error: null,

  fetchRules: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/pre-assignment-rules');
      set({ rules: Array.isArray(response.data) ? response.data : [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch pre-assignment rules:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch rules', isLoading: false });
    }
  },

  createRule: async (ruleData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/pre-assignment-rules', ruleData);
      set((state) => ({
        rules: [...state.rules, response.data].sort((a, b) => a.evaluationOrder - b.evaluationOrder),
        isLoading: false
      }));
      return { success: true };
    } catch (error) {
      console.error('Failed to create pre-assignment rule:', error);
      set({ isLoading: false });
      return { success: false, message: error.response?.data?.message || 'Failed to create rule' };
    }
  },

  updateRule: async (id, ruleData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/pre-assignment-rules/${id}`, ruleData);
      set((state) => ({
        rules: state.rules
          .map((r) => ((r._id || r.id) === id ? response.data : r))
          .sort((a, b) => a.evaluationOrder - b.evaluationOrder),
        isLoading: false
      }));
      return { success: true };
    } catch (error) {
      console.error('Failed to update pre-assignment rule:', error);
      set({ isLoading: false });
      return { success: false, message: error.response?.data?.message || 'Failed to update rule' };
    }
  },

  deleteRule: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/pre-assignment-rules/${id}`);
      set((state) => ({
        rules: state.rules.filter((r) => (r._id || r.id) !== id),
        isLoading: false
      }));
      return { success: true };
    } catch (error) {
      console.error('Failed to delete pre-assignment rule:', error);
      set({ isLoading: false });
      return { success: false, message: error.response?.data?.message || 'Failed to delete rule' };
    }
  }
}));
