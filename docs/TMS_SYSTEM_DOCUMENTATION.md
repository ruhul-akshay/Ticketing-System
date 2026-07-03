# Ticketing Management System
## System Documentation — v4.0.0.1

> **Organization**: Akshay Software Technologies Private Limited (ASTPL)
> **Document Status**: Approved | **Effective Date**: July 2026

---

## Table of Contents

| # | Section |
|---|---------|
| 1 | [Introduction & System Overview](#1-introduction--system-overview) |
| 2 | [Project History & Background](#2-project-history--background) |
| 3 | [Project Ownership & Initiation](#3-project-ownership--initiation) |
| 4 | [System Objectives & Vision](#4-system-objectives--vision) |
| 5 | [Key Features & Functional Modules](#5-key-features--functional-modules) |
| 6 | [Technical Architecture & Stack](#6-technical-architecture--stack) |
| 7 | [Development & Implementation Details](#7-development--implementation-details) |
| 8 | [Time & Resource Investment](#8-time--resource-investment) |
| 9 | [System Benefits & Business Impact](#9-system-benefits--business-impact) |
| 10 | [Security, Compliance & Reliability](#10-security-compliance--reliability) |
| 11 | [Plan of Action & Testing Approach](#11-plan-of-action--testing-approach) |
| 12 | [Development History & Version Timeline](#12-development-history--version-timeline) |
| 13 | [Management Review Summary](#13-management-review-summary) |
| 14 | [Next 12-Month Roadmap (Management View)](#14-next-12-month-roadmap-management-view) |
| 15 | [One-Page Executive Summary](#15-one-page-executive-summary) |
| 16 | [Formal Sign-Off & Approval Page](#16-formal-sign-off--approval-page) |
| 17 | [Risk Register & Mitigation Plan](#17-risk-register--mitigation-plan) |
| 18 | [Deployment & Rollback Strategy](#18-deployment--rollback-strategy) |
| 19 | [Appendix — Glossary, Abbreviations & References](#19-appendix--glossary-abbreviations--references) |
| 20 | [File Structure Overview](#20-file-structure-overview) |

---

## 1. Introduction & System Overview

### 1.1 Overview

The **Ticketing Management System (TMS)** is a centralized, role-based digital platform designed to manage, track, and resolve operational, technical, and service-related requests across the organization. The system provides a structured, transparent, and auditable workflow for handling tickets raised by internal users or customers and processed by support and administrative teams.

The platform is designed with **scalability**, **security**, and **operational efficiency** in mind, ensuring it can support both current organizational needs and future enterprise growth.

---

### 1.2 Business Problems Addressed

The system was developed to address several critical business challenges:

| Problem | Impact Before TMS |
|---------|------------------|
| Lack of centralized request and issue tracking | Tickets lost across emails and chat channels |
| Manual or email-based ticket handling | Delays, miscommunication, and missed follow-ups |
| No standardized prioritization or SLA enforcement | Critical issues treated equally to minor requests |
| Limited management visibility into workload and performance | No real-time data for informed decisions |
| Inconsistent accountability and escalation processes | Unclear ownership across departments |
| Difficulty in auditing historical issues and actions | Compliance gaps during reviews |

---

### 1.3 Target Users

The Ticketing Management System is built for:

| User Type | Description |
|-----------|-------------|
| **Client Users** | Raise and track service or operational requests |
| **Consultants** | Manage, resolve, and escalate tickets efficiently |
| **Administrators** | Oversee system usage, user access, and workflows |
| **Super Admins** | Full system governance, configuration, and reporting |
| **Management & Leadership** | Monitor performance, compliance, and operational KPIs |

---

## 2. Project History & Background

### 2.1 Project Initiation

The project was initiated in response to increasing operational complexity and growing service demands within the organization. As business operations expanded, existing manual and semi-digital processes became insufficient to handle the volume and criticality of support requests.

---

### 2.2 Business Challenges

Key challenges that led to project initiation included:

- **Increasing ticket volumes** without proportional support structure
- **Delayed response times** impacting internal productivity and customer satisfaction
- **Lack of real-time visibility** into issue status and assignment accountability
- **Difficulty in enforcing accountability** across departments and consultants

---

### 2.3 Strategic Motivation

The system was conceived as a **strategic enabler** to:

- Standardize issue management processes across the entire organization
- Improve service reliability and reduce average response and resolution times
- Provide management with real-time, actionable operational insights
- Establish a foundation for future automation and AI-driven intelligent support

---

## 3. Project Ownership & Initiation

### 3.1 Ownership

The Ticketing Management System is owned by **Akshay Software Technologies Private Limited** as an internal enterprise platform initiative.

| Role | Name |
|------|------|
| **Project Initiator / Sponsor** | Rajan Chelladurai |
| **Lead Developer** | Ruhul Amin |
| **Testing & Validation** | Rajan Chelladurai, Reshma Lokhande, Ruhul Amin |

> Overall ownership resides with the organization, ensuring long-term continuity, governance, and accountability.

---

### 3.2 Stakeholders

Key stakeholders involved in the project include:

- Senior Management and Leadership
- IT and Engineering Teams
- Support and Operations Teams
- Compliance and Audit Functions

---

### 3.3 Decision-Making & Approvals

Project approvals followed a **structured governance process** involving:

1. Requirement validation by operations and support teams
2. Technical feasibility assessment by IT
3. Budgetary and timeline approvals by management
4. Phased sign-offs during development milestones

---

## 4. System Objectives & Vision

### 4.1 Short-Term Objectives

- Centralize all ticket-related activities across the organization
- Enable role-based access and clear accountability for each ticket
- Improve response and resolution timelines significantly
- Provide basic analytics and reporting dashboards for management oversight

---

### 4.2 Long-Term Vision

- Build a **scalable enterprise-grade service management platform**
- Enable seamless cross-departmental integration workflows
- Introduce automation, AI-based routing, and predictive analytics
- Support **multi-organization / multi-company** operations

---

### 4.3 Alignment with Business Growth

The system architecture and design align with the company's long-term growth strategy by supporting:

- **Modular expansion** — new feature modules without architectural overhaul
- **High availability** — designed for minimal downtime in production
- **Future integrations** — built with APIs connecting to enterprise systems (CRM, ERP, ITSM)

---

## 5. Key Features & Functional Modules

### 5.1 Customer Login & Incident Management

- Customers securely log in to create and manage their **SAP Incidents**
- Incidents can also be raised for **CREST ERP** systems
- Upon successful ticket creation, an **automated email notification** is dispatched to the customer containing the unique Ticket ID
- CC email addresses (Division Heads, managers) are automatically included in relevant notifications

---

### 5.2 Incident Classification

Customers define the nature of the incident at the time of creation:

| Incident Type | Description |
|---------------|-------------|
| **Functional / Transactional** | Business process or transactional flow issues |
| **Technical / Connection** | System connectivity, database, or infrastructure issues |
| **Add-Ons** | Custom development, SAP add-on or third-party integration issues |

This categorization ensures accurate routing, prioritization, SLA tracking, and reporting.

---

### 5.3 Contract Status Validation

- Customers can view whether their support contract is **Active** or **Suspended**
- If the contract is suspended, users receive an **Account Suspension** message during incident creation
- Authorized ASTPL Admin users can **reactivate suspended accounts** from the management console

---

### 5.4 ASTPL Internal — Admin & Consultant Features

| Feature | Description |
|---------|-------------|
| **Consultant Notification** | Assigned consultants receive email alerts when a customer raises a ticket |
| **Division Head CC** | Division Heads are automatically CC'd in all ticket communications |
| **Work Hour Logging** | Consultants log time taken to resolve each ticket |
| **Non-Ticket Time Tracking** | Dedicated options for Add-On development or internal activities |

---

### 5.5 Reporting & Dashboards

#### Customer Dashboards
- Tickets raised to date
- Open (active) tickets
- Closed tickets

#### Super Admin Dashboards

| Dashboard Panel | Drill-Down Capabilities |
|----------------|------------------------|
| **Open Tickets** | Customer-wise open tickets, Consultant-wise open tickets |
| **Closed Tickets** | Customer-wise closed tickets |
| **Overdue Tickets** | Customer-wise, Type-wise, Consultant-wise overdue tickets |

#### Resolution Timeline Analysis
- Consultant-wise and customer-wise time taken to resolve tickets
- Excel export available for all reports with date-range filters
- ERP Incident Type-based categorization breakdowns

---

### 5.6 Pre-Assignment Routing Rules Engine

A dynamic rule-based assignment engine automatically routes tickets to the correct consultant upon creation:

| Routing Criteria | Description |
|-----------------|-------------|
| **Specific Client User** | Match based on the individual who raised the ticket |
| **Specific Client Company** | Route all tickets from a particular company |
| **Specific Department** | Match by department, with optional category sub-matching |
| **ERP Incident Type** | Match against multiple ERP incident types (multiselect) |

- Rules are evaluated sequentially by **Evaluation Order** (lowest number = highest priority)
- The first matching rule assigns the ticket; remaining rules are skipped
- If no rules match, ticket is routed to the Super Admin

---

### 5.7 Theme Customization Engine

- **Theme Modes**: Light, Dark, and System (auto-detects OS preference)
- **Primary Brand Gradient**: Customizable header and primary component colors
- **Accent Color**: Configurable interactive highlights
- Live preview before applying — changes can be discarded without saving
- Preferences persist across sessions via user profile database storage

---

## 6. Technical Architecture & Stack

The Ticketing Management System is designed using a modern, modular, and scalable architecture ensuring performance, security, and ease of maintenance. The architecture follows clear separation of concerns between presentation, application logic, and data layers.

### 6.1 Overall Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│           React.js SPA (Vite, Zustand, CSS)             │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / JSON / JWT
┌────────────────────────▼────────────────────────────────┐
│                  Application Layer                       │
│          Node.js Express REST API Gateway               │
│   Controllers → Services → Middleware → Route Guards    │
└────────────────────────┬────────────────────────────────┘
         ┌───────────────┼───────────────┐
         │               │               │
┌────────▼──────┐ ┌──────▼──────┐ ┌────▼────────────────┐
│   MongoDB DB  │ │ SMTP Mailer │ │   File Upload (Buf) │
│  (Mongoose 8) │ │ (Nodemailer)│ │   Multer Middleware  │
└───────────────┘ └─────────────┘ └─────────────────────┘
```

---

### 6.2 Frontend Architecture & Technologies

| Attribute | Detail |
|-----------|--------|
| **Framework** | React 18 |
| **Build Tool** | Vite 8 |
| **State Management** | Zustand (global stores per domain entity) |
| **Styling** | Vanilla CSS + TailwindCSS utility-first approach |
| **Theme Engine** | CSS Custom Variables injected dynamically at `:root` |
| **Routing** | React Router v6 |
| **HTTP Client** | Axios with interceptors for JWT token attachment |
| **Animations** | Framer Motion for transitions and micro-interactions |
| **Icons** | Lucide React icon library |
| **Architecture Style** | Component-based modular UI |

**Role-Specific Dashboards Rendered:**
- Client User Dashboard (ticket raise, tracking, feedback)
- Consultant Dashboard (queue management, work logs, performance)
- Admin Dashboard (user management, overview reporting)
- Super Admin Console (full system control, routing rules, CC configuration)

---

### 6.3 Backend Architecture & APIs

| Attribute | Detail |
|-----------|--------|
| **Runtime** | Node.js v20+ |
| **Framework** | Express.js 4 |
| **Architecture** | RESTful API with MVC separation |
| **ODM** | Mongoose 8 |
| **Authentication** | JWT (JSON Web Tokens) |
| **File Handling** | Multer (buffer-based, stored in MongoDB as Binary) |
| **Email** | Nodemailer with SMTP transport |
| **Password Hashing** | bcryptjs (work factor: 10) |

**Layered Design:**
```
routes/          → URL definitions and method bindings
controllers/     → Request/response handlers
services/        → Core business logic and database queries
middleware/      → JWT guard, role check, file parser
models/          → Mongoose schemas and virtuals
```

---

### 6.4 Database Design & Data Flow

| Attribute | Detail |
|-----------|--------|
| **Database** | MongoDB 6+ |
| **ODM** | Mongoose 8 |
| **Data Model** | Document-oriented with ObjectId references |

**Key Collections:**

| Collection | Description |
|-----------|-------------|
| `clientusers` | All users (clients, consultants, admins, super admins) |
| `clients` | Client company profiles with ERP details |
| `departments` | Organizational departments with categories |
| `tickets` | Support tickets with full lifecycle data |
| `preassignmentrules` | Routing rule configurations |
| `ccemailconfigs` | CC email recipient mappings |
| `notifications` | In-app notification records |
| `timeentries` | Work hour logs per ticket |

**Data Flow:**
```
1. Frontend (validated request) → 2. JWT Guard → 3. Role Check
→ 4. Controller → 5. Service (business logic) → 6. Mongoose Query
→ 7. MongoDB → 8. Response serialized → 9. Frontend rendered
```

---

### 6.5 Authentication, Authorization & Security

- **JWT-based authentication** — tokens issued on login, validated on every protected request
- **Role-Based Access Control (RBAC)** — `restrictTo(...roles)` middleware guard on every API route
- **Role Hierarchy**: `clientuser` → `consultant` → `admin` → `superadmin`
- **bcryptjs password hashing** — plaintext passwords never stored
- **Input sanitization** — Mongoose ObjectId parsing prevents NoSQL injection
- **Payload size limits** — 20MB maximum request size to prevent DoS

---

### 6.6 Email & Notification Architecture

- **Automatic email triggers** for: ticket creation, assignment, status change, resolution, closure
- **CC Distribution**: Division Heads and configured CC email addresses are automatically included
- **CC Email Config Panel**: Super Admins configure CC recipients and notification event toggles without code changes
- **Nodemailer SMTP transport** — compatible with corporate SMTP gateways
- **In-App Notifications**: Zustand-managed notification store updates on activity feed events

---

### 6.7 Hosting, Deployment & Environment Strategy

| Environment | Purpose |
|------------|---------|
| **Development** | Local developer machines, hot-reload via Vite dev server |
| **Testing / Staging** | Pre-production validation and UAT |
| **Production** | Live system, served via Nginx + PM2 process manager |

- Frontend production build: `npm run build` → `dist/` folder served by Nginx
- Backend managed by **PM2** for process resilience and automatic restarts
- Environment variables managed via `.env` — never committed to version control

---

### 6.8 Logging, Monitoring & Reliability

- **PM2 Logs**: `pm2 logs ticketing-backend` captures runtime exceptions and API activity
- **Assignment History**: Every ticket stores a full `assignmentHistory[]` trail (who, when, remarks)
- **Work Log Audit**: Every time entry is linked to consultant ID and ticket ID
- **MongoDB Audit**: All `createdAt`/`updatedAt` timestamps auto-managed by Mongoose
- **Error responses**: Structured JSON error objects with HTTP status codes

---

## 7. Development & Implementation Details

### 7.1 Development Phases

| Phase | Activities |
|-------|-----------|
| **Requirement Analysis & System Design** | Stakeholder interviews, wireframes, schema design |
| **Core Ticketing Module Development** | Ticket CRUD, status engine, assignment logic |
| **Role-Based Access Control Implementation** | JWT guards, role-specific UI panels |
| **Dashboard, Analytics & UI Enhancements** | Charts, KPIs, date filters, Excel exports |
| **Testing, Optimization & Stabilization** | UAT, bug fixes, performance tuning |

---

### 7.2 Team Structure

| Role | Responsibility |
|------|---------------|
| **Project Manager / Product Owner** | Requirements, stakeholder alignment, milestone sign-offs |
| **Full Stack Developer** | Frontend (React), Backend (Node.js), Database (MongoDB) |
| **QA / Testing Contributors** | Functional testing, UAT, defect reporting |
| **Support & Review Stakeholders** | Review, domain validation, feedback cycles |

---

### 7.3 Challenges & Resolutions

| Challenge | Resolution Applied |
|-----------|-------------------|
| Complex multi-role UI rendering | Zustand stores with role-aware component guards |
| Dynamic theme customization | CSS Custom Variable injection at `:root` level |
| MongoDB aggregation lookup failures | Fixed collection target from `'users'` → `'clientusers'` |
| ERP Incident Type multiselect routing | Converted schema field to `[String]` array with `Array.some()` matching |
| Performance on large ticket datasets | Indexed fields, paginated queries, lazy-loaded components |
| CC email dynamic configuration | CcEmailConfig model with event-toggle flags, no code redeployment required |

---

## 8. Time & Resource Investment

### 8.1 Development Timeline

| Milestone | Date |
|-----------|------|
| **Development Start** | 15th November 2025 |
| **Development End (v4.0.0.1 Live)** | January 2026 → Ongoing |

---

### 8.2 Effort Distribution

| Activity Area | Hours |
|---------------|-------|
| Requirement Analysis & System Design | 15 hours |
| Core Development (Tickets, Auth, Roles) | 55 hours |
| Dashboard, Routing & Advanced Features | 20 hours |
| Testing, Bug Fixes & Validation | 10 hours |
| **Total Project Effort** | **100 hours** |

---

### 8.3 Tools & Technologies

- **Version Control**: Git (branch-based development model)
- **Project Tracking**: Agile-based task management with iterative sprints
- **Code Quality**: Structured review cycles and structured error handling patterns
- **Build System**: Vite 8 (frontend), npm scripts (backend)

---

## 9. System Benefits & Business Impact

### 9.1 Operational Efficiency

| Before TMS | After TMS |
|------------|-----------|
| Email chains for every request | Single-source ticket management portal |
| Manual assignment by coordinators | Automated pre-assignment routing engine |
| No SLA enforcement | SLA timers, overdue tracking, and alerts |
| Disconnected work tracking | Integrated work hour logging per ticket |

---

### 9.2 Transparency & Control

- **Real-time dashboards** for management with drill-down capabilities
- **Clear accountability** — every ticket has a named assignee and assignment history
- **Complete audit trail** — all actions timestamped and attributed to user IDs
- **Historical data** available for audits, billing reviews, and performance assessments

---

### 9.3 Customer & Employee Value

- Improved service experience through transparent ticket status visibility
- **Automated email notifications** reduce need for follow-up calls
- Predictable response timelines improve client trust and satisfaction
- Consultants benefit from structured workloads and measurable performance metrics

---

## 10. Security, Compliance & Reliability

| Domain | Implementation |
|--------|---------------|
| **Authentication** | JWT token-based, bcrypt-hashed passwords |
| **Authorization** | RBAC middleware guards on all protected API routes |
| **Data Access** | Role-scoped queries — users only see their authorized data |
| **Audit Logging** | Assignment history, work logs, timestamps on all records |
| **Backup** | `mongodump`-based automated daily backups |
| **Recovery** | `mongorestore` restoration procedure documented |
| **Monitoring** | PM2 process manager with log capture |
| **SMTP Security** | Corporate SMTP credentials in environment variables only |

---

## 11. Plan of Action & Testing Approach

### Plan of Action — I: Ticket-Based Testing

| Step | Action |
|------|--------|
| 1 | Create a dummy customer account |
| 2 | Raise a ticket for the dummy customer |
| 3 | Provide resolution for the ticket |
| 4 | Enter time taken to provide the resolution |
| **Estimated Testing Time** | **1 hour per cycle** |

---

### Plan of Action — II: Non-Ticket Task Time Tracking

For tasks not directly related to customer tickets, consultants record time against predefined task categories:

| Category | Use Case |
|----------|---------|
| Add-On Development | Custom SAP add-on or CREST development |
| Client Discussions | Meetings, calls, requirements review |
| Internal Discussions | Team coordination, planning |
| Research & Development | Technical investigation, POCs |
| ASTPL Internal Work | Administrative, HR, or organizational tasks |
| General and Other Tasks | Miscellaneous billable or non-billable time |

---

### Testing & Reporting Timeline

| Activity | Schedule |
|----------|---------|
| Daily testing duration | 30 minutes per session |
| Debugging updates | Daily report communicated to development team |
| UAT cycles | Per version release milestone |

---

## 12. Development History & Version Timeline

The Ticketing Management System has progressed through multiple structured versions, each representing measurable functional growth, stability improvements, and enterprise readiness.

### Version History Table

| Version | Phase Description | Start Date | End Date | Effort (Hours) | Key Outcomes |
|---------|------------------|-----------|---------|---------------|-------------|
| **v1.0.0.0** | Initial Foundation | 15 Nov 2025 | 30 Nov 2025 | 25 hrs | Core ticket creation, basic authentication, single-role workflow |
| **v2.0.0.0** | Role-Based Expansion | 01 Dec 2025 | 20 Dec 2025 | 25 hrs | Admin & User dashboards, ticket assignment, status tracking |
| **v3.0.0.0** | Enterprise Readiness | 21 Dec 2025 | 10 Jan 2026 | 30 hrs | Super Admin role, company segregation, audit logs, reporting |
| **v4.0.0.1** | Production Hardening (Live) | 11 Jan 2026 | Ongoing | 20 hrs | Performance optimization, UI/UX enhancements, stability fixes |

| | |
|--|--|
| **Total Development Effort** | 90 Hours |
| **Total Testing Effort** | 10 Hours |
| **Overall Project Effort** | 100 Hours |

---

### Gantt-Style Narrative Timeline

```
Nov 2025         Dec 2025              Jan 2026            Present
|----------------|---------------------|-------------------|-------->
| v1.0.0.0       | v2.0.0.0            | v3.0.0.0          |
| Foundation      | Role Expansion      | Enterprise        |
| [15 - 30 Nov]  | [01 - 20 Dec]       | [21 Dec - 10 Jan] |
|                 |                     |                   | v4.0.0.1
|                 |                     |                   | Production Live
|                 |                     |                   | [11 Jan → Now]
```

**Phase Descriptions:**

| Phase | Period | Focus |
|-------|--------|-------|
| **Phase 1 — Initiation & Foundation** | 15 Nov – 30 Nov 2025 | Requirement gathering, system design, core ticketing workflow, feasibility validation |
| **Phase 2 — Role-Based Expansion** | 01 Dec – 20 Dec 2025 | Structured role separation, dashboard layouts, ticket assignment workflows, unit testing |
| **Phase 3 — Enterprise Enablement** | 21 Dec 2025 – 10 Jan 2026 | Super Admin governance, company segregation, reporting, audit readiness, security validation |
| **Phase 4 — Production Hardening** | 11 Jan 2026 – Present | Performance optimization, UI/UX improvements, ERP routing, CC email engine, date filters, Excel exports |

---

## 13. Management Review Summary

### Delivery Overview

| Item | Detail |
|------|--------|
| **Project Start** | 15th November 2025 |
| **Current Version** | v4.0.0.1 (Live & Operational) |
| **Delivery Model** | Lean full-stack, phased versioned releases |
| **Total Effort** | 100 hours (90 dev + 10 testing) |
| **Team Size** | 1 Lead Developer + 2 QA contributors |

---

### Quality & Governance Assessment

- ✅ Role-based access and audit logging implemented across all system layers
- ✅ Structured testing and daily validation cycles followed throughout development
- ✅ Version-controlled releases (Git) with clear changelog traceability
- ✅ Pre-assignment routing engine tested against all four condition types
- ✅ CC email alert toggles tested end-to-end with SMTP integration

---

### Business Readiness

- ✅ System is **production-ready** and currently live
- ✅ Supports contractual controls, SLA tracking, and time logging per consultant
- ✅ Reporting dashboards provide real-time management visibility
- ✅ Excel export capability available for filtered date range reports

---

### Management Conclusion

> The Ticketing Management System has been delivered within a controlled timeline and effort framework, meeting both operational and governance objectives. The solution is **stable**, **scalable**, and **suitable for continued enterprise use** and future enhancements.

---

## 14. Next 12-Month Roadmap (Management View)

### Quarter 1 (Months 1–3): Stabilization & Reporting Maturity

**Focus**: Strengthening operational stability and management visibility

| Initiative | Business Outcome |
|-----------|-----------------|
| Finalization of Excel export for all ticket and time-based reports | Improved management reporting accuracy |
| Enhanced SLA monitoring and breach alerts | Better SLA compliance tracking |
| Performance tuning for dashboards and report queries | Faster load times on large datasets |
| Minor UI/UX refinements based on user feedback | Reduced operational friction |

---

### Quarter 2 (Months 4–6): Automation & Integration

**Focus**: Reducing manual effort and improving system connectivity

| Initiative | Business Outcome |
|-----------|-----------------|
| Automated ticket assignment based on category and workload | Faster response times |
| Email-to-ticket creation capability | Simplified submission for users |
| Integration with CRM systems for customer reference data | Seamless customer information flow |
| Improved notification and escalation workflows | Reduced missed SLA events |

---

### Quarter 3 (Months 7–9): Scalability & Enterprise Enablement

**Focus**: Preparing the system for larger scale and multi-entity usage

| Initiative | Business Outcome |
|-----------|-----------------|
| Multi-company and multi-tenant support | Readiness for organizational expansion |
| Advanced role and permission configuration | Granular access governance |
| Data archiving and performance optimization | Long-term system scalability |
| Enhanced audit and compliance reporting | Improved compliance posture |

---

### Quarter 4 (Months 10–12): Intelligence & Strategic Enhancements

**Focus**: Introducing intelligence-driven features and strategic value

| Initiative | Business Outcome |
|-----------|-----------------|
| AI-assisted ticket categorization and prioritization | Proactive issue management |
| Predictive analytics for SLA breaches | Pre-emptive escalation |
| Consultant utilization and productivity analytics | Data-driven workforce planning |
| Management-level trend and performance dashboards | Strategic decision support |

---

### Roadmap Governance

- Roadmap execution follows **phased approvals** at each quarter boundary
- Prioritization reviewed **quarterly** by management stakeholders
- Scope adjustments aligned with business priorities and resource availability

---

## 15. One-Page Executive Summary

### Overview

The **Ticketing Management System (TMS)** is an enterprise-grade internal platform developed and owned by **Akshay Software Technologies Private Limited** to standardize, control, and optimize the handling of customer and internal service requests.

Initiated on **15th November 2025**, the system evolved through **four structured versions** and is currently live as **v4.0.0.1**. It addresses critical operational challenges such as fragmented issue tracking, lack of SLA visibility, and limited management oversight.

---

### Business Value Delivered

| Area | Value |
|------|-------|
| **Incident Management** | Centralized SAP and CREST ERP incident tracking |
| **Governance** | Role-based access ensuring accountability at every level |
| **SLA Tracking** | Time-based effort logging with overdue detection |
| **Reporting** | Real-time dashboards and filterable management reports |
| **Communication** | Automated email notifications with CC distribution engine |

---

### Delivery Snapshot

| Metric | Value |
|--------|-------|
| Total Development Effort | 90 hours |
| Total Testing Effort | 10 hours |
| Overall Project Effort | 100 hours |
| Delivery Model | Lean full-stack, phased versioned releases |
| Current Status | **Live & Operational** |

---

### Strategic Outlook

With a defined **12-month roadmap** covering automation, CRM integration, multi-tenancy, and AI-driven enhancements, the Ticketing Management System is positioned as a **long-term strategic platform** supporting operational excellence and enterprise growth.

---

## 16. Formal Sign-Off & Approval Page

This section confirms formal acknowledgment, review, and approval of the Ticketing Management System for production use and ongoing enhancement.

### Ownership & Accountability

| Role | Name |
|------|------|
| **System Owner** | Akshay Software Technologies Private Limited |
| **Project Initiator / Sponsor** | Rajan Chelladurai |
| **Lead Developer** | Ruhul Amin |
| **Testing & Validation** | Rajan Chelladurai, Reshma Lokhande, Ruhul Amin |

---

### Approval Statement

> *This document and the Ticketing Management System described herein have been reviewed and approved for operational use. The system meets defined business, technical, and governance requirements and is considered fit for production deployment and enterprise use.*

---

### Sign-Off Table

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Sponsor | | | |
| IT / Engineering Head | | | |
| Operations Head | | | |
| Quality / Compliance | | | |

---

### Document Control

| Field | Value |
|-------|-------|
| **Document Name** | Ticketing Management System — System Documentation |
| **Current Version** | v4.0.0.1 |
| **Status** | Approved |
| **Effective Date** | __________ |
| **Next Review Date** | __________ |

---

## 17. Risk Register & Mitigation Plan

| # | Risk Category | Risk Description | Impact | Likelihood | Mitigation Strategy |
|---|--------------|-----------------|--------|-----------|---------------------|
| 1 | **Technical** | System performance degradation under high load | High | Medium | Performance tuning, paginated queries, MongoDB indexing, scalable architecture |
| 2 | **Security** | Unauthorized access or data leakage | High | Low | RBAC enforcement, JWT validation, bcrypt hashing, audit logs |
| 3 | **Operational** | Incorrect ticket handling or SLA breach | Medium | Medium | SLA breach alerts, escalation workflows, user training programs |
| 4 | **Data** | Data loss or corruption | High | Low | Daily `mongodump` backups, tested restoration procedures |
| 5 | **Dependency** | Key resource unavailability (developer) | Medium | Medium | Full codebase documentation, Git version control, knowledge transfer |
| 6 | **Integration** | SMTP failure blocking email notifications | Medium | Low | Retry queues, fallback notification logging, monitoring alerts |
| 7 | **Compliance** | Audit requirements not met | Medium | Low | Complete assignment history, work logs, timestamps on all records |

> Risk reviews will be conducted **periodically** as part of system governance. The Risk Register will be updated at each quarterly roadmap review.

---

## 18. Deployment & Rollback Strategy

### Deployment Strategy

The Ticketing Management System follows a **controlled deployment approach** to minimize operational risk:

| Step | Activity |
|------|---------|
| 1 | Environment segregation: Development → Testing → Production |
| 2 | Versioned releases with approval checkpoints before promotion |
| 3 | Pre-deployment validation and sanity testing against staging |
| 4 | Deployment scheduled during **low-impact business windows** |
| 5 | Post-deployment health check (API smoke tests, dashboard validation) |

---

### Production Deployment Checklist

```
[ ] All environment variables (.env) updated and verified
[ ] MongoDB backup completed before deployment
[ ] Frontend production build generated: npm run build
[ ] PM2 process restarted: pm2 restart ticketing-backend
[ ] Nginx configuration tested: nginx -t
[ ] Nginx reloaded: systemctl reload nginx
[ ] Smoke test: Login, ticket create, assignment, email notification
[ ] Dashboard KPIs validated with live data
[ ] Stakeholder notification sent
```

---

### Rollback Strategy

In case of deployment issues, a **defined rollback mechanism** is in place:

| Step | Action |
|------|--------|
| 1 | Immediate rollback to last stable production version via Git tag |
| 2 | Database backup restoration if schema migrations were applied |
| 3 | PM2 restart with previous application build |
| 4 | Validation of system stability post-rollback |
| 5 | Root cause analysis (RCA) documented before re-deployment attempt |

> **Target Recovery Time Objective (RTO)**: < 30 minutes for rollback to previous stable version.

---

## 19. Appendix — Glossary, Abbreviations & References

### Glossary

| Term | Definition |
|------|-----------|
| **TMS** | Ticketing Management System — the platform documented herein |
| **SLA** | Service Level Agreement — defined timeframe for ticket resolution |
| **RBAC** | Role-Based Access Control — permission model where access depends on user role |
| **ERP** | Enterprise Resource Planning — integrated business management software (e.g., SAP B1, CREST) |
| **JWT** | JSON Web Token — compact, URL-safe token used for authentication |
| **ODM** | Object Document Mapper — library linking application code to a document database (Mongoose) |
| **CC** | Carbon Copy — additional email recipients copied on notifications |
| **AMC** | Annual Maintenance Contract — recurring support agreement with a client |
| **UAT** | User Acceptance Testing — validation phase by end-users before go-live |
| **RTO** | Recovery Time Objective — target maximum system restoration time after failure |

---

### Abbreviations

| Abbreviation | Full Form |
|-------------|-----------|
| **ASTPL** | Akshay Software Technologies Private Limited |
| **SAP** | Systems, Applications, and Products in Data Processing |
| **B1** | SAP Business One — ERP platform for SMEs |
| **HANA** | High-Performance Analytic Appliance — SAP's in-memory database platform |
| **CREST** | Internal ERP platform supported by ASTPL |
| **FP** | Feature Pack — SAP B1 version patch designation |
| **PM2** | Process Manager 2 — Node.js production process manager |
| **CI/CD** | Continuous Integration / Continuous Deployment |

---

### References

| Reference | Description |
|-----------|-------------|
| Internal IT Governance Guidelines | ASTPL internal policies governing system deployments |
| Support Process and SLA Policy | Defined SLA targets and escalation procedures |
| Secure Application Development Practices | ASTPL coding standards and security requirements |
| MongoDB Documentation | https://www.mongodb.com/docs/ |
| Node.js Documentation | https://nodejs.org/en/docs/ |
| React Documentation | https://react.dev/ |

---

## 20. File Structure Overview

The Ticketing Management System follows a modular and scalable architecture to ensure maintainability and future extensibility.

```
Ticketing System version 5.0.0.0/
├── client/                             # React Frontend
│   ├── public/                         # Static public assets
│   ├── src/
│   │   ├── assets/                     # Logos, images, static files
│   │   ├── components/                 # Reusable UI component library
│   │   │   ├── ui/                     # Core UI blocks (inputs, buttons, modals)
│   │   │   └── layout/                 # Navbar, Sidebar, Footer, MainLayout
│   │   ├── features/                   # Role-specific feature panels
│   │   │   ├── user/                   # Client user flows (dashboard, create ticket)
│   │   │   ├── consultant/             # Consultant workstation and dashboard
│   │   │   └── superadmin/             # Admin console, routing rules, user management
│   │   ├── store/                      # Zustand state containers (per domain)
│   │   │   ├── useAuthStore.js         # Authentication session state
│   │   │   ├── useTicketStore.js       # Ticket CRUD and lifecycle state
│   │   │   ├── useThemeStore.js        # Theme customization engine
│   │   │   ├── usePreAssignmentRuleStore.js
│   │   │   ├── useClientStore.js
│   │   │   ├── useDepartmentStore.js
│   │   │   └── useConsultantStore.js
│   │   ├── App.jsx                     # App root, router, theme provider
│   │   ├── index.css                   # Global CSS variable system + overrides
│   │   └── main.jsx                    # React DOM mount point
│   ├── vite.config.js                  # Vite build configuration
│   └── package.json
│
├── server/                             # Node.js Express Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                   # MongoDB connection handler
│   │   ├── controllers/                # Express route handlers
│   │   │   ├── ticket.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── preAssignmentRule.controller.js
│   │   │   ├── consultantStats.controller.js
│   │   │   └── ccEmail.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js      # JWT protect + restrictTo guards
│   │   │   └── upload.middleware.js    # Multer file parser configuration
│   │   ├── models/
│   │   │   ├── ClientUser.js           # All user types (clients, consultants, admins)
│   │   │   ├── Client.js               # Client company + ERP details
│   │   │   ├── Ticket.js               # Ticket lifecycle schema
│   │   │   ├── Department.js           # Departments with categories
│   │   │   ├── PreAssignmentRule.js    # Routing rule configurations
│   │   │   ├── CcEmailConfig.js        # CC email mapping configurations
│   │   │   ├── Notification.js         # In-app notification records
│   │   │   ├── TimeEntry.js            # Consultant work hour logs
│   │   │   └── ConsultantProfile.js    # Extended consultant details
│   │   ├── routes/                     # Express route definitions
│   │   │   ├── ticket.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── preAssignmentRule.routes.js
│   │   │   └── ccEmail.routes.js
│   │   ├── services/                   # Business logic services
│   │   │   ├── ticket.service.js       # Ticket creation + routing evaluation
│   │   │   ├── consultantStats.service.js
│   │   │   ├── dashboard.service.js
│   │   │   └── email.service.js
│   │   └── app.js                      # Express app initialization
│   ├── .env.example                    # Environment variable template
│   └── package.json
│
└── docs/                               # System Documentation
    ├── README.md                       # Documentation index and overview
    ├── TMS_SYSTEM_DOCUMENTATION.md     # This document
    ├── USER_GUIDE_CLIENT.md            # Client user guide
    ├── USER_GUIDE_CONSULTANT.md        # Consultant user guide
    ├── USER_GUIDE_SUPERADMIN.md        # Super Admin guide
    └── TECHNICAL.md                    # Technical architecture reference
```

---

### Architecture Summary

| Layer | Technology | Role |
|-------|-----------|------|
| Presentation | React 18 + Vite | Role-specific UI panels and dashboards |
| State | Zustand stores | Domain-isolated client-side state |
| Styling | Vanilla CSS + Tailwind + CSS Variables | Theming engine with dark/light/system |
| API Gateway | Express.js | RESTful API routing and middleware |
| Business Logic | Service layer (Node.js) | Ticket routing, email dispatch, SLA tracking |
| Database | MongoDB + Mongoose | Document storage with ObjectId referencing |
| Auth | JWT + bcryptjs | Secure token-based role enforcement |
| Mail | Nodemailer | SMTP-based notification delivery |
| Process | PM2 | Production process management |
| Web Server | Nginx | Static file serving + API reverse proxy |

---

## Conclusion & Management Summary

The **Ticketing Management System** is a robust, scalable, and enterprise-ready platform that significantly improves operational efficiency, transparency, and service quality across **Akshay Software Technologies Private Limited**.

The system delivers measurable value across three dimensions:

- **Operational**: Centralized, automated, and auditable ticket management replacing fragmented manual processes
- **Governance**: Complete role-based access, audit trails, and SLA compliance tracking
- **Strategic**: A scalable foundation ready for AI-driven enhancements, multi-tenancy, and enterprise integrations

The system is **ready for enterprise-scale deployment and continuous enhancement**, delivering long-term value to management, operations teams, consultants, and client companies.

---

*End of Document*

---
> **Document Version**: v4.0.0.1 | **Organization**: Akshay Software Technologies Private Limited | **Prepared by**: Ruhul Amin | **Reviewed by**: Rajan Chelladurai, Reshma Lokhande
