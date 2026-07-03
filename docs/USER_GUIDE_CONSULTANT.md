# Consultant Guide

This guide is designed for **Consultants** of the Ticketing System. It covers accessing the consultant dashboard, resolving tickets, tracking work hours, and exporting performance stats.

---

## 1. Access & Dashboard Overview

### Main Dashboard Metrics
Upon logging in, you will access the **Consultant Dashboard**. This view shows:
* **Assigned Tickets count**: Total active tickets assigned to you.
* **Pending Tickets count**: Tickets requiring action or replies.
* **Hours Logged**: Summary of hours logged across all clients.
* **KPI Graphs**:
  * **Work Hours by Client**: Breakdown of time logged for client companies.
  * **Client-wise Tickets**: Breakdown of tickets resolved/pending per client.
* **Date Presets & Date Filters**: Located at the top of the dashboard:
  * Select from presets: `Today`, `Last 7 Days`, `Last 30 Days`, `This Month`, or `Last Month`.
  * Alternatively, input a **Custom Date Range** (Start and End Dates).
  * Clicking any preset or applying a custom range dynamically refilters your dashboard stats, graphs, KPIs, and work hours logs.

---

## 2. Managing the Ticket Queue

To view and process your tickets:
1. Click **Ticket Queue** or **Assigned Tickets** in the sidebar.
2. Filter the queue by status (`assigned`, `pending`, `hold`) or priority to prioritize critical issues.
3. Click a ticket row to open the **Ticket Workstation Panel**.

---

## 3. Resolving Tickets & Workflows

### Standard Resolution Path
When you receive an assigned ticket:
1. **Initiate Work**: Review the ticket details, attachments, and raiser profile.
2. **Interact with the Client**: If you require more logs or details, post a **Remark** in the ticket activity feed. The client user is automatically notified.
3. **Pausing Work (Hold)**: If you are waiting on the client for logs, patches, or user acceptance, change the ticket status to `Hold` or `On Hold`. This stops the target resolution SLA timer.
4. **Log Work Hours**: It is critical to log time entries for work done:
   * Scroll to the **Work Logs** section in the ticket workspace.
   * Enter the date, hours spent (decimal, e.g., `1.5` for 1 hour 30 mins), and a description of activities performed.
   * Click **Add Work Log**. The client's hourly account caps/metrics will update dynamically.
5. **Resolve the Ticket**:
   * Once solved, click **Submit Resolution**.
   * Fill in the **Resolution Summary / Solution** details.
   * Submit. This updates the status to `Resolved` and prompts the client to rate the ticket and close it.

---

## 4. Exporting Reports & Performance Data

As a consultant, you can generate Excel-compatible reports directly from the dashboard:
1. Navigate to the **Consultant Performance Dashboard**.
2. Select your desired date range filter (e.g., *Last 30 Days*).
3. Click the **Export to Excel** button in the top header.
4. This compiles your performance dashboard stats, work hours, client-wise tickets count, and reviews into a CSV formatted with a UTF-8 BOM (`\uFEFF`) signature. Excel will open it with correct cell separation and encoding.
5. You can also generate a text-based report summary by selecting **Download Text Report**.

---

## 5. FAQs & Troubleshooting

### FAQs
* **Q: Why are my "Work Hours by Client" and "Client-wise Tickets" widgets blank?**
  * **A**: Ensure you have selected a date range where you actually logged hours or received tickets. If the date range is correct and they are still blank, make sure you have added time entries to your assigned tickets.
* **Q: How does the system calculate my "Time to Solve"?**
  * **A**: It is the duration between the ticket assignment date/time and the resolution date/time, excluding any periods where the ticket was placed in `Hold` status.

### Troubleshooting
* **Charts do not update when selecting custom dates:**
  * Double check that both **Start Date** and **End Date** are fully filled out. The dashboard requires a valid range to execute the MongoDB aggregation pipelines.
* **CSV/Excel Export shows strange characters:**
  * The system attaches a UTF-8 BOM (`\uFEFF`) to exports. Ensure that you are opening the file with Excel or Google Sheets, which recognize this signature automatically and parse cell accents and values correctly.
