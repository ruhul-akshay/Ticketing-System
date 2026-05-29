import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Ticket from './models/Ticket.js';

async function testFetch() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const tickets = await Ticket.find({})
      .select('-attachments.data -adminAttachments.data -supportingDocuments.data')
      .sort({ createdAt: -1 })
      .limit(3);

  const formatted = tickets.map(t => ({
    ...t.toObject(),
    attachmentCount: t.attachments?.length || 0
  }));
  
  console.log(JSON.stringify(formatted.map(f => ({
      id: f._id,
      attachmentsLength: f.attachments?.length,
      attachments: f.attachments
  })), null, 2));
  process.exit();
}
testFetch();
