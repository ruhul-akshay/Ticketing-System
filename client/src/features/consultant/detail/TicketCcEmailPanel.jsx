import React, { useState, useEffect } from 'react';
import { Mail, AlertTriangle, PlusCircle, X, CheckCircle2, Loader2, Users } from 'lucide-react';
import api from '../../../api/mockAxios';
import { useTicketStore, mapTicketFromApi } from '../../../store/useTicketStore';

/**
 * TicketCcEmailPanel
 *
 * Shown to consultants on a client-raised ticket.
 * - Displays all existing CC recipients on the ticket.
 * - Warns if none of the CC emails share the client's email domain
 *   (meaning the client hasn't looped in any company colleagues).
 * - Lets the consultant add extra CC emails and persist them.
 */
export default function TicketCcEmailPanel({ ticket, rawTicketId }) {
  if (!ticket) return null;

  const existingCcEmails = ticket.original?.ccEmails || ticket.ccEmails || [];
  const creatorEmail = ticket.original?.createdBy?.email || '';
  const clientDomain = creatorEmail.includes('@') ? creatorEmail.split('@')[1] : '';

  // Check if any CC email belongs to the same company domain as the reporter
  const clientCcs = clientDomain
    ? existingCcEmails.filter((e) => e.toLowerCase().endsWith('@' + clientDomain.toLowerCase()))
    : [];
  const missingClientCc = clientDomain && clientCcs.length === 0 && existingCcEmails.length === 0;
  const noClientCcInList = clientDomain && clientCcs.length === 0 && existingCcEmails.length > 0;

  // New emails the consultant is adding
  const [newEmails, setNewEmails] = useState(['']);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Auto-expand when there is a warning
  useEffect(() => {
    if (missingClientCc || noClientCcInList) setExpanded(true);
  }, [missingClientCc, noClientCcInList]);

  const handleAddRow = () => setNewEmails((prev) => [...prev, '']);
  const handleRemoveRow = (i) =>
    setNewEmails((prev) => (prev.length === 1 ? [''] : prev.filter((_, idx) => idx !== i)));
  const handleChange = (i, val) =>
    setNewEmails((prev) => prev.map((e, idx) => (idx === i ? val : e)));

  const handleSave = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toAdd = newEmails.map((e) => e.trim()).filter(Boolean);
    const invalid = toAdd.filter((e) => !emailRegex.test(e));
    if (invalid.length) {
      setSaveError(`Invalid email(s): ${invalid.join(', ')}`);
      return;
    }
    if (!toAdd.length) {
      setSaveError('Please enter at least one email address.');
      return;
    }

    // Merge with existing, deduplicate
    const merged = Array.from(new Set([...existingCcEmails, ...toAdd]));
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const response = await api.put(`/tickets/${rawTicketId}`, { ccEmails: merged });
      const rawUpdated = response.data?.ticket || response.data;
      if (rawUpdated) {
        const mapped = mapTicketFromApi(rawUpdated);
        useTicketStore.setState((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === (mapped.id || mapped._id) ? mapped : t
          )
        }));
      }
      setNewEmails(['']);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || 'Failed to save CC emails.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      {/* Section Header — clickable to toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2.5 mb-3 w-full text-left group cursor-pointer"
      >
        <div className="flex items-center gap-2 flex-1">
          <Mail
            size={16}
            className={`${
              missingClientCc || noClientCcInList
                ? 'text-amber-500'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          />
          <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            CC Recipients
          </h3>
          {(missingClientCc || noClientCcInList) && (
            <span className="ml-1 inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
              <AlertTriangle size={10} />
              Action Suggested
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
          {expanded ? 'Hide ▲' : 'Show ▼'}
        </span>
      </button>

      {expanded && (
        <div className="bg-slate-100/70 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-inner">
          {/* Warning Banner */}
          {(missingClientCc || noClientCcInList) && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200/60 dark:border-amber-500/20">
              <AlertTriangle
                size={15}
                className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
              />
              <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold leading-relaxed">
                {missingClientCc
                  ? `No CC recipients were added when this ticket was raised. It looks like the client hasn't looped in any seniors or concerned persons from ${clientDomain ? `@${clientDomain}` : 'their company'}. Consider adding the relevant contact(s) below so they stay informed.`
                  : `None of the current CC recipients are from the client's domain (@${clientDomain}). The client may not have included their seniors or managers. You can add relevant contacts below.`}
              </p>
            </div>
          )}

          <div className="p-4 space-y-4">
            {/* Existing CC List */}
            {existingCcEmails.length > 0 ? (
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Users size={11} /> Current CC List
                </p>
                <div className="flex flex-wrap gap-2">
                  {existingCcEmails.map((email) => {
                    const isClient =
                      clientDomain &&
                      email.toLowerCase().endsWith('@' + clientDomain.toLowerCase());
                    return (
                      <span
                        key={email}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                          isClient
                            ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20'
                            : 'bg-slate-200/70 dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-300/40 dark:border-white/5'
                        }`}
                        title={isClient ? 'From client company' : 'External'}
                      >
                        <Mail size={11} />
                        {email}
                        {isClient && (
                          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-200/50 dark:bg-emerald-500/20 px-1 rounded">
                            Client
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                No CC recipients on this ticket yet.
              </p>
            )}

            {/* Divider */}
            <div className="border-t border-slate-200 dark:border-white/5" />

            {/* Add New CC Emails */}
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <PlusCircle size={11} /> Add CC Recipients
              </p>
              <div className="space-y-2">
                {newEmails.map((email, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleChange(i, e.target.value)}
                      placeholder="colleague@company.com"
                      className="flex-1 text-xs bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/40 transition-all"
                    />
                    {newEmails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(i)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all cursor-pointer"
                        title="Remove"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <PlusCircle size={13} /> Add another
                </button>

                <div className="flex items-center gap-2">
                  {saveError && (
                    <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 max-w-[220px] truncate" title={saveError}>
                      {saveError}
                    </p>
                  )}
                  {saveSuccess && (
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Saved!
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 text-[11px] font-black bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-slate-400 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={12} className="animate-spin" /> Saving…
                      </>
                    ) : (
                      <>
                        <Mail size={12} /> Save CC
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
