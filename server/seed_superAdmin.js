import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import ClientUser from './src/models/ClientUser.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/token-system');
    console.log('Connected to MongoDB');

    // Clear only users to preserve other data if needed
    await ClientUser.deleteMany({});
    console.log('Cleared existing users');

    // Create Super Admin only
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    await ClientUser.create({
      email: 'astplticket@akshay.com',
      password: hashedPassword,
      name: 'Akshay Ticketing',
      employeeCode: '0000',
      role: 'superadmin'
    });

    console.log('\n=================================');
    console.log('SuperAdmin seeded successfully!');
    console.log('=================================');
    console.log('\nSuper Admin Credentials:');
    console.log('-------------------------');
    console.log('Email: astplticket@akshay.com');
    console.log('Password: 123456');
    console.log('Employee Code: SA001');
    console.log('=================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();