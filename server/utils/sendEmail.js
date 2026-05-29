import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // must be false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send ticket creation email
 */
export const sendTicketCreatedEmail = async ({
  to,
  name,
  ticketNumber,
  title,
}) => {
  const mailOptions = {
    from: `"Akshay Support" <${process.env.SMTP_USER}>`,
    to,
    subject: `Ticket Created Successfully | Ticket #${ticketNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f9fafb; padding:20px">
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; padding:24px">
          
          <h2 style="color:#ED1B2F">🎫 Ticket Created Successfully</h2>
          
          <p>Dear <strong>${name}</strong>,</p>

          <p>Thank you for contacting <strong>Akshay Support</strong>.</p>

          <p>Your ticket has been created successfully with the following details:</p>

          <table style="width:100%; border-collapse:collapse; margin:16px 0">
            <tr>
              <td style="padding:8px; font-weight:bold">Ticket Number</td>
              <td style="padding:8px">#${ticketNumber}</td>
            </tr>
            <tr>
              <td style="padding:8px; font-weight:bold">Title</td>
              <td style="padding:8px">${title}</td>
            </tr>
          </table>

          <p>Our support team will review your request and get back to you shortly.</p>

          <p style="margin-top:24px">
            Regards,<br/>
            <strong>Akshay Support Team</strong>
          </p>

          <hr style="margin-top:24px"/>

          <p style="font-size:12px; color:#6b7280">
            This is an automated email. Please do not reply.
          </p>

        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
