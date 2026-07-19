import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../features/auth/LoginPage';
import CompleteProfile from '../features/auth/CompleteProfile';
import Dashboard from '../features/user/Dashboard';
import CreateTicket from '../features/user/CreateTicket';
import MyTickets from '../features/user/MyTickets';
import MyTeam from '../features/user/MyTeam';
import Reviews from '../features/user/Reviews';
import TrackTicket from '../features/user/TrackTicket';
import ConsultantDashboard from '../features/consultant/ConsultantDashboard';
import ConsultantKanbanBoard from '../features/consultant/ConsultantKanbanBoard';
import SuperAdminDashboard from '../features/superadmin/SuperAdminDashboard';
import SolutionsDirectory from '../features/superadmin/SolutionsDirectory';
import SuperAdminTickets from '../features/superadmin/SuperAdminTickets';
import ClientsManagement from '../features/superadmin/ClientsManagement';
import DepartmentsManagement from '../features/superadmin/DepartmentsManagement';
import SuperAdminNotifications from '../features/superadmin/SuperAdminNotifications';
import ClientUsersManagement from '../features/superadmin/ClientUsersManagement';
import ConsultantsManagement from '../features/superadmin/ConsultantsManagement';
import PreAssignmentRules from '../features/superadmin/PreAssignmentRules';
import SuperAdminSettings from '../features/superadmin/SuperAdminSettings';
import HolidayMaster from '../features/superadmin/HolidayMaster';
import PricingSetup from '../features/superadmin/PricingSetup';
import SystemReports from '../features/superadmin/SystemReports';
import AttendanceDashboard from '../features/user/AttendanceDashboard';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/complete-profile',
    element: <CompleteProfile />
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'create-ticket', element: <CreateTicket /> },
      { path: 'my-tickets', element: <MyTickets /> },
      { path: 'my-team', element: <MyTeam /> },
      { path: 'reviews', element: <Reviews /> },
      { path: 'track-ticket', element: <TrackTicket /> },
      
      { path: 'consultant', element: <ConsultantDashboard /> },
      { path: 'consultant/tickets', element: <ConsultantKanbanBoard /> },
      { path: 'consultant/solutions', element: <SolutionsDirectory /> },
      { path: 'super-admin/tickets', element: <SuperAdminTickets /> },
      { path: 'super-admin/solutions', element: <SolutionsDirectory /> },
      { path: 'super-admin/clients', element: <ClientsManagement /> },
      { path: 'super-admin/client-users', element: <ClientUsersManagement /> },
      { path: 'super-admin/consultants', element: <ConsultantsManagement /> },
      { path: 'super-admin/departments', element: <DepartmentsManagement /> },
      { path: 'super-admin/notifications', element: <SuperAdminNotifications /> },
      { path: 'super-admin/pre-assignment-rules', element: <PreAssignmentRules /> },
      { path: 'super-admin/settings', element: <SuperAdminSettings /> },
      { path: 'super-admin/holidays', element: <HolidayMaster /> },
      { path: 'super-admin/pricing', element: <PricingSetup /> },
      { path: 'super-admin/reports', element: <SystemReports /> },
      { path: 'attendance', element: <AttendanceDashboard /> },
    ]
  }
]);
