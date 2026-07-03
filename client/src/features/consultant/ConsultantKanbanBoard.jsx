import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTicketStore } from '../../store/useTicketStore';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, AlertCircle, Plus, Paperclip, ClipboardList, RefreshCw } from 'lucide-react';
import ConsultantTicketDetailPanel from './ConsultantTicketDetailPanel';
import CreateTicketConsultantModal from '../../components/ui/CreateTicketConsultantModal';

const columnsMap = {
  column1: { title: 'Open', id: 'column1', status: 'Open' },
  column2: { title: 'On Hold', id: 'column2', status: 'On Hold' },
  column3: { title: 'Cancelled', id: 'column3', status: 'Cancelled' },
  column4: { title: 'Resolved', id: 'column4', status: 'Resolved' }
};

const getColumnColor = (status) => {
  switch (status) {
    case 'Open': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
    case 'On Hold': return 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]';
    case 'Cancelled': return 'bg-slate-500 shadow-[0_0_15px_rgba(148,163,184,0.5)]';
    case 'Resolved': return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]';
    default: return 'bg-gray-500 shadow-[0_0_15px_rgba(156,163,175,0.5)]';
  }
};

export default function ConsultantKanbanBoard() {
  const { tickets, updateTicketStatus, fetchTickets, isLoading } = useTicketStore();
  const [columns, setColumns] = useState(columnsMap);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchParams] = useSearchParams();
  const ticketIdFromUrl = searchParams.get('ticketId');

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (ticketIdFromUrl && tickets.length > 0) {
      const foundTicket = tickets.find(t => t.id === ticketIdFromUrl || t.ticketNumber === ticketIdFromUrl);
      if (foundTicket) {
        setSelectedTicket(foundTicket);
      }
    }
  }, [ticketIdFromUrl, tickets]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': case 'Critical': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'Low': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getTicketsByStatus = (status) => tickets.filter(t => t.status === status);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = columns[destination.droppableId].status;
    updateTicketStatus(draggableId, newStatus);
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 px-1 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
             <ClipboardList className="text-blue-500 hidden sm:block" size={32} />
             <ClipboardList className="text-blue-500 sm:hidden" size={24} />
             Assigned Tickets
          </h1>
          <p className="text-slate-400 mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium">Manage your operational workflow and ticket resolutions.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
        >
          <Plus size={16} strokeWidth={3} /> Formulate Ticket
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar -mx-2 sm:mx-0 px-2 sm:px-0">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full items-start min-w-[900px]">
            {Object.keys(columns).map(columnId => {
              const column = columns[columnId];
              const columnTickets = getTicketsByStatus(column.status);

              return (
                <div key={columnId} className="flex flex-col flex-1 bg-[#111620]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-[1.5rem] h-[calc(100%-20px)] relative overflow-hidden">
                  <div className={`h-1.5 w-full ${getColumnColor(column.status)}`}></div>
                  <div className="p-4 flex items-center justify-between border-b border-white/5 bg-[#181f2b]/50 backdrop-blur-sm sticky top-0 z-10">
                    <h3 className="font-bold text-white tracking-wide">{column.title}</h3>
                    <span className="bg-white/10 text-[11px] font-bold px-2.5 py-1 rounded-md text-white/70">
                      {columnTickets.length}
                    </span>
                  </div>

                  <div className="flex-1 p-3 overflow-y-auto min-h-[150px]">
                    <Droppable droppableId={columnId}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-full transition-colors rounded-xl p-1 ${snapshot.isDraggingOver ? 'bg-white/5' : ''}`}
                        >
                          {columnTickets.map((ticket, index) => (
                            <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => setSelectedTicket(ticket)}
                                  className={`p-4 mb-4 rounded-xl border cursor-pointer hover:border-blue-500/50 transition-all ${
                                    snapshot.isDragging 
                                      ? 'bg-[#1d2633] border-blue-500 shadow-[0_20px_40px_rgba(0,0,0,0.6)] rotate-3 scale-105 z-50' 
                                      : 'bg-[#181f2b] border-white/5 hover:bg-[#1d2633] shadow-lg'
                                  }`}
                                  style={{...provided.draggableProps.style}}
                                >
                                  <div className="flex justify-between items-start mb-2 text-xs">
                                    <span className="font-medium text-muted-foreground">{ticket.ticketNumber || ticket.id}</span>
                                    <span className={`px-2 py-0.5 rounded-full border ${getPriorityColor(ticket.priority)}`}>
                                      {ticket.priority}
                                    </span>
                                  </div>
                                  <h4 className="text-white font-medium mb-2 leading-tight">{ticket.title}</h4>
                                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><Clock size={12}/> {new Date(ticket.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    <div className="flex gap-3">
                                      {((ticket.attachments?.length || 0) + (ticket.adminAttachments?.length || 0) + (ticket.supportingDocuments?.length || 0)) > 0 && (
                                        <span className="flex items-center gap-1 text-blue-400">
                                          <Paperclip size={12}/> {(ticket.attachments?.length || 0) + (ticket.adminAttachments?.length || 0) + (ticket.supportingDocuments?.length || 0)}
                                        </span>
                                      )}
                                      {(ticket.original?.remarks?.length > 0) && (
                                        <span className="flex items-center gap-1.5 text-blue-400">
                                          <MessageSquare size={12}/> {ticket.original.remarks.length}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      <AnimatePresence>
        {selectedTicket && (
          <ConsultantTicketDetailPanel 
            ticket={selectedTicket} 
            onClose={() => setSelectedTicket(null)} 
            onUpdateStatus={(id, status, reply, solution, workLogs, adminFiles, remarkFiles) => {
              updateTicketStatus(id, status, reply, solution, workLogs, adminFiles, remarkFiles);
              setSelectedTicket(null);
            }}
          />
        )}
      </AnimatePresence>

      <CreateTicketConsultantModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
