import React, { useState } from 'react';
import { Search, Filter, Calendar, Download, RefreshCw, X } from 'lucide-react';

export default function TicketFilterBar({
  searchQuery = '',
  onSearchChange,
  filters = {},
  onFilterChange,
  sortBy = 'newest',
  onSortChange,
  dateFrom = '',
  onDateFromChange,
  dateTo = '',
  onDateToChange,
  dateSpecific = '',
  onDateSpecificChange,
  clients = [],
  departments = [],
  consultants = [],
  showClientFilter = true,
  showDepartmentFilter = false,
  showConsultantFilter = false,
  onExportCSV,
  isExporting = false,
  onRefresh,
  isRefreshing = false
}) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const hasActiveFilters =
    searchQuery ||
    (filters.status && filters.status !== 'all') ||
    (filters.priority && filters.priority !== 'all') ||
    (filters.client && filters.client !== 'all') ||
    (filters.department && filters.department !== 'all') ||
    (filters.consultant && filters.consultant !== 'all') ||
    dateFrom ||
    dateTo ||
    dateSpecific;

  const handleResetFilters = () => {
    onSearchChange?.('');
    onFilterChange?.({
      status: 'all',
      priority: 'all',
      client: 'all',
      department: 'all',
      consultant: 'all'
    });
    onDateFromChange?.('');
    onDateToChange?.('');
    onDateSpecificChange?.('');
  };

  return (
    <div className="bg-white/60 dark:bg-[#111620]/80 backdrop-blur-xl p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 dark:border-white/5 space-y-4 shadow-sm">
      {/* Top Main Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by ticket #, subject, client or reporter..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Quick Filter Buttons & Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Status Select */}
          <select
            value={filters.status || 'all'}
            onChange={(e) => onFilterChange?.({ ...filters, status: e.target.value })}
            className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-3 text-xs font-bold focus:outline-none focus:border-blue-500/50 cursor-pointer shadow-inner"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="on hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
            <option value="resolved">Resolved</option>
          </select>

          {/* Priority Select */}
          <select
            value={filters.priority || 'all'}
            onChange={(e) => onFilterChange?.({ ...filters, priority: e.target.value })}
            className="bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-3 text-xs font-bold focus:outline-none focus:border-blue-500/50 cursor-pointer shadow-inner"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Toggle Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-3.5 py-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              showAdvancedFilters || hasActiveFilters
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10'
            }`}
          >
            <Filter size={14} />
            <span className="hidden sm:inline">Filters</span>
          </button>

          {/* Export CSV Button */}
          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              disabled={isExporting}
              className="px-3.5 py-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              title="Export CSV"
            >
              <Download size={14} />
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              title="Refresh"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-500' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Collapse Row */}
      {showAdvancedFilters && (
        <div className="pt-4 border-t border-slate-200 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Client Filter */}
          {showClientFilter && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Client
              </label>
              <select
                value={filters.client || 'all'}
                onChange={(e) => onFilterChange?.({ ...filters, client: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="all">All Clients</option>
                {clients.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Department Filter */}
          {showDepartmentFilter && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Department
              </label>
              <select
                value={filters.department || 'all'}
                onChange={(e) => onFilterChange?.({ ...filters, department: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d._id || d.id} value={d.name || d._id || d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Consultant Filter */}
          {showConsultantFilter && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Assignee
              </label>
              <select
                value={filters.consultant || 'all'}
                onChange={(e) => onFilterChange?.({ ...filters, consultant: e.target.value })}
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-blue-500/50 cursor-pointer"
              >
                <option value="all">All Consultants</option>
                <option value="unassigned">Unassigned</option>
                {consultants.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date From */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange?.(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Date To */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange?.(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Specific Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Specific Date
            </label>
            <input
              type="date"
              value={dateSpecific}
              onChange={(e) => onDateSpecificChange?.(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Sort By */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange?.(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <X size={14} /> Clear Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
