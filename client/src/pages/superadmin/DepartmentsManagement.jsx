import React, { useEffect, useState } from 'react';
import { useDepartmentStore } from '../../core/store/useDepartmentStore';
import { Edit2, Trash2, Plus, Search, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DepartmentsManagement() {
  const { departments, fetchDepartments, isLoading, addDepartment, updateDepartment, deleteDepartment } = useDepartmentStore();
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', categories: [] });
  const [categoryInput, setCategoryInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const filteredDepartments = departments.filter(d => 
    d.name?.toLowerCase().includes(search.toLowerCase()) || 
    d.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (dept = null) => {
    if (dept) {
      setEditingDepartment(dept);
      setFormData({ name: dept.name, description: dept.description, categories: dept.categories || [] });
    } else {
      setEditingDepartment(null);
      setFormData({ name: '', description: '', categories: [] });
    }
    setCategoryInput('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (categoryInput.trim() && !formData.categories.includes(categoryInput.trim())) {
      setFormData({ ...formData, categories: [...formData.categories, categoryInput.trim()] });
      setCategoryInput('');
    }
  };

  const handleRemoveCategory = (catToRemove) => {
    setFormData({ ...formData, categories: formData.categories.filter(c => c !== catToRemove) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    let success;
    if (editingDepartment) {
      success = await updateDepartment(editingDepartment._id, formData);
    } else {
      success = await addDepartment(formData);
    }
    setIsSubmitting(false);
    if (success) handleCloseModal();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to completely remove this department?')) {
      await deleteDepartment(id);
    }
  };

  return (
    <div className="w-full pt-2">
      <div className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Departments Management</h1>
          <p className="text-muted-foreground mt-2">Manage system departments and their respective ticket routing categories.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg text-white text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap">
          <Plus size={18} strokeWidth={3} /> Add Department
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden p-6 max-w-6xl bg-gradient-to-br from-card to-background/50 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search departments..."
              className="w-full h-11 bg-background/80 border border-border/80 text-sm text-foreground rounded-lg pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all font-medium shadow-inner"
            />
          </div>
          <span className="text-sm text-muted-foreground font-medium hidden sm:block bg-white/5 py-1.5 px-4 rounded-full border border-white/10">
            Showing {filteredDepartments.length} departments
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="text-xs uppercase bg-black/20 text-white/70">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg font-bold tracking-widest w-1/4">Name</th>
                <th className="px-6 py-4 font-bold tracking-widest w-1/3">Description</th>
                <th className="px-6 py-4 font-bold tracking-widest">Routing Categories</th>
                <th className="px-6 py-4 font-bold tracking-widest">Status</th>
                <th className="px-6 py-4 rounded-tr-lg font-bold tracking-widest text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && departments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center animate-pulse font-medium">Loading departments...</td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center font-medium opacity-50">No departments found.</td>
                </tr>
              ) : (
                filteredDepartments.map((dept, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    key={dept._id || i} 
                    className="border-b border-border/50 hover:bg-white/[0.04] transition-colors group"
                  >
                    <td className="px-6 py-5 text-white font-semibold text-[15px]">{dept.name}</td>
                    <td className="px-6 py-5 font-medium">{dept.description}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        {dept.categories?.map((cat) => (
                          <span key={cat} className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border border-white/10 bg-white/5 text-slate-300">
                            {cat}
                          </span>
                        ))}
                        {(!dept.categories || dept.categories.length === 0) && (
                          <span className="text-xs opacity-50">No categories</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase border shadow-sm ${
                        dept.status === 'active' ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-slate-500/30 text-slate-400 bg-slate-500/10'
                      }`}>
                        {dept.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-right flex justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(dept)} className="p-2 bg-white/5 hover:bg-blue-500/20 text-white hover:text-blue-400 rounded-lg transition-colors border border-transparent hover:border-blue-500/30">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(dept._id)} className="p-2 bg-white/5 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-[#111827] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <h2 className="text-xl font-bold text-white">
                    {editingDepartment ? 'Edit Department' : 'Create New Department'}
                  </h2>
                  <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                  <form id="department-form" onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Department Name *</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g., IT Support"
                        className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Description</label>
                      <textarea 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        placeholder="Brief overview of department scope..."
                        className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-all font-medium resize-none"
                      />
                    </div>
                    <div className="space-y-3 pt-2">
                      <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest block">Routing Categories</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={categoryInput}
                          onChange={(e) => setCategoryInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(e); } }}
                          placeholder="Add new category and press Enter..."
                          className="flex-1 bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 transition-all text-sm font-medium"
                        />
                        <button type="button" onClick={handleAddCategory} className="px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors">
                          <Plus size={18} />
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3 min-h-[40px] p-3 border border-white/5 rounded-xl bg-black/20">
                        {formData.categories.map((cat) => (
                          <span key={cat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold tracking-wider uppercase border border-blue-500/30 bg-blue-500/10 text-blue-300">
                            {cat}
                            <button type="button" onClick={() => handleRemoveCategory(cat)} className="text-blue-300 hover:text-white rounded-full bg-white/5 hover:bg-white/20 p-0.5 ml-1 transition-colors">
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                        {formData.categories.length === 0 && (
                          <span className="text-sm text-slate-500 italic py-1">No categories assigned yet.</span>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
                
                <div className="px-6 py-5 border-t border-white/10 bg-white/5 flex justify-end gap-3 shrink-0">
                  <button onClick={handleCloseModal} className="px-4 py-2 text-slate-300 hover:text-white font-semibold transition-colors">Cancel</button>
                  <button 
                    form="department-form" 
                    type="submit" 
                    disabled={isSubmitting || !formData.name}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                  >
                    {isSubmitting ? 'Saving...' : editingDepartment ? 'Save Changes' : 'Create Department'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
