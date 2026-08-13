import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';

// ── Auth pages are loaded eagerly (users always land here first) ──────────────
import LoginPage from '../features/auth/LoginPage';
import CompleteProfile from '../features/auth/CompleteProfile';

// ── All feature pages are lazy-loaded (only fetched when navigated to) ────────
// This splits the bundle into per-page chunks, reducing initial load by ~60%.
const Dashboard            = lazy(() => import('../features/user/Dashboard'));
const CreateTicket         = lazy(() => import('../features/user/CreateTicket'));
const MyTickets            = lazy(() => import('../features/user/MyTickets'));
const MyTeam               = lazy(() => import('../features/user/MyTeam'));
const Reviews              = lazy(() => import('../features/user/Reviews'));
const TrackTicket          = lazy(() => import('../features/user/TrackTicket'));
const AttendanceDashboard  = lazy(() => import('../features/user/AttendanceDashboard'));

const ConsultantDashboard       = lazy(() => import('../features/consultant/ConsultantDashboard'));
const ConsultantKanbanBoard     = lazy(() => import('../features/consultant/ConsultantKanbanBoard'));
const CreateInternalTicket      = lazy(() => import('../features/consultant/CreateInternalTicket'));

const SuperAdminDashboard     = lazy(() => import('../features/superadmin/SuperAdminDashboard'));
const SolutionsDirectory      = lazy(() => import('../features/superadmin/SolutionsDirectory'));
const SuperAdminTickets       = lazy(() => import('../features/superadmin/SuperAdminTickets'));
const ClientsManagement       = lazy(() => import('../features/superadmin/ClientsManagement'));
const DepartmentsManagement   = lazy(() => import('../features/superadmin/DepartmentsManagement'));
const SuperAdminNotifications = lazy(() => import('../features/superadmin/SuperAdminNotifications'));
const ClientUsersManagement   = lazy(() => import('../features/superadmin/ClientUsersManagement'));
const ConsultantsManagement   = lazy(() => import('../features/superadmin/ConsultantsManagement'));
const PreAssignmentRules      = lazy(() => import('../features/superadmin/PreAssignmentRules'));
const SuperAdminSettings      = lazy(() => import('../features/superadmin/SuperAdminSettings'));
const HolidayMaster           = lazy(() => import('../features/superadmin/HolidayMaster'));
const PricingSetup            = lazy(() => import('../features/superadmin/PricingSetup'));
const SystemReports           = lazy(() => import('../features/superadmin/SystemReports'));

// ── Inline page-level Suspense fallback ───────────────────────────────────────
// MainLayout wraps <Outlet> with <Suspense> using this same spinner so the
// lazy chunks display a skeleton while loading.
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest animate-pulse">
        Loading…
      </span>
    </div>
  </div>
);

// Re-export so MainLayout can use the same fallback without a circular import
export { PageLoader };

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
      // ── Client User routes ────────────────────────────────────────────────
      { index: true, element: <Suspense fallback={<PageLoader />}><Dashboard /></Suspense> },
      { path: 'create-ticket',          element: <Suspense fallback={<PageLoader />}><CreateTicket /></Suspense> },
      { path: 'create-internal-ticket', element: <Suspense fallback={<PageLoader />}><CreateInternalTicket /></Suspense> },
      { path: 'my-tickets',             element: <Suspense fallback={<PageLoader />}><MyTickets /></Suspense> },
      { path: 'my-team',                element: <Suspense fallback={<PageLoader />}><MyTeam /></Suspense> },
      { path: 'reviews',                element: <Suspense fallback={<PageLoader />}><Reviews /></Suspense> },
      { path: 'track-ticket',           element: <Suspense fallback={<PageLoader />}><TrackTicket /></Suspense> },
      { path: 'attendance',             element: <Suspense fallback={<PageLoader />}><AttendanceDashboard /></Suspense> },

      // ── Consultant routes ─────────────────────────────────────────────────
      { path: 'consultant',         element: <Suspense fallback={<PageLoader />}><ConsultantDashboard /></Suspense> },
      { path: 'consultant/tickets', element: <Suspense fallback={<PageLoader />}><ConsultantKanbanBoard /></Suspense> },
      { path: 'consultant/solutions', element: <Suspense fallback={<PageLoader />}><SolutionsDirectory /></Suspense> },

      // ── Super Admin routes ────────────────────────────────────────────────
      { path: 'super-admin/tickets',             element: <Suspense fallback={<PageLoader />}><SuperAdminTickets /></Suspense> },
      { path: 'super-admin/solutions',           element: <Suspense fallback={<PageLoader />}><SolutionsDirectory /></Suspense> },
      { path: 'super-admin/clients',             element: <Suspense fallback={<PageLoader />}><ClientsManagement /></Suspense> },
      { path: 'super-admin/client-users',        element: <Suspense fallback={<PageLoader />}><ClientUsersManagement /></Suspense> },
      { path: 'super-admin/consultants',         element: <Suspense fallback={<PageLoader />}><ConsultantsManagement /></Suspense> },
      { path: 'super-admin/departments',         element: <Suspense fallback={<PageLoader />}><DepartmentsManagement /></Suspense> },
      { path: 'super-admin/notifications',       element: <Suspense fallback={<PageLoader />}><SuperAdminNotifications /></Suspense> },
      { path: 'super-admin/pre-assignment-rules',element: <Suspense fallback={<PageLoader />}><PreAssignmentRules /></Suspense> },
      { path: 'super-admin/settings',            element: <Suspense fallback={<PageLoader />}><SuperAdminSettings /></Suspense> },
      { path: 'super-admin/holidays',            element: <Suspense fallback={<PageLoader />}><HolidayMaster /></Suspense> },
      { path: 'super-admin/pricing',             element: <Suspense fallback={<PageLoader />}><PricingSetup /></Suspense> },
      { path: 'super-admin/reports',             element: <Suspense fallback={<PageLoader />}><SystemReports /></Suspense> },
    ]
  }
]);

