import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Ticket from './models/Ticket.js';

async function testUpdate() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find ticket with attachments
  const tickets = await Ticket.find({ "attachments.0": { $exists: true } }).limit(1);
  if (tickets.length === 0) {
      console.log('No tickets with attachments found');
      process.exit();
  }
  
  const ticket = tickets[0];
  console.log(`Before update, attachments length: ${ticket.attachments.length}`);
  
  // Simulate the API PUT updates
  const reqBody = { status: 'in progress' };
  Object.assign(ticket, reqBody);
  
  await ticket.save();
  
  const ticketAfter = await Ticket.findById(ticket._id);
  console.log(`After update, attachments length: ${ticketAfter.attachments.length}`);
  
  process.exit();
}
testUpdate();
