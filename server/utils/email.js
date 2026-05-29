import nodemailer from 'nodemailer';
import AdminProfile from '../models/AdminProfile.js';

/* ======================= TRANSPORTER ======================= */
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

/* ======================= VERIFY SMTP ======================= */
transporter.verify((err) => {
  if (err) {
    console.error('❌ SMTP VERIFY FAILED:', err.message);
  } else {
    console.log('✅ SMTP CONNECTED (Office365)');
  }
});

/* ======================= FORMAL EMAIL WRAPPER ======================= */
const emailWrapper = (title, body) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: #0f172a;
      color: #ffffff;
      padding: 30px 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      letter-spacing: 0.05em;
    }
    .content {
      padding: 40px;
      color: #334155;
      line-height: 1.8;
    }
    .content h2 {
      color: #0f172a;
      font-size: 18px;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 10px;
      margin-top: 0;
    }
    .ticket-details {
      background: #f1f5f9;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      margin-bottom: 8px;
    }
    .detail-label {
      font-weight: bold;
      width: 120px;
      color: #64748b;
    }
    .detail-value {
      color: #1e293b;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin-top: 20px;
    }
    .footer {
      background: #f8fafc;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
      padding: 20px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Akshay Support</h1>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Akshay Software Technologies Ltd. All rights reserved.<br/>
      This is an automated system notification. Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>
`;

/* ======================= USER: TICKET CREATED ======================= */
export const sendTicketCreatedEmail = async (to, ticket, cc = null) => {
  try {
    if (!to) return;

    const html = emailWrapper(
      'Ticket Acknowledgment',
      `
      <h2>Ticket Confirmation</h2>
      <p>Dear <strong>${ticket.createdBy?.name || 'User'}</strong>,</p>
      <p>Thank you for contacting Akshay Support. This email is to confirm that your support request has been successfully logged in our system.</p>
      
      <div class="ticket-details">
        <div class="detail-row">
          <div class="detail-label">Ticket ID:</div>
          <div class="detail-value"><strong>${ticket.ticketNumber}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Subject:</div>
          <div class="detail-value">${ticket.title}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Priority:</div>
          <div class="detail-value">${ticket.priority.toUpperCase()}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Status:</div>
          <div class="detail-value">OPEN / PENDING</div>
        </div>
      </div>

      <p><strong>Description:</strong><br/>${ticket.description}</p>

      <p>Our technical team has been notified and will review your request shortly. You can track the progress of your ticket by logging into your support dashboard.</p>
      
      <p>Best Regards,<br/><strong>Super Admin</strong><br/>Akshay Software Technologies Ltd.</p>
      `
    );

    await transporter.sendMail({
      from: `"Akshay Support" <${process.env.SMTP_USER}>`,
      to,
      cc,
      subject: `[Support Ticket: ${ticket.ticketNumber}] ${ticket.title}`,
      html
    });

    console.log(`✅ TICKET CREATED EMAIL SENT TO ${to} ${cc ? `(CC: ${cc})` : ''}`);

  } catch (error) {
    console.error('❌ TICKET CREATED EMAIL FAILED:', error);
  }
};

/* ======================= ADMIN: NEW TICKET ALERT ======================= */
export const sendAdminTicketAlertEmail = async (ticket) => {
  try {
    if (!ticket?.department) return;

    // Find admins for this department
    const adminProfiles = await AdminProfile.find({
      department: ticket.department._id || ticket.department
    }).populate('user', 'name email role');

    const adminEmails = adminProfiles
      .map(p => p.user?.email)
      .filter(Boolean);

    if (!adminEmails.length) return;

    const html = emailWrapper(
      'New Support Request',
      `
      <h2>New Ticket Assigned to Your Department</h2>
      <p>A new support ticket requires your attention.</p>
      
      <div class="ticket-details">
        <div class="detail-row">
          <div class="detail-label">Ticket ID:</div>
          <div class="detail-value"><strong>${ticket.ticketNumber}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Department:</div>
          <div class="detail-value">${ticket.department?.name || 'N/A'}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Priority:</div>
          <div class="detail-value">${ticket.priority.toUpperCase()}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">User:</div>
          <div class="detail-value">${ticket.createdBy?.name || 'N/A'}</div>
        </div>
      </div>

      <p><strong>Subject:</strong> ${ticket.title}</p>

      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin" class="btn">View in Admin Panel</a>
      
      <p>Best Regards,<br/><strong>Akshay Support System</strong></p>
      `
    );

    await transporter.sendMail({
      from: `"Akshay Support" <${process.env.SMTP_USER}>`,
      to: adminEmails,
      subject: `🚨 Action Required: New Ticket ${ticket.ticketNumber}`,
      html
    });

    console.log('✅ ADMIN ALERT SENT TO:', adminEmails);

  } catch (error) {
    console.error('❌ ADMIN ALERT FAILED:', error);
  }
};

/* ======================= USER: TICKET RESOLVED ======================= */
export const sendTicketResolvedEmail = async (to, ticket) => {
  try {
    if (!to) return;

    const reviewUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reviews`;

    const html = emailWrapper(
      'Service Completion',
      `
      <h2>Ticket Resolved</h2>
      <p>Dear <strong>${ticket.createdBy?.name || 'User'}</strong>,</p>
      <p>We are pleased to inform you that your support request has been resolved.</p>
      
      <div class="ticket-details">
        <div class="detail-row">
          <div class="detail-label">Ticket ID:</div>
          <div class="detail-value"><strong>${ticket.ticketNumber}</strong></div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Solution:</div>
          <div class="detail-value">${ticket.solution || 'The issue has been addressed by our technical team.'}</div>
        </div>
      </div>

      <p>We value your feedback. Please take a moment to rate our service by clicking the link below:</p>
      
      <a href="${reviewUrl}" class="btn">Provide Feedback / Review</a>

      <p>Thank you for choosing Akshay Support.</p>
      
      <p>Best Regards,<br/><strong>Akshay Support Team</strong></p>
      `
    );

    await transporter.sendMail({
      from: `"Akshay Support" <${process.env.SMTP_USER}>`,
      to,
      subject: `[Resolved] Ticket ${ticket.ticketNumber}: ${ticket.title}`,
      html
    });

    console.log(`✅ RESOLVED EMAIL SENT TO ${to}`);

  } catch (error) {
    console.error('❌ RESOLVED EMAIL FAILED:', error);
  }
};

/* ======================= USER: TOKEN COMPLETED ======================= */
export const sendTokenCompletedEmail = async (to, token) => {
  try {
    if (!to) return;

    const html = emailWrapper(
      'Task Completed',
      `
      <h2>Service Request Completed</h2>
      <p>Hello <strong>${token.createdBy?.name || 'User'}</strong>,</p>
      <p>Your request has been processed and completed successfully.</p>
      
      <div class="ticket-details">
        <div class="detail-row">
          <div class="detail-label">Request No:</div>
          <div class="detail-value"><strong>${token.ticketNumber}</strong></div>
        </div>
      </div>

      <p>Regards,<br/><strong>Akshay Support Team</strong></p>
      `
    );

    await transporter.sendMail({
      from: `"Akshay Support" <${process.env.SMTP_USER}>`,
      to,
      subject: `Completed: Request ${token.ticketNumber}`,
      html
    });

  } catch (error) {
    console.error('❌ TOKEN EMAIL FAILED:', error);
  }
};
