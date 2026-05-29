import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Ticket from './models/Ticket.js';

async function testFetch() {
  await mongoose.connect(process.env.MONGODB_URI);
  const tickets = await Ticket.find().select('-attachments.data -adminAttachments.data').limit(1).lean();
  console.log(JSON.stringify(tickets[0].attachments, null, 2));
  process.exit();
}
testFetch();
