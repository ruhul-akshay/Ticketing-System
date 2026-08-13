import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Download, Copy, CheckCircle, TrendingUp, BarChart3, FileText, MessageSquare, Clock, Tag, BookOpen, ChevronDown, Eye } from 'lucide-react';
import { useTicketStore } from '../../store/useTicketStore';
import { useDepartmentStore } from '../../store/useDepartmentStore';
import { Button } from '../../components/Button';
import Badge from '../../components/ui/Badge';

export default function SolutionsDirectory() {
  const { tickets, fetchTickets, isLoading } = useTicketStore();
  const { fetchDepartments } = useDepartmentStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [expandedSolutions, setExpandedSolutions] = useState({});
  const [copiedSolutionId, setCopiedSolutionId] = useState(null);

  useEffect(() => {
    fetchTickets();
    fetchDepartments();
  }, [fetchTickets, fetchDepartments]);

  // Extract valid solutions from ticket API stream
  const resolvedTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const original = ticket.original || {};
      return ticket.status === 'Resolved' && original.solution && original.solution.trim().length > 0;
    });
  }, [tickets]);

  const filteredSolutions = useMemo(() => {
    let filtered = [...resolvedTickets];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => {
        const o = t.original || {};
        return (
          t.title?.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          o.solution?.toLowerCase().includes(query) ||
          o.category?.toLowerCase().includes(query) ||
          t.ticketNumber?.toString().toLowerCase().includes(query)
        );
      });
    }
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(t.original?.category));
    }
    
    if (selectedDepartments.length > 0) {
      filtered = filtered.filter(t => {
        const dId = t.original?.department?._id || t.original?.department;
        return selectedDepartments.includes(dId);
      });
    }
    
    if (selectedPriorities.length > 0) {
      filtered = filtered.filter(t => selectedPriorities.includes(t.priority?.toLowerCase()));
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.original?.resolvedAt || a.original?.updatedAt || a.createdAt);
      const dateB = new Date(b.original?.resolvedAt || b.original?.updatedAt || b.createdAt);
      
      switch (sortBy) {
        case 'recent': return dateB - dateA;
        case 'oldest': return dateA - dateB;
        case 'title': return a.title?.localeCompare(b.title);
        case 'department': return (a.department || '').localeCompare(b.department || '');
        default: return dateB - dateA;
      }
    });
    
    return filtered;
  }, [resolvedTickets, searchQuery, selectedCategories, selectedDepartments, selectedPriorities, sortBy]);

  const analyticsData = useMemo(() => {
    const data = {
      totalSolutions: resolvedTickets.length,
      byDepartment: {},
      byCategory: {},
      byPriority: {},
      topContributors: {},
      mostCommonIssues: {}
    };
    
    resolvedTickets.forEach(t => {
      const o = t.original || {};
      
      const deptName = t.department || 'Global Layer';
      data.byDepartment[deptName] = (data.byDepartment[deptName] || 0) + 1;
      
      const cat = o.category || 'Unclassified Data';
      data.byCategory[cat] = (data.byCategory[cat] || 0) + 1;
      
      data.byPriority[t.priority?.toLowerCase()] = (data.byPriority[t.priority?.toLowerCase()] || 0) + 1;
      
      const resolver = o.resolvedBy?.name || o.assignedTo?.name || t.assignee || 'SysOps Core';
      data.topContributors[resolver] = (data.topContributors[resolver] || 0) + 1;

      data.mostCommonIssues[t.title] = (data.mostCommonIssues[t.title] || 0) + 1;
    });

    const formatArray = (obj) => Object.entries(obj).map(([name, count]) => ({name, count})).sort((a,b)=>b.count-a.count);
    
    return {
      ...data,
      byDepartment: formatArray(data.byDepartment),
      byCategory: formatArray(data.byCategory),
      topContributors: formatArray(data.topContributors).slice(0, 10),
      mostCommonIssues: Object.entries(data.mostCommonIssues).map(([title,count])=>({title,count})).sort((a,b)=>b.count-a.count).slice(0, 5)
    };
  }, [resolvedTickets]);

  const allCategories = useMemo(() => Array.from(new Set(resolvedTickets.map(t => t.original?.category).filter(Boolean))), [resolvedTickets]);
  const allPriorities = useMemo(() => Array.from(new Set(resolvedTickets.map(t => t.priority?.toLowerCase()).filter(Boolean))), [resolvedTickets]);

  const toggleExpand = (id) => setExpandedSolutions(prev => ({ ...prev, [id]: !prev[id] }));

  const handleDownloadAttachment = async (e, ticketId, attachmentId, filename) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'https://ticketing-backend-61yr.onrender.com/api';
      const response = await fetch(`${baseUrl}/tickets/${ticketId}/attachment/${attachmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 5000);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file'); 
    }
  };

  const handleViewAttachment = async (e, ticketId, attachmentId, filename) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'https://ticketing-backend-61yr.onrender.com/api';
      const response = await fetch(`${baseUrl}/tickets/${ticketId}/view/${attachmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to load preview');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error viewing file:', err);
      alert('Failed to view file'); 
    }
  };

  const copySolution = async (id, sol) => {
    try {
      await navigator.clipboard.writeText(sol);
      setCopiedSolutionId(id);
      setTimeout(() => setCopiedSolutionId(null), 2000);
    } catch (err) { console.error('Failed to copy', err); }
  };

  const exportToCSV = () => {
    const headers = ['Ticket ID', 'Title', 'Category', 'Department', 'Priority', 'Issue Description', 'Solution', 'Resolved By', 'Resolution Date'];
    const csvData = filteredSolutions.map(t => {
      const o = t.original || {};
      return [
        t.ticketNumber || t.id,
        `"${t.title?.replace(/"/g, '""')}"`,
        o.category || 'N/A',
        t.department || 'N/A',
        t.priority || 'N/A',
        `"${t.description?.replace(/"/g, '""')}"`,
        `"${o.solution?.replace(/"/g, '""')}"`,
        o.resolvedBy?.name || o.assignedTo?.name || t.assignee || 'SysOps',
        o.resolvedAt ? new Date(o.resolvedAt).toISOString().split('T')[0] : 'N/A'
      ];
    });
    
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sysops_solutions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getPriorityColor = (p) => {
    switch (p?.toLowerCase()) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  return (
    <div className="w-full relative font-sans min-h-screen pt-4">
      {/* Header Container */}
      <div className="mb-10 text-center relative z-10">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="w-20 h-20 bg-gradient-to-br from-[#ED1B2F]/20 to-[#455185]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 border border-red-500/30 shadow-[0_0_40px_rgba(237,27,47,0.3)]">
          <BookOpen size={40} className="text-[#ED1B2F] -rotate-3" />
        </motion.div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-4">Solutions Matrix</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">Global secure knowledge base archiving {resolvedTickets.length} resolved anomaly clusters and recovery protocols.</p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-8 max-w-lg mx-auto">
          <Button variant="outline" className="flex items-center gap-2 border-white/5 bg-white/5 hover:bg-white/10" onClick={exportToCSV}>
            <Download size={16} /> Export Intel (CSV)
          </Button>
          <div className="flex bg-[#111620] border border-white/10 rounded-xl overflow-hidden p-1 shadow-inner">
            <button className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${viewMode==='grid'?'bg-white/10 text-white shadow':'text-slate-500 hover:text-white'}`} onClick={()=>setViewMode('grid')}>Grid</button>
            <button className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${viewMode==='list'?'bg-white/10 text-white shadow':'text-slate-500 hover:text-white'}`} onClick={()=>setViewMode('list')}>Linear</button>
            <button className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${viewMode==='analytics'?'bg-white/10 text-white shadow':'text-slate-500 hover:text-white'}`} onClick={()=>setViewMode('analytics')}>SysMetrics</button>
          </div>
        </div>
      </div>

       {/* Search & Filter Matrix */}
      <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 mb-8 shadow-2xl relative z-10 w-full">
         <div className="flex flex-col lg:flex-row gap-4 mb-4">
           <div className="relative flex-1">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
             <input type="text" placeholder="Search operational matrices, error codex, or intel logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#181f2b] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 shadow-inner font-medium text-sm transition-all" />
           </div>
           <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-[#181f2b] border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500/50 appearance-none min-w-[200px] font-bold tracking-widest uppercase">
             <option value="recent">Temporal: Decending</option>
             <option value="oldest">Temporal: Ascending</option>
             <option value="title">Alphabetical (A-Z)</option>
             <option value="department">Sector Grouping</option>
           </select>
         </div>

         <div className="flex flex-wrap gap-2 items-center">
            {allCategories.length > 0 && (
               <div className="flex flex-wrap items-center gap-2 mr-4 mb-2 sm:mb-0">
                 <Filter size={14} className="text-slate-500" />
                 <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Params:</span>
                 {allCategories.map(cat => (
                   <button key={cat} onClick={() => setSelectedCategories(p=>p.includes(cat)?p.filter(x=>x!==cat):[...p,cat])} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedCategories.includes(cat) ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(237,27,47,0.4)]' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'}`}>
                     {cat}
                   </button>
                 ))}
               </div>
            )}
            
            {allPriorities.length > 0 && (
               <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-0">
                 <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Risk Level:</span>
                 {allPriorities.map(p => (
                   <button key={p} onClick={() => setSelectedPriorities(prev=>prev.includes(p)?prev.filter(x=>x!==p):[...prev,p])} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedPriorities.includes(p) ? (p==='high'?'bg-red-500/20 border-red-500 text-red-500':p==='medium'?'bg-yellow-500/20 border-yellow-500 text-yellow-500':'bg-emerald-500/20 border-emerald-500 text-emerald-500') : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}>
                     {p.toUpperCase()}
                   </button>
                 ))}
               </div>
            )}

            {(selectedCategories.length > 0 || selectedPriorities.length > 0) && (
              <button onClick={()=>{setSelectedCategories([]);setSelectedPriorities([]);}} className="text-[11px] font-bold text-red-400 hover:text-red-300 ml-auto uppercase tracking-widest bg-red-400/10 px-4 py-2 rounded-lg">Reset Core</button>
            )}
         </div>
      </div>

      {viewMode === 'analytics' ? (
        <div className="space-y-6 relative z-10 w-full">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
                <div className="p-3 bg-red-500/20 text-red-500 rounded-xl"><FileText size={24} /></div>
                <div><div className="text-3xl font-black text-white">{analyticsData.totalSolutions}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Saved Protocols</div></div>
              </div>
              <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><TrendingUp size={24} /></div>
                <div><div className="text-3xl font-black text-white">{analyticsData.byDepartment.length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Active Sectors</div></div>
              </div>
              <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><BarChart3 size={24} /></div>
                <div><div className="text-3xl font-black text-white">{analyticsData.byCategory.length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Sub-Categories</div></div>
              </div>
              <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><CheckCircle size={24} /></div>
                <div><div className="text-2xl font-black text-white truncate max-w-[120px]">{analyticsData.topContributors[0]?.name?.split(' ')[0] || 'N/A'}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Top Architect</div></div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
               <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl">
                  <h5 className="text-[13px] font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2"><TrendingUp className="text-red-500" size={16}/> Load per Sector</h5>
                  <div className="space-y-4">
                     {analyticsData.byDepartment.slice(0, 8).map((dept, i) => (
                       <div key={dept.name} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3 w-1/2">
                            <span className="text-[10px] text-slate-600 font-bold w-4">{i+1}</span>
                            <span className="text-[13px] font-bold text-slate-300 truncate">{dept.name}</span>
                          </div>
                          <div className="flex items-center justify-end gap-4 w-1/2">
                            <div className="w-full max-w-[150px] h-1.5 bg-[#181f2b] rounded-full overflow-hidden">
                              <div className="h-full bg-red-600 rounded-full group-hover:bg-red-500 transition-colors" style={{width: `${(dept.count/analyticsData.totalSolutions)*100}%`}}></div>
                            </div>
                            <span className="text-[13px] font-black text-white min-w-[20px] text-right">{dept.count}</span>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>

                <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl">
                  <h5 className="text-[13px] font-black text-white mb-6 uppercase tracking-widest flex items-center gap-2"><Tag className="text-emerald-500" size={16}/> Resolution Categories</h5>
                  <div className="space-y-4">
                     {analyticsData.byCategory.slice(0, 8).map((cat, i) => (
                       <div key={cat.name} className="flex items-center justify-between group">
                          <div className="flex items-center gap-3 w-1/2">
                            <span className="text-[10px] text-slate-600 font-bold w-4">{i+1}</span>
                            <span className="text-[13px] font-bold text-slate-300 truncate">{cat.name}</span>
                          </div>
                          <div className="flex items-center justify-end gap-4 w-1/2">
                            <div className="w-full max-w-[150px] h-1.5 bg-[#181f2b] rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full group-hover:bg-emerald-400 transition-colors" style={{width: `${(cat.count/analyticsData.totalSolutions)*100}%`}}></div>
                            </div>
                            <span className="text-[13px] font-black text-white min-w-[20px] text-right">{cat.count}</span>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
           </div>
        </div>
      ) : (
        <div className={`relative z-10 w-full ${viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'flex flex-col gap-6'}`}>
           {isLoading && filteredSolutions.length === 0 ? (
             <div className="col-span-full py-20 text-center animate-pulse text-slate-500 font-bold uppercase tracking-widest">Decrypting Archive Data...</div>
           ) : filteredSolutions.length === 0 ? (
             <div className="col-span-full py-20 text-center text-slate-500 font-bold uppercase tracking-widest">Zero Intel logs match current parameters.</div>
           ) : filteredSolutions.map((ticket, i) => {
             const o = ticket.original || {};
             const isExpanded = expandedSolutions[ticket.id];
             const rawSol = o.solution || 'No data recorded.';
             const solutionPreview = rawSol.length > 200 && !isExpanded ? `${rawSol.substring(0,200)}...` : rawSol;

             return (
               <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.03}} key={ticket.id} className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl hover:border-white/10 hover:-translate-y-1 transition-all group flex flex-col w-full h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1 pr-6">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                         <Badge color={getPriorityColor(ticket.priority)} size="sm">{ticket.priority}</Badge>
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded shadow-sm">ID: {ticket.ticketNumber}</span>
                      </div>
                      <h4 className="text-xl font-black text-white group-hover:text-[#ED1B2F] transition-colors leading-tight mb-3">
                        {ticket.title}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {o.category && <span className="text-[10px] px-2 py-1 bg-blue-500/10 text-blue-400 font-bold rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1"><Tag size={10}/> {o.category}</span>}
                        <span className="text-[10px] px-2 py-1 bg-purple-500/10 text-purple-400 font-bold rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1">🏢 {ticket.department}</span>
                      </div>
                    </div>
                    <button onClick={()=>copySolution(ticket.id, rawSol)} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all shadow-sm group/btn">
                      {copiedSolutionId === ticket.id ? <CheckCircle size={18} className="text-emerald-500" /> : <Copy size={18} className="group-hover/btn:scale-110 transition-transform" />}
                    </button>
                  </div>

                  <div className="mb-6 flex-1">
                    <div className="bg-[#181f2b] p-4 rounded-2xl border border-white/5 shadow-inner relative overflow-hidden mb-4 group-hover:border-red-500/20 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><MessageSquare size={60}/></div>
                      <div className="flex items-center gap-2 mb-2 relative z-10 text-red-400">
                        <MessageSquare size={14} /> <span className="text-[11px] font-bold uppercase tracking-widest">Base Anomaly</span>
                      </div>
                      <p className="text-[13px] text-slate-300 relative z-10 leading-relaxed font-medium">{ticket.description}</p>
                    </div>

                    <div className="bg-[#181f2b] p-4 rounded-2xl border border-white/5 shadow-inner relative overflow-hidden group-hover:border-emerald-500/20 transition-colors min-h-[100px] flex flex-col gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-3 relative z-10">
                          <div className="flex items-center gap-2 text-emerald-400">
                             <CheckCircle size={14} /> <span className="text-[11px] font-bold uppercase tracking-widest">Recovery Protocol</span>
                          </div>
                          {rawSol.length > 200 && (
                            <button onClick={()=>toggleExpand(ticket.id)} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest bg-white/5 px-2 py-1 rounded shadow-sm">{isExpanded ? 'COLLAPSE LOG' : 'EXPAND LOG'}</button>
                          )}
                        </div>
                        <p className="text-[13px] text-slate-300 relative z-10 leading-relaxed font-medium whitespace-pre-wrap">{solutionPreview}</p>
                      </div>

                      {/* Knowledge Base Attachments list inside the card */}
                      {(ticket.adminAttachments?.length > 0 || ticket.original?.adminAttachments?.length > 0) && (
                        <div className="border-t border-white/5 pt-3 mt-1 relative z-10">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Solution Attachments</span>
                          <div className="flex flex-col gap-1.5">
                            {(ticket.adminAttachments?.length > 0 ? ticket.adminAttachments : (ticket.original?.adminAttachments || [])).map((file, fileIdx) => (
                              <div key={file._id || fileIdx} className="bg-black/25 border border-white/5 px-3 py-2 rounded-xl flex items-center justify-between shadow-sm">
                                <span className="text-[11px] text-slate-300 truncate max-w-[180px] font-semibold">{file.originalName || file.filename}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span 
                                    onClick={(e) => handleViewAttachment(e, ticket.id, file._id, file.originalName || file.filename)}
                                    className="p-1.5 bg-white/5 hover:bg-white/10 text-emerald-400 hover:text-white rounded-lg transition-colors border border-emerald-500/20 cursor-pointer flex items-center justify-center"
                                    title="View Attachment"
                                  >
                                    <Eye size={12} />
                                  </span>
                                  <span 
                                    onClick={(e) => handleDownloadAttachment(e, ticket.id, file._id, file.originalName || file.filename)}
                                    className="p-1.5 bg-white/5 hover:bg-white/10 text-emerald-400 hover:text-white rounded-lg transition-colors border border-emerald-500/20 cursor-pointer flex items-center justify-center"
                                    title="Download Attachment"
                                  >
                                    <Download size={12} />
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-white/5 mt-auto">
                    <div className="flex items-center gap-4">
                       <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                         <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[9px] text-white">
                           {(o.resolvedBy?.name || o.assignedTo?.name || ticket.assignee || 'O').charAt(0).toUpperCase()}
                         </div>
                         {o.resolvedBy?.name || o.assignedTo?.name || ticket.assignee || 'SysOps Core'}
                       </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded shadow-sm"><Clock size={10}/> {new Date(o.resolvedAt || o.updatedAt || ticket.createdAt).toLocaleDateString()}</span>
                  </div>
               </motion.div>
             );
           })}
        </div>
      )}
    </div>
  );
}
