import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Ticket from './src/models/Ticket.js';
import User from './src/models/User.js';
import AdminProfile from './src/models/AdminProfile.js';
import Department from './src/models/Department.js';
import Client from './src/models/Client.js';

async function testNotificationRouting() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    // Fetch one ticket
    const ticket = await Ticket.findOne().populate('department');
    if (!ticket) {
      console.log('❌ No tickets found in the database to test with.');
      process.exit(0);
    }

    console.log('\n--- TICKET INFO ---');
    console.log(`ID: ${ticket._id}`);
    console.log(`Number: ${ticket.ticketNumber}`);
    console.log(`Title: ${ticket.title}`);
    console.log(`Department: ${ticket.department?.name || 'none'}`);
    console.log(`Created By (ID): ${ticket.createdBy}`);
    console.log(`Assigned To (ID): ${ticket.assignedTo || 'Unassigned'}`);

    // Re-fetch and populate using the exact queries from our handlers
    const updatedTicket = await Ticket.findById(ticket._id)
      .populate({ path: 'createdBy', select: 'name email client', populate: { path: 'client', select: 'name contactEmail' } })
      .populate({ path: 'assignedTo', select: 'name email role' })
      .populate({ path: 'department', select: 'name' });

    console.log('\n--- POPULATED INFO ---');
    console.log(`Created By: ${updatedTicket.createdBy?.name} <${updatedTicket.createdBy?.email}>`);
    console.log(`Assigned To: ${updatedTicket.assignedTo ? `${updatedTicket.assignedTo.name} <${updatedTicket.assignedTo.email}> (${updatedTicket.assignedTo.role})` : 'Unassigned'}`);

    // Test CASE 1: Admin sends a message (Notify creator/user)
    console.log('\n--- CASE 1: Admin/Super Admin sends message ---');
    if (updatedTicket.createdBy?.email) {
      console.log(`🎯 User to notify: ${updatedTicket.createdBy.email}`);
    } else {
      console.log('❌ Creator email not found.');
    }

    // Test CASE 2: User sends a message (Notify admin)
    console.log('\n--- CASE 2: User sends message ---');
    if (updatedTicket.assignedTo?.email) {
      console.log(`🎯 Assigned Admin to notify: ${updatedTicket.assignedTo.email} (${updatedTicket.assignedTo.role})`);
    } else {
      console.log('Ticket is UNASSIGNED. Resolving fallback recipients...');
      const recipients = [];
      if (updatedTicket.department) {
        const adminProfiles = await AdminProfile.find({
          department: updatedTicket.department._id || updatedTicket.department
        }).populate('user', 'email role');
        
        console.log(`Department admins found: ${adminProfiles.length}`);
        adminProfiles.forEach(p => {
          if (p.user?.email) {
            recipients.push({ email: p.user.email, role: p.user.role || 'admin' });
          }
        });
      }
      
      const superAdmins = await User.find({ role: 'superadmin', status: 'active' });
      console.log(`Active super admins found: ${superAdmins.length}`);
      superAdmins.forEach(u => {
        if (u.email) {
          recipients.push({ email: u.email, role: 'superadmin' });
        }
      });

      // Deduplicate by email
      const uniqueRecipients = [];
      const seenEmails = new Set();
      for (const r of recipients) {
        if (!seenEmails.has(r.email)) {
          seenEmails.add(r.email);
          uniqueRecipients.push(r);
        }
      }

      console.log('🎯 Fallback recipients:');
      if (uniqueRecipients.length === 0) {
        console.log('  None');
      } else {
        uniqueRecipients.forEach(r => {
          console.log(`  - ${r.email} (${r.role})`);
        });
      }
    }

    console.log('\nRouting test finished successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during routing test:', error);
    process.exit(1);
  }
}

testNotificationRouting();
