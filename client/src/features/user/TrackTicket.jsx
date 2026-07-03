import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function TrackTicket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const ticketId = searchParams.get('ticketId');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const role = (user.role || '').toLowerCase();
    
    if (role === 'consultant') {
      navigate(`/consultant/tickets?ticketId=${ticketId}`, { replace: true });
    } else if (role === 'super admin' || role === 'superadmin') {
      navigate(`/super-admin/tickets?ticketId=${ticketId}`, { replace: true });
    } else {
      navigate(`/my-tickets?ticketId=${ticketId}`, { replace: true });
    }
  }, [isAuthenticated, user, ticketId, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-center">
      <div className="space-y-4">
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 animate-spin" />
        </div>
        <p className="text-slate-400 text-sm font-medium tracking-wide">Routing you to your ticket details...</p>
      </div>
    </div>
  );
}
