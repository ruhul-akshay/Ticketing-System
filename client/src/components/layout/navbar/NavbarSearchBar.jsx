import React, { useState } from 'react';
import { Search, X, Ticket } from 'lucide-react';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../../utils/ticketHelpers';

export default function NavbarSearchBar({
  tickets = [],
  onSelectTicket
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return (Array.isArray(tickets) ? tickets : [])
      .filter(
        (t) =>
          t.ticketNumber?.toLowerCase().includes(query) ||
          t.title?.toLowerCase().includes(query) ||
          t.user?.toLowerCase().includes(query) ||
          t.clientName?.toLowerCase().includes(query)
      )
      .slice(0, 6);
  }, [searchQuery, tickets]);

  const handleSelect = (ticket) => {
    onSelectTicket?.(ticket);
    setSearchQuery('');
    setIsFocused(false);
  };

  return (
    <div className="relative flex-1 max-w-xs sm:max-w-md">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search tickets, clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-8 py-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 focus:bg-white dark:focus:bg-black/40 transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Search Dropdown Results */}
      {isFocused && searchQuery.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#111620] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2.5 max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-white/5">
            {searchResults.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400 font-medium">
                No matching tickets found
              </p>
            ) : (
              searchResults.map((t) => (
                <div
                  key={t.id || t._id}
                  onMouseDown={() => handleSelect(t)}
                  className="p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Ticket size={14} className="text-blue-500 shrink-0" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        #{t.ticketNumber || String(t.id).slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${getPriorityBadgeClass(
                          t.priority
                        )}`}
                      >
                        {t.priority}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${getStatusBadgeClass(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    {t.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {t.clientName || 'Internal'} • {t.user || 'Unknown User'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
