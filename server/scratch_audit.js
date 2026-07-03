import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Client from './src/models/Client.js';
import User from './src/models/User.js';
import Ticket from './src/models/Ticket.js';

async function testRefresh() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    const allClients = await Client.find({});
    console.log(`\nFound ${allClients.length} clients to test.`);

    for (const client of allClients) {
      console.log(`\n--- Testing for: ${client.name} ---`);
      
      const clientUsers = await User.find({
        role: { $ne: 'superadmin' },
        $or: [
          { client: client._id },
          { clientName: { $regex: new RegExp(`^${client.name}$`, 'i') } }
        ]
      }).select('_id name email client clientName');

      console.log(`Users found (${clientUsers.length}):`);
      clientUsers.forEach(u => {
        console.log(`  - ${u.name} (${u.email}) | Cl ID: ${u.client} | Cl Name: ${u.clientName}`);
      });

      const userIds = clientUsers.map(u => u._id);

      const tickets = await Ticket.find({
        createdBy: { $in: userIds }
      });
      console.log(`Tickets found (${tickets.length})`);

      const resolvedTickets = tickets.filter(t => ['resolved', 'Resolved', 'closed', 'Closed'].includes(t.status));
      const pendingTickets = tickets.filter(t => ['pending', 'Pending', 'open', 'Open'].includes(t.status));
      
      console.log(`Resolved: ${resolvedTickets.length}`);
      console.log(`Pending: ${pendingTickets.length}`);

      // Let's try running the save logic
      client.employeeCount = userIds.length;
      client.totalTickets = tickets.length;
      client.resolvedTickets = resolvedTickets.length;
      client.pendingTickets = pendingTickets.length;
      await client.save();
      console.log(`✅ Saved client stats to DB!`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testRefresh();
