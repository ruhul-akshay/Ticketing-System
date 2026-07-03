# Super Admin Guide

This guide is designed for **Super Admins** of the Ticketing System. It details system configurations, client setup, CC email alerts, and the automatic pre-assignment routing rule workstation.

---

## 1. Access & Admin Console

Super Admins have full read/write access to the entire application. The **Super Admin Console** provides:
* **System Metrics**: Total active tickets, unresolved escalations, active clients, and online consultants.
* **Control Center**: Sidebar access to user accounts, client companies, departments, routing rules, and notification panels.
* **Announcements**: Publish system-wide broadcasts on the notice board.

---

## 2. Managing Client Companies (ERP Details)

To set up and configure a client company:
1. Navigate to **Clients Management**.
2. Click **Add Client Company**.
3. Fill in basic parameters: Company Name, Email Domain, Contact Details.
4. Configure **ERP Details** (Crucial for ticket classification):
   * **ERP Name**: SAP Business One, CREST, or Custom.
   * **SAP B1 Version Type**: SQL or HANA.
   * **SAP B1 Version & FP Detail**: Patch level details.
   * **AMC Toggles**: SAP License AMC and Support AMC details.
   * **Support Type & Hourly Cap**: Select support type (e.g., *AMC Fixed*, *Hourly Rate*) and log the hourly capacity (e.g., *100 hours*).
   * **ERP Incident Types**: Configure the incident classifications active for this client (e.g., *Functional / Transactional*, *Technical / Connection*, *Add-Ons*).
5. Click **Save Client**. Once saved, client users linked to this company will see the ERP incident selector field on ticket creation.

---

## 3. Department & Category Management

To group tickets logically:
1. Navigate to **Departments Management**.
2. Click **Create Department**.
3. Enter Name (e.g., *SAP Functional Support*) and description.
4. Under **Categories**, input sub-categories as a comma-separated list or add them line-by-line (e.g., *Finance, Inventory, Production*).
5. Click **Save**. These categories will display dynamically under the category field on ticket forms once this department is chosen.

---

## 4. CC Email Settings (Super Admin Dropdown)

To manage system-wide CC email rules:
1. Click your profile avatar in the top-right corner of the top navbar and select **Settings**.
2. Navigate to **CC Email Management** (visible only to Super Admins).
3. Here you can:
   * Add, edit, or delete CC email addresses.
   * Configure which notifications are sent to these CC recipients by toggling checkboxes:
     * *Client Creation*
     * *Client User Creation*
     * *Ticket Creation*
     * *Ticket Status Updates*
     * *Ticket Assignment*
     * *Ticket Closure*
     * *Password Reset Notifications*
   * Click **Save CC Settings**. The backend will monitor email events and copy these addresses dynamically without requiring system reboots.

---

## 5. Pre-Assignment Routing Rules Console

Automatic ticket routing maps tickets to specific consultants on creation. To configure routing rules:
1. Navigate to **Pre-Assignment Rules** in your administrator settings.
2. Click **Add Routing Rule**.
3. Set the following fields:
   * **Rule Name**: (e.g., *SAP HANA Technical Routing*).
   * **Routing Criteria Type**:
     * **Specific Ticket Creator**: Select a specific user.
     * **Specific Client Company**: Match all tickets raised by a client.
     * **Specific Department**: Match tickets routed to a department. 
       * *Categories (Optional)*: If chosen, select one or multiple categories via checkboxes. If no category checkboxes are checked, the rule routes all tickets for this department.
     * **ERP Incident Type**: Match tickets containing specific incident types.
       * *ERP Incident Types (Multiselect)*: Select one or multiple incident types (*Functional / Transactional*, *Technical / Connection*, *Add-Ons*) using the checkbox grid. The rule will trigger if the ticket matches any of the checked types.
   * **Primary Assignee**: The consultant who will receive the ticket.
   * **CC Consultants** *(Optional)*: Additional consultants to copy on this ticket's notifications.
   * **Evaluation Order**: Numerical priority (e.g., `10`, `20`, `30`). Rules are evaluated sequentially starting from the lowest number. The first matching rule applies.
4. Toggle **Active Status** and click **Save Rule**.

---

## 6. Workflows & Common Tasks

### Scenario 1: Onboarding a New Client Company
1. Create the Client Company in **Clients Management**.
2. Go to **User Management** and create the first Client User. Link them to the newly created Client Company.
3. Configure the Pre-Assignment routing rule to route this client's tickets to their primary consultant.

### Scenario 2: Reassigning a Ticket
If a ticket is misrouted:
1. Open the ticket from the global queue.
2. Click **Assign Ticket** in the workspace panel.
3. Select a new consultant and input reassignment remarks. Click submit.

---

## 7. FAQs & Troubleshooting

### FAQs
* **Q: Two pre-assignment rules match a ticket. Which one wins?**
  * **A**: The system evaluates rules based on their **Evaluation Order** (lowest number first). The first rule that matches will assign the ticket, and subsequent rules are skipped.
* **Q: How do I disable a routing rule temporary without deleting it?**
  * **A**: Locate the rule in the **Pre-Assignment Rules** list and toggle the **Status** switch off. This marks it inactive immediately.

### Troubleshooting
* **Pre-Assignment Rules are not matching department categories:**
  * Double check that the category spelling matches exactly. Category strings are compared against the department list values.
* **CC email alerts are not being sent:**
  * Ensure the SMTP details in your `.env` configuration file are active and that the toggles for the specific notification event are enabled in your top-right profile settings.
