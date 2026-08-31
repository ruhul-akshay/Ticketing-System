import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Layers, Ticket, Clock, XCircle, CheckCircle } from 'lucide-react';
import api from '../../api/mockAxios';
import { useTicketStore } from '../../store/useTicketStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useClientStore } from '../../store/useClientStore';
import { useDepartmentStore } from '../../store/useDepartmentStore';
import { useConsultantStore } from '../../store/useConsultantStore';

// Shared UI components
import StatCard from '../../components/ui/StatCard';
import TicketFilterBar from '../../components/ui/TicketFilterBar';
import TicketTable from '../../components/ui/TicketTable';
import Pagination from '../../components/ui/Pagination';
import PageHeader from '../../components/ui/PageHeader';
import ForwardTicketModal from '../../components/ui/ForwardTicketModal';
import CreateTicketConsultantModal from '../../components/ui/CreateTicketConsultantModal';
import TicketViewerModal from '../../components/ui/TicketViewerModal';
import { getTicketEffectiveDate } from '../../utils/ticketHelpers';

export default function SuperAdminTickets() {
  const { tickets, fetchTickets, forwardTicket, isLoading: ticketsLoading } = useTicketStore();
  const { user } = useAuthStore();
  const { clients, fetchClients } = useClientStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  const { consultants, fetchConsultants } = useConsultantStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const initStatus = searchParams.get('status') || 'all';
  const ticketIdFromUrl = searchParams.get('ticketId');

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    client: 'all',
    department: 'all',
    status: initStatus,
    priority: 'all',
    consultant: 'all'
  });
  const [sortBy, setSortBy] = useState('newest');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateSpecific, setDateSpecific] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [forwardingTicket, setForwardingTicket] = useState(null);
  const [isForwarding, setIsForwarding] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCloseModal = () => {
    setSelectedTicket(null);
    if (ticketIdFromUrl) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('ticketId');
      setSearchParams(newParams, { replace: true });
    }
  };

  // Initial Load
  useEffect(() => {
    fetchTickets();
    fetchClients();
    fetchDepartments();
    fetchConsultants().catch((err) => console.error('Error fetching consultants:', err));
  }, [fetchTickets, fetchClients, fetchDepartments, fetchConsultants]);

  // Handle URL deep link to ticket
  useEffect(() => {
    if (ticketIdFromUrl && tickets.length > 0 && !selectedTicket) {
      const target = String(ticketIdFromUrl).trim().toLowerCase();
      const found = tickets.find((t) => {
        const tid = String(t.id || t._id || t.original?._id || '').toLowerCase();
        const tnum = String(t.ticketNumber || '').toLowerCase();
        return tid === target || tnum === target;
      });
      if (found) {
        setSelectedTicket(found);
      }
    }
  }, [ticketIdFromUrl, tickets, selectedTicket]);

  // Derived Stats
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) =>
      ['open', 'pending'].includes(t.status?.toLowerCase())
    ).length;
    const onHold = tickets.filter((t) =>
      ['on hold', 'hold'].includes(t.status?.toLowerCase())
    ).length;
    const cancelled = tickets.filter((t) => t.status?.toLowerCase() === 'cancelled').length;
    const resolved = tickets.filter((t) =>
      ['resolved', 'closed'].includes(t.status?.toLowerCase())
    ).length;
    return { total, open, onHold, cancelled, resolved };
  }, [tickets]);

  // Filter Logic
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const o = t.original || {};
      const ticketDate = t.createdAt ? new Date(t.createdAt) : null;

      const matchesSearch =
        !searchQuery ||
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.clientName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClient = filters.client === 'all' || t.clientId === filters.client;
      const matchesStatus =
        filters.status === 'all' || t.status?.toLowerCase() === filters.status.toLowerCase();
      const matchesPriority =
        filters.priority === 'all' || t.priority?.toLowerCase() === filters.priority.toLowerCase();
      const matchesConsultant =
        filters.consultant === 'all' ||
        (filters.consultant === 'unassigned' && !o.assignedTo) ||
        o.assignedTo?._id === filters.consultant ||
        o.assignedTo?.id === filters.consultant;

      let matchesDate = true;
      if (dateSpecific) {
        const specific = new Date(dateSpecific);
        matchesDate =
          ticketDate &&
          ticketDate.getFullYear() === specific.getFullYear() &&
          ticketDate.getMonth() === specific.getMonth() &&
          ticketDate.getDate() === specific.getDate();
      } else {
        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && ticketDate && ticketDate >= from;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && ticketDate && ticketDate <= to;
        }
      }

      return (
        matchesSearch &&
        matchesClient &&
        matchesStatus &&
        matchesPriority &&
        matchesConsultant &&
        matchesDate
      );
    });
  }, [tickets, searchQuery, filters, dateFrom, dateTo, dateSpecific]);

  // Sort Logic - Prioritizes latest assignment / forward date
  const sortedTickets = useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      const dateA = getTicketEffectiveDate(a);
      const dateB = getTicketEffectiveDate(b);
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [filteredTickets, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedTickets.length / ticketsPerPage) || 1;
  const currentTickets = sortedTickets.slice(
    (currentPage - 1) * ticketsPerPage,
    currentPage * ticketsPerPage
  );

  // CSV Export Handler (Exports active filtered tickets)
  const handleDownloadCSV = () => {
    setDownloading(true);
    try {
      const ticketsToExport = sortedTickets;
      let csvContent = '\uFEFF'; // Excel UTF-8 BOM

      const escapeCSV = (str) => {
        if (str === null || str === undefined) return '';
        const stringified = String(str);
        if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n') || stringified.includes('\r')) {
          return `"${stringified.replace(/"/g, '""')}"`;
        }
        return stringified;
      };

      const headers = [
        'Ticket Number',
        'Title',
        'Description',
        'Client',
        'Department',
        'Category',
        'Status',
        'Priority',
        'Reporter',
        'Assigned To',
        'Created Date',
        'Work Logs (Hours)'
      ];

      csvContent += headers.map(escapeCSV).join(',') + '\r\n';

      ticketsToExport.forEach(t => {
        const orig = t.original || t;
        const totalLogsHours = (orig.workLogs || t.workLogs || []).reduce((sum, log) => sum + (Number(log.hours) || 0), 0);
        const row = [
          t.ticketNumber || orig.ticketNumber || '',
          t.title || '',
          t.description || orig.description || '',
          t.clientName || orig.createdBy?.clientName || orig.createdBy?.client?.name || '',
          typeof t.department === 'string' ? t.department : (t.department?.name || orig.department?.name || ''),
          t.category || orig.category || '',
          t.status || '',
          t.priority || '',
          t.user || orig.createdBy?.name || '',
          t.assignee || orig.assignedTo?.name || '',
          t.createdAt ? new Date(t.createdAt).toLocaleString() : '',
          totalLogsHours > 0 ? totalLogsHours.toFixed(1) : '0'
        ];
        csvContent += row.map(escapeCSV).join(',') + '\r\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `filtered_tickets_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading tickets CSV:', error);
      alert('Failed to download tickets CSV: ' + error.message);
    } finally {
      setDownloading(false);
    }
  };

  // Forward ticket handler
  const handleForwardSubmit = async (ticketId, adminId, remarks, ccConsultantIds) => {
    setIsForwarding(true);
    try {
      await forwardTicket(ticketId, adminId, remarks, ccConsultantIds);
      setForwardingTicket(null);
      alert('Ticket forwarded successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to forward ticket.');
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 font-sans pb-12">
      {/* Header */}
      <PageHeader
        title="Ticket Management"
        subtitle="Complete centralized directory of all support tickets across the organization."
        icon={Layers}
        onRefresh={fetchTickets}
        isRefreshing={ticketsLoading}
        actions={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={16} /> Create Ticket
          </button>
        }
      />

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Open Tickets"
          value={stats.open}
          icon={<Ticket size={20} />}
          color="blue"
          delay={0.05}
          isActive={filters.status === 'open'}
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              status: prev.status === 'open' ? 'all' : 'open'
            }))
          }
        />
        <StatCard
          title="On Hold"
          value={stats.onHold}
          icon={<Clock size={20} />}
          color="yellow"
          delay={0.1}
          isActive={filters.status === 'on hold'}
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              status: prev.status === 'on hold' ? 'all' : 'on hold'
            }))
          }
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          icon={<XCircle size={20} />}
          color="gray"
          delay={0.15}
          isActive={filters.status === 'cancelled'}
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              status: prev.status === 'cancelled' ? 'all' : 'cancelled'
            }))
          }
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={<CheckCircle size={20} />}
          color="emerald"
          delay={0.2}
          isActive={filters.status === 'resolved'}
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              status: prev.status === 'resolved' ? 'all' : 'resolved'
            }))
          }
        />
        <StatCard
          title="Total Tickets"
          value={stats.total}
          icon={<Layers size={20} />}
          color="purple"
          delay={0.25}
          isActive={filters.status === 'all'}
          onClick={() => setFilters((prev) => ({ ...prev, status: 'all' }))}
        />
      </div>

      {/* Filter Bar */}
      <TicketFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFilterChange={setFilters}
        sortBy={sortBy}
        onSortChange={setSortBy}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        dateSpecific={dateSpecific}
        onDateSpecificChange={setDateSpecific}
        clients={clients}
        departments={departments}
        consultants={consultants}
        showClientFilter={true}
        showDepartmentFilter={true}
        showConsultantFilter={true}
        onExportCSV={handleDownloadCSV}
        isExporting={downloading}
      />

      {/* Ticket List Table */}
      <div className="space-y-4">
        <TicketTable
          tickets={currentTickets}
          currentUser={user}
          isLoading={ticketsLoading}
          onSelectTicket={setSelectedTicket}
          onForwardTicket={setForwardingTicket}
          canForward={true}
          showAssignee={true}
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedTickets.length}
          itemsPerPage={ticketsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Ticket Details Modal Viewer */}
      {selectedTicket && (
        <TicketViewerModal
          isOpen={!!selectedTicket}
          ticket={selectedTicket}
          onClose={handleCloseModal}
          onUpdate={fetchTickets}
        />
      )}

      {/* Forward Ticket Modal */}
      {forwardingTicket && (
        <ForwardTicketModal
          isOpen={!!forwardingTicket}
          ticket={forwardingTicket}
          onClose={() => setForwardingTicket(null)}
          onForward={handleForwardSubmit}
          isSubmitting={isForwarding}
        />
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketConsultantModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
