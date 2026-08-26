import React from 'react';
import { Shield, ChevronRight } from 'lucide-react';

export default function TicketForwardingSection({
  canForward,
  ticket,
  admins = [],
  adminsLoading = false,
  currentUser,
  selectedAdminId,
  setSelectedAdminId,
  forwardCcConsultantIds = [],
  setForwardCcConsultantIds,
  forwardCcEmails,
  setForwardCcEmails,
  forwardRemarks,
  setForwardRemarks,
  forwardCcDropdownOpen,
  setForwardCcDropdownOpen,
  isForwarding,
  onForwardSubmit
}) {
  if (!canForward || ticket?.status === 'Resolved') return null;

  const currentUserId = currentUser?._id || currentUser?.id;
  const currentAssignedId =
    ticket?.assignedTo?._id ||
    ticket?.assignedTo?.id ||
    ticket?.original?.assignedTo?._id ||
    ticket?.original?.assignedTo?.id;

  const activeAdmins = admins.filter((a) => a.status === 'active');

  return (
    <section className="space-y-4 bg-white dark:bg-[#1e293b]/40 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-blue-500/25 dark:border-blue-500/20 shadow-sm">
      <div className="flex items-center gap-3">
        <Shield size={18} className="text-blue-500 dark:text-blue-400" />
        <h3 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          Forwarding Console
        </h3>
      </div>

      <div className="space-y-4">
        {/* Select Consultant */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Select Consultant to Forward To
          </label>
          <select
            value={selectedAdminId}
            onChange={(e) => setSelectedAdminId(e.target.value)}
            disabled={adminsLoading && admins.length === 0}
            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-blue-500/50 shadow-inner cursor-pointer disabled:opacity-60"
          >
            <option value="">
              {adminsLoading && admins.length === 0
                ? 'Loading consultants...'
                : '-- Choose Consultant --'}
            </option>
            {activeAdmins
              .filter((a) => String(a._id || a.id) !== String(currentUserId))
              .map((consultant) => (
                <option
                  key={consultant._id || consultant.id}
                  value={consultant._id || consultant.id}
                  className="bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white"
                >
                  {consultant.name} ({consultant.email})
                </option>
              ))}
          </select>
        </div>

        {/* CC Consultants Dropdown */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            CC Consultants (Optional)
          </label>
          <div
            onClick={() => setForwardCcDropdownOpen(!forwardCcDropdownOpen)}
            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl px-4 py-3 text-xs font-bold flex justify-between items-center cursor-pointer select-none"
          >
            <span>
              {forwardCcConsultantIds.length === 0
                ? '-- Choose CCs --'
                : `${forwardCcConsultantIds.length} Selected`}
            </span>
            <ChevronRight
              size={14}
              className={`text-slate-400 transition-transform ${
                forwardCcDropdownOpen ? 'rotate-90' : ''
              }`}
            />
          </div>

          {forwardCcDropdownOpen && (
            <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-white/10 rounded-xl max-h-[140px] overflow-y-auto p-2.5 z-20 space-y-1.5 shadow-xl custom-scrollbar">
              {activeAdmins
                .filter(
                  (a) =>
                    String(a._id || a.id) !== String(currentAssignedId) &&
                    String(a._id || a.id) !== String(selectedAdminId)
                )
                .map((c) => {
                  const isChecked = forwardCcConsultantIds.includes(c._id || c.id);
                  return (
                    <label
                      key={c._id || c.id}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer select-none text-[11px]"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setForwardCcConsultantIds((prev) =>
                            prev.includes(c._id || c.id)
                              ? prev.filter((id) => id !== (c._id || c.id))
                              : [...prev, c._id || c.id]
                          );
                        }}
                        className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="truncate text-slate-700 dark:text-slate-200">{c.name}</span>
                    </label>
                  );
                })}
            </div>
          )}
        </div>

        {/* Additional CC Emails */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Additional CC Email Addresses (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. boss@company.com, tech@company.com"
            value={forwardCcEmails}
            onChange={(e) => setForwardCcEmails(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-blue-500/50 shadow-inner placeholder:text-slate-400"
          />
          <span className="text-[9px] text-slate-500 font-medium ml-1">
            Separate multiple email addresses with commas.
          </span>
        </div>

        {/* Remarks */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
            Forwarding Remarks
          </label>
          <textarea
            placeholder="Reason for forwarding or instructions..."
            value={forwardRemarks}
            onChange={(e) => setForwardRemarks(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-blue-500/50 min-h-[60px] resize-none"
          />
        </div>

        {/* Submit Forward Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForwardSubmit}
            disabled={isForwarding || !selectedAdminId}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isForwarding ? 'Forwarding...' : 'Forward Ticket'}
          </button>
        </div>
      </div>
    </section>
  );
}
