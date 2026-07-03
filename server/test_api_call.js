import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ClientUser from './src/models/ClientUser.js';
import * as clientUserService from './src/services/clientUser.service.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Find clientuser Ruhul Amin
    const currentUser = await ClientUser.findOne({ email: 'ruhul.amin.sde@gmail.com' });
    if (!currentUser) {
      console.log('Ruhul Amin user not found');
      return;
    }
    
    console.log('Current User Info:', {
      id: currentUser._id,
      email: currentUser.email,
      role: currentUser.role,
      client: currentUser.client
    });
    
    // Attempt to call createUser service
    try {
      const payload = {
        email: `test_team_member_${Date.now()}@test.com`,
        password: 'Password123',
        name: 'Test Team Member',
        role: 'clientuser'
      };
      
      const result = await clientUserService.createUser(currentUser, payload);
      console.log('Service createUser success:', result);
    } catch (err) {
      console.error('Service createUser failed:', err.message);
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
