# Client User Guide
### Ticketing Management System — Akshay Software Technologies Pvt. Ltd.

> **Audience**: Client Users (End Users raising support requests)
> **Document Version**: v4.0.0.1 | **Last Updated**: July 2026

---

## Table of Contents

| # | Section |
|---|---------|
| 1 | [Getting Started — First-Time Login](#1-getting-started--first-time-login) |
| 2 | [Logging In & Logging Out](#2-logging-in--logging-out) |
| 3 | [Dashboard Overview](#3-dashboard-overview) |
| 4 | [Creating a Support Ticket](#4-creating-a-support-ticket) |
| 5 | [My Tickets — Viewing & Filtering](#5-my-tickets--viewing--filtering) |
| 6 | [Ticket Detail View & Communication](#6-ticket-detail-view--communication) |
| 7 | [Ticket Statuses Explained](#7-ticket-statuses-explained) |
| 8 | [Submitting Feedback & Closing Tickets](#8-submitting-feedback--closing-tickets) |
| 9 | [Profile & Theme Settings](#9-profile--theme-settings) |
| 10 | [Email Notifications](#10-email-notifications) |
| 11 | [Security — Changing Your Password](#11-security--changing-your-password) |
| 12 | [Frequently Asked Questions (FAQs)](#12-frequently-asked-questions-faqs) |
| 13 | [Troubleshooting](#13-troubleshooting) |

---

## 1. Getting Started — First-Time Login

When your account is created by the Super Admin, you will receive a **welcome email** from the system containing:
- Your registered **email address**
- A **temporary password**
- The **portal URL** to log in

### Step-by-Step: First Login

**Step 1** — Navigate to the portal URL in your web browser (Chrome, Edge, or Firefox recommended).

**Step 2** — You will see the Login page. Enter your **email address** and the **temporary password** from the welcome email.

![Login Page](C:/Users/Ruhul%20Amin/.gemini/antigravity/brain/fda18881-dbb2-4302-b363-200d11bb56f3/screenshot_login_1783088324696.png)
*Figure 1 — Login Page*

**Step 3** — Click the **Login** button.

**Step 4** — Because this is your first login, the system will immediately prompt you to **change your password**. This is a mandatory security requirement.

![Change Password](C:/Users/Ruhul%20Amin/.gemini/antigravity/brain/fda18881-dbb2-4302-b363-200d11bb56f3/screenshot_password_change_1783088441717.png)
*Figure 2 — Mandatory Password Change on First Login*

**Step 5** — Enter a strong new password:
- Minimum 8 characters
- At least one uppercase letter
- At least one number or special character

**Step 6** — Confirm the new password and click **Update Password**. You will be automatically redirected to your **Client Dashboard**.

> ⚠️ **Important**: Do not share your password with anyone. The system administrators will never ask for your password via email or phone.

---

## 2. Logging In & Logging Out

### Regular Login

1. Open the portal URL in your browser.
2. Enter your registered **email address** and **password**.
3. Click **Login**.
4. Your dashboard loads automatically with your saved theme and preferences.

### Forgot Password

If you forget your password:
1. On the Login page, click **Forgot Password?**
2. Enter your registered email address.
3. A password reset link will be emailed to you within a few minutes.
4. Open the email and click the reset link (valid for 24 hours).
5. Set a new password and log in.

> ✉️ If you do not receive the reset email, check your **Spam / Junk** folder.

### Logging Out

To securely log out:
1. Click your **profile avatar** (top-right corner of the navbar).
2. Select **Logout** from the dropdown menu.
3. You will be returned to the login screen immediately.

> 🔒 Always log out when using shared or public computers.

---

## 3. Dashboard Overview

After logging in, you land on the **Client Dashboard** — your central control panel for all support activity.

![Client Dashboard](C:/Users/Ruhul%20Amin/.gemini/antigravity/brain/fda18881-dbb2-4302-b363-200d11bb56f3/screenshot_dashboard_1783088334001.png)
*Figure 3 — Client Dashboard Overview*

### Dashboard Sections

#### 3.1 Navigation Sidebar
The left sidebar provides access to all key areas:

| Menu Item | Description |
|-----------|-------------|
| **Dashboard** | Your main overview and KPI summary |
| **Create Ticket** | Open a new support request |
| **My Tickets** | View all your submitted tickets |
| **Profile** | Manage your account settings |

#### 3.2 KPI Metric Cards

At the top of the dashboard, four cards give you an instant summary:

| Card | What It Shows |
|------|--------------|
| 🔵 **Total Raised** | Total number of tickets you have submitted since account creation |
| 🟡 **Pending** | Tickets awaiting initial assignment by a consultant or auto-routing |
| 🟢 **Active** | Tickets currently being worked on (`Assigned` or `On Hold`) |
| ⚪ **Closed** | Tickets that have been fully resolved and closed |

#### 3.3 Notice Board

The **Notice Board** panel (right side or top of dashboard) displays:
- System-wide **announcements** from the Super Admin
- **Maintenance windows** or scheduled downtime notices
- **Policy updates** relevant to all client users

> 📌 Always check the Notice Board for important messages before raising a ticket — the issue may already be acknowledged.

#### 3.4 Recent Tickets Feed

Below the KPI cards, the **Recent Tickets** table shows your latest 10 tickets with:
- Ticket ID (e.g., `#TKT-2025-042`)
- Title and description summary
- Department and category
- Priority badge (Critical / High / Medium / Low)
- Status badge (current stage of the ticket)
- Assigned consultant name
- Submission date

Click any row to open the **Ticket Detail View** for that ticket.

---

## 4. Creating a Support Ticket

This is the core action in the system. Follow the steps below carefully to ensure your issue is routed to the right consultant quickly.

### Step-by-Step: Raising a New Ticket

**Step 1** — Click **Create Ticket** in the left sidebar, or click the **+ New Ticket** button on the dashboard.

**Step 2** — The ticket creation form opens:

![Create Ticket Form](C:/Users/Ruhul%20Amin/.gemini/antigravity/brain/fda18881-dbb2-4302-b363-200d11bb56f3/screenshot_create_ticket_1783088361646.png)
*Figure 4 — Create New Ticket Form*

**Step 3** — Fill in all required fields as described below:

---

### Field Reference Guide

#### 📝 Ticket Title *(Required)*
A short, clear summary of the issue.

| ✅ Good Example | ❌ Poor Example |
|----------------|----------------|
| `SAP B1 – Invoice Printing Not Working After FP Update` | `Problem with SAP` |
| `CREST – Sales Report Export Fails for Date Range > 30 Days` | `Help needed` |
| `User Cannot Log In to SAP After Password Reset` | `Urgent issue!!` |

> **Tip**: A specific title helps the system route your ticket to the correct consultant faster.

---

#### 🏢 Department *(Required)*
Select the department that best matches your issue:

| Department Option | Use When |
|------------------|---------|
| SAP Functional Support | Issues with SAP B1 business processes (Finance, Inventory, Sales, Purchase, Production) |
| SAP Technical Support | Database issues, connectivity errors, performance, user permissions |
| CREST Support | Any issue related to the CREST ERP platform |
| Add-On Development | Requests for custom features, reports, or SAP add-ons |
| General Support | Issues that don't fit the above categories |

---

#### 📂 Category *(Optional but Recommended)*
After selecting a Department, the Category dropdown populates with sub-categories specific to that department. For example:

- **SAP Functional Support** → Finance, Inventory, Sales & Distribution, Production, HR
- **SAP Technical Support** → Database, Connectivity, Performance, Security
- **Add-On Development** → New Development, Enhancement, Bug Fix

Selecting the correct category helps your ticket be resolved faster.

---

#### ⚙️ ERP Incident Type *(Conditional — shown only if configured for your company)*
If your company uses SAP Business One or CREST ERP, you will see this field. Select the type that best describes your incident:

| Type | When to Use |
|------|------------|
| **Functional / Transactional** | Business process errors — e.g., posting errors, incorrect calculations, workflow issues |
| **Technical / Connection** | Server connectivity, login errors, database performance, integration failures |
| **Add-Ons** | Issues related to custom SAP add-ons, third-party integrations, or custom reports |

> 💡 If this field does not appear, your company profile has not been configured for ERP incident tracking. Contact your Super Admin.

---

#### 🚨 Priority *(Required)*
Set the urgency of your issue:

| Priority | When to Use | Expected Response |
|----------|------------|------------------|
| 🔴 **Critical** | System completely down, business operations halted | Immediate |
| 🟠 **High** | Major functionality broken, significant business impact | Same day |
| 🔵 **Medium** | Partial functionality issues, workarounds available | Next business day |
| ⚪ **Low** | Minor issues, cosmetic problems, non-urgent queries | Within 3 days |

> ⚠️ Please use **Critical** only when the system is genuinely non-functional and business is stopped. Misuse of priority levels may delay genuinely urgent issues for other users.

---

#### 📧 CC Manager Email *(Optional)*
If you want a colleague or manager to receive email notifications for this specific ticket:
- Enter their full email address in this field (e.g., `manager@company.com`)
- They will receive copies of all status update emails for this ticket
- You can add only one CC email per ticket

---

#### 📄 Description *(Required)*
This is the most important field. Provide as much detail as possible:

**Include:**
- What exactly you were doing when the problem occurred
- Exact error message text (copy-paste from the screen)
- Steps to reproduce the issue
- Which users or records are affected
- When the problem first started
- Any recent changes or updates that may have triggered it

**Example of a Good Description:**
```
Issue started on 2nd July 2026 after the monthly SAP FP update was applied.

When attempting to print a Sales Invoice (document number SL-20260702-001),
the system shows error: "Crystal Reports runtime not found."

This happens for ALL users on the Finance team. Printing works normally for
Purchase Orders. We have tried restarting SAP B1 client — issue persists.

Affected Users: All Finance department users (approx. 6 users)
SAP Version: 10.0 FP 2308
Database: SQL Server 2019
```

---

#### 📎 Attachments *(Optional but Highly Recommended)*
Attach screenshots, error logs, or supporting documents:
- Drag and drop files into the attachment zone, or click to browse
- Supported formats: PNG, JPG, PDF, XLSX, DOCX, TXT, LOG
- Maximum file size: **10 MB per file**
- You can attach multiple files

---

**Step 4** — Review all fields and click **Confirm Submission** (or **Submit Ticket**).

**Step 5** — You will see a **success confirmation** with your new Ticket ID (e.g., `#TKT-2025-043`).

**Step 6** — You will receive an **automatic email** confirming your ticket has been received, including the Ticket ID for your reference.

> 📬 The assigned consultant will also receive an email notification immediately. Division Heads are automatically CC'd.

---

## 5. My Tickets — Viewing & Filtering

To see all your submitted tickets, click **My Tickets** in the left sidebar.

![My Tickets List](C:/Users/Ruhul%20Amin/.gemini/antigravity/brain/fda18881-dbb2-4302-b363-200d11bb56f3/screenshot_my_tickets_1783088372218.png)
*Figure 5 — My Tickets List View*

### Filtering Your Tickets

Use the filter toolbar at the top of the list to narrow down results:

| Filter | Options |
|--------|---------|
| **Search** | Type any keyword to search by title, ticket number, or description |
| **Status** | All / Pending / Assigned / Hold / Resolved / Closed |
| **Priority** | All / Critical / High / Medium / Low |
| **Date Range** | Select a custom start and end date |

### Understanding the Ticket List Columns

| Column | Description |
|--------|-------------|
| **Ticket #** | Unique ticket identifier (e.g., `#TKT-2025-042`) |
| **Title** | Brief description of the issue |
| **Department** | Department the ticket is assigned to |
| **Priority** | Urgency level with color-coded badge |
| **Status** | Current stage of the ticket |
| **Assigned To** | Name of the consultant handling your ticket |
| **Created** | Date and time the ticket was submitted |
| **Action** | Click to open full ticket details |

### Sorting

Click any **column header** to sort the list by that column. Click again to reverse the sort order.

---

## 6. Ticket Detail View & Communication

Click on any ticket row to open the full **Ticket Detail View**.

![Ticket Detail View](C:/Users/Ruhul%20Amin/.gemini/antigravity/brain/fda18881-dbb2-4302-b363-200d11bb56f3/screenshot_ticket_detail_1783088398542.png)
*Figure 6 — Ticket Detail View & Communication Panel*

### What You Can See in the Detail View

#### Left Panel — Main Ticket Content
- **Ticket Title** and **Ticket Number** prominently displayed at the top
- **Status Badge** — current stage (color-coded)
- **Priority Badge** — urgency level
- **Metadata Grid**:
  - Department & Category
  - ERP Incident Type (if applicable)
  - Created By (your name)
  - Assigned To (consultant name and avatar)
  - Created Date and Last Updated

#### Right Panel — Ticket Information Sidebar
- **Ticket Summary Card** with key details
- **Attachments** — all files you uploaded, downloadable by clicking
- **Assignment History** — log of who the ticket was assigned to and when

#### Activity & Remarks Timeline
The remarks section shows a **chronological conversation log** between you and the consultant:
- Each entry shows: sender name, avatar, date/time, and message
- Your messages appear on the right; consultant messages on the left

### Communicating on a Ticket

If a consultant needs more information from you, or you have an update to share:

1. Scroll to the **Add a Remark** section at the bottom of the ticket.
2. Type your message in the text area.
3. *(Optional)* Click the **Attach File** button to upload additional files (logs, screenshots, error reports).
4. Click **Submit Remark**.
5. The consultant receives an **immediate email notification** of your reply.

> 💬 **Best Practice**: Respond to consultant queries as quickly as possible. Delays in your reply may cause the ticket to be placed in `Hold` status, pausing the SLA timer.

---

## 7. Ticket Statuses Explained

Every ticket moves through defined stages. Understanding these helps you know what action (if any) is required from you.

| Status | Badge Color | Meaning | Action Required From You |
|--------|------------|---------|--------------------------|
| **Pending** | 🟡 Amber | Ticket received, awaiting consultant assignment | None — system is processing |
| **Assigned** | 🔵 Blue | A consultant has been assigned and is working on your ticket | None — wait for updates |
| **Hold** | 🟠 Orange | Ticket paused — consultant is waiting for information, a patch, or client action | Check remarks — you may need to provide more details |
| **On Hold** | 🟠 Orange | Ticket paused by admin for external reasons | None — wait for system notification |
| **Resolved** | 🟢 Green | Consultant has submitted a solution | **Review resolution and submit feedback to close ticket** |
| **Closed** | ⚫ Gray | Ticket fully completed and rated | No further action needed |
| **Cancelled** | ❌ Red | Ticket was cancelled (by admin or duplicate found) | None — refer to remarks for reason |

> 🔔 You will receive an **email notification** every time your ticket status changes.

---

## 8. Submitting Feedback & Closing Tickets

When a consultant marks your ticket as **Resolved**, the system notifies you via email and updates the ticket status. The ticket is not fully **Closed** until you review the solution and submit feedback.

### Step-by-Step: Submitting Feedback

**Step 1** — Open the resolved ticket from **My Tickets** (it will show a green `Resolved` badge).

**Step 2** — Scroll down to view the **Resolution Summary** written by the consultant. Read it carefully to ensure your issue is addressed.

**Step 3** — Scroll further to the **Rate Your Support Experience** section:

![Feedback & Rating](C:/Users/Ruhul%20Amin/.gemini/antigravity/brain/fda18881-dbb2-4302-b363-200d11bb56f3/screenshot_feedback_1783088407516.png)
*Figure 7 — Feedback & Rating Section (Resolved Ticket)*

**Step 4** — Select a **star rating** from 1 to 5:

| Stars | Meaning |
|-------|---------|
| ⭐ 1 Star | Poor — Issue not resolved or very dissatisfied |
| ⭐⭐ 2 Stars | Below Average — Partially resolved, significant delays |
| ⭐⭐⭐ 3 Stars | Average — Resolved but with some issues |
| ⭐⭐⭐⭐ 4 Stars | Good — Resolved satisfactorily |
| ⭐⭐⭐⭐⭐ 5 Stars | Excellent — Resolved quickly and professionally |

**Step 5** — *(Optional)* Type a comment in the **Share your experience** text area. Your feedback is reviewed by management and helps improve the support process.

**Step 6** — Click **Submit Feedback & Close Ticket**.

The ticket status changes to **Closed** immediately and no further edits are possible.

> ✅ You will receive a final **closure confirmation email**.

> ⚠️ **Note**: If the issue reoccurs after closing, please open a **new ticket** and reference the original Ticket ID in the description.

---

## 9. Profile & Theme Settings

You can personalize your experience in the system through the Settings panel.

### Accessing Settings

1. Click your **profile avatar** or name in the **top-right corner** of the navbar.
2. A dropdown appears — click **Settings**.

### Theme Customization

![Profile & Theme Settings](C:/Users/Ruhul%20Amin/.gemini/antigravity/brain/fda18881-dbb2-4302-b363-200d11bb56f3/screenshot_profile_settings_1783088429200.png)
*Figure 8 — Theme Customization Settings*

#### Theme Mode
Select how the interface should display:

| Mode | Description |
|------|-------------|
| ☀️ **Light Spectrum** | Clean white/light gray background — best for bright environments |
| 🌙 **Dark Protocol** | Deep navy/dark background — best for low-light environments (default) |
| 🖥️ **System Sync** | Automatically follows your operating system's light/dark mode setting |

#### Primary Brand Color
Choose the main gradient color for headers and primary UI elements:
- **Options**: Blue, Indigo, Purple, Emerald, Rose, Amber, Cyan, Orange

#### Accent UI Color
Choose the highlight color for buttons, active states, and interactive elements:
- **Options**: Blue, Violet, Green, Rose, Amber, Teal

#### Live Preview
All theme selections are **previewed live** in the background as you click each option — without saving yet. You can see exactly how the UI will look before committing.

#### Applying or Discarding Changes
- Click **Apply Preferences** to save your selections. They will persist on your next login.
- Click **Cancel** or close the modal to discard all changes and revert to previous settings.

---

### Profile Information Tab

Under the **Profile** tab in Settings, you can update:
- Your **Display Name**
- Your **Contact Email** *(read-only — changes require Super Admin approval)*
- Your **Profile Photo** (if supported)

---

### Notification Settings Tab

Under the **Notifications** tab, toggle the following email alert types:

| Notification Type | Toggle |
|------------------|--------|
| Ticket status changes | ✅ Recommended ON |
| Consultant replies / remarks | ✅ Recommended ON |
| Ticket assignment confirmation | ✅ Recommended ON |
| Ticket resolution notification | ✅ Recommended ON |
| System announcements | Optional |

---

## 10. Email Notifications

The system sends automated emails for the following events:

| Event | Who Receives It |
|-------|----------------|
| ✅ Ticket Created | You (the raiser) + Assigned Consultant + CC addresses |
| 🔄 Status Changed | You + Assigned Consultant |
| 💬 New Remark Added | You + Consultant (depending on who posted) |
| ✔️ Ticket Resolved | You |
| ⭐ Ticket Closed | You |
| 🔑 Password Reset | You |

### Email Format
Emails come from the ASTPL support system (e.g., `no-reply@astpl.com`) and contain:
- Ticket Number
- Current Status
- Summary of the change
- A direct link to open the ticket in the portal

### Checking for Missing Emails
If you are not receiving emails:
1. Check your **Spam / Junk** folder and mark ASTPL emails as **Not Spam**
2. Add the sender address to your **safe senders list** / contacts
3. Check your **Notification Settings** inside the portal to ensure toggles are ON
4. Contact your system administrator if the problem persists

---

## 11. Security — Changing Your Password

It is recommended to change your password periodically for security.

### How to Change Your Password

1. Click your **profile avatar** in the top-right corner.
2. Select **Settings** from the dropdown.
3. Navigate to the **Security** tab.
4. Click **Change Password**.

![Change Password](C:/Users/Ruhul%20Amin/.gemini/antigravity/brain/fda18881-dbb2-4302-b363-200d11bb56f3/screenshot_password_change_1783088441717.png)
*Figure 9 — Change Password Panel*

5. Fill in the three fields:
   - **Current Password** — your existing password
   - **New Password** — your chosen new password
   - **Confirm New Password** — retype the new password to verify

6. The **Password Strength Indicator** shows whether your new password is Weak, Fair, Good, or Strong.
7. Click **Update Password**.

### Password Security Requirements
- Minimum **8 characters**
- At least **one uppercase letter** (A–Z)
- At least **one lowercase letter** (a–z)
- At least **one number** (0–9)
- Special characters are encouraged (e.g., `!@#$%`)

> 🔐 **Security Best Practices**:
> - Do not reuse old passwords
> - Do not share your password with colleagues
> - Change your password if you suspect unauthorized access
> - Log out of all sessions after changing your password

---

## 12. Frequently Asked Questions (FAQs)

**Q1: Why don't I see the ERP Incident Type field when creating a ticket?**
> The ERP Incident Type field only appears if your company has been configured for ERP support (SAP B1, CREST). If you believe this should be enabled for your company, contact your Super Admin.

**Q2: Can I edit a ticket after submitting it?**
> You cannot edit the Title, Description, or Department after submission. However, you can add additional information through the **Remarks** section inside the ticket, and you can add more file attachments.

**Q3: Can I reopen a closed ticket?**
> No. Once you submit feedback and a ticket is closed, it is locked permanently. If the same issue reoccurs, please raise a **new ticket** and reference the closed ticket number in the description for context.

**Q4: Why is my ticket in "Hold" status?**
> A ticket is placed on Hold when the consultant is waiting for information from you, or waiting for an external factor (e.g., an SAP patch or a third-party fix). Check the **Remarks** section — the consultant will have left a message explaining what is needed.

**Q5: How do I know which consultant is working on my ticket?**
> Open the ticket from **My Tickets**. The assigned consultant's name and photo will appear in the **Ticket Info** sidebar on the right side.

**Q6: What if I accidentally submitted a ticket with the wrong priority?**
> Contact your Super Admin or the assigned consultant via the **Remarks** section. They can update the priority level from the admin console.

**Q7: Can I attach more files after the ticket is submitted?**
> Yes. Open the ticket, scroll to the **Add a Remark** section, and use the **Attach File** button to add more files. Add a remark describing what the files contain.

**Q8: What should I do if my ticket is not assigned after 4 hours?**
> Check the ticket status. If it is still **Pending** after several hours during business hours, post a remark in the ticket requesting an update, or contact your supervisor to notify the support team.

**Q9: How long does it take to resolve a ticket?**
> Resolution time depends on the Priority level and complexity of the issue:
> - **Critical**: Target 4 hours
> - **High**: Target 1 business day
> - **Medium**: Target 2–3 business days
> - **Low**: Target 5 business days

**Q10: Can multiple people from my company view the same ticket?**
> Currently, tickets are associated with the individual user account that created them. If visibility across your team is required, speak to your Super Admin about role configuration options.

---

## 13. Troubleshooting

| Problem | Possible Cause | Solution |
|---------|---------------|---------|
| **Cannot log in** | Wrong password or inactive account | Use "Forgot Password" to reset, or contact your admin |
| **Dashboard is blank / not loading** | Slow internet or server maintenance | Refresh the page (F5). Check the Notice Board for maintenance announcements |
| **Theme colors look wrong** | Outdated cached CSS | Hard refresh the page: `Ctrl + Shift + R` (Windows) / `Cmd + Shift + R` (Mac) |
| **Text is invisible in Light mode** | Cached theme conflict | Open Settings → Theme → select any theme → Apply Preferences |
| **Ticket form not submitting** | Required fields are empty | Look for red error highlights on the form — fill in all required (`*`) fields |
| **Attachment upload fails** | File too large or unsupported type | Ensure file is under 10MB and is a supported format (PNG, JPG, PDF, XLSX, DOCX, LOG, TXT) |
| **Not receiving email notifications** | Emails going to spam | Check Spam folder. Add sender to safe list. Verify Notification toggles are ON in Settings |
| **ERP Incident Type missing** | Company not configured for ERP | Contact your Super Admin to enable ERP Incident Type tracking |
| **Cannot submit feedback** | Ticket not yet in "Resolved" status | Feedback can only be submitted when the status is `Resolved`. Wait for consultant to resolve first |
| **Page not loading after login** | Session expired | Log out completely, clear browser cache, and log back in |

---

### Still Need Help?

If you experience an issue not covered in this guide:

1. **Post a Remark** on your existing ticket describing the problem.
2. **Raise a new ticket** if the issue is unrelated to any existing ticket.
3. **Contact your Super Admin** directly for account-level issues (password resets, access problems).

---

*End of Client User Guide*

---
> **Document**: Client User Guide | **Version**: v4.0.0.1 | **Organization**: Akshay Software Technologies Private Limited
> **Prepared by**: Ruhul Amin | **Reviewed by**: Rajan Chelladurai, Reshma Lokhande
