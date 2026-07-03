import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Client from './src/models/Client.js';
import ClientUser from './src/models/ClientUser.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const users = await ClientUser.find().select('email name role status client clientName').populate('client');
    console.log('--- ALL USERS ---');
    for (const u of users) {
      console.log(`Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Status: ${u.status}, Client: ${u.clientName || u.client?.name || 'none'}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
