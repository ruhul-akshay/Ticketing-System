import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import LoginPage from '../../pages/auth/LoginPage';
import Dashboard from '../../pages/user/Dashboard';
import CreateTicket from '../../pages/user/CreateTicket';
import MyTickets from '../../pages/user/MyTickets';
import Reviews from '../../pages/user/Reviews';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import KanbanBoard from '../../pages/admin/KanbanBoard';
import SuperAdminDashboard from '../../pages/superadmin/SuperAdminDashboard';
import SolutionsDirectory from '../../pages/superadmin/SolutionsDirectory';
import SuperAdminTickets from '../../pages/superadmin/SuperAdminTickets';
import CompaniesManagement from '../../pages/superadmin/CompaniesManagement';
import DepartmentsManagement from '../../pages/superadmin/DepartmentsManagement';
import SuperAdminNotifications from '../../pages/superadmin/SuperAdminNotifications';

import UsersManagement from '../../pages/superadmin/UsersManagement';

import AdminsManagement from '../../pages/superadmin/AdminsManagement';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'create-ticket', element: <CreateTicket /> },
      { path: 'my-tickets', element: <MyTickets /> },
      { path: 'reviews', element: <Reviews /> },
      
      { path: 'admin', element: <AdminDashboard /> },
      { path: 'admin/tickets', element: <KanbanBoard /> },
      { path: 'admin/solutions', element: <SolutionsDirectory /> },
      { path: 'super-admin/tickets', element: <SuperAdminTickets /> },
      { path: 'super-admin/solutions', element: <SolutionsDirectory /> },
      { path: 'super-admin/companies', element: <CompaniesManagement /> },
      { path: 'super-admin/users', element: <UsersManagement /> },
      { path: 'super-admin/admins', element: <AdminsManagement /> },
      { path: 'super-admin/departments', element: <DepartmentsManagement /> },
      { path: 'super-admin/notifications', element: <SuperAdminNotifications /> },
    ]
  }
]);
