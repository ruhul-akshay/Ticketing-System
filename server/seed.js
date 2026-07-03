import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import ClientUser from './src/models/ClientUser.js';
import Client from './src/models/Client.js';
import ConsultantProfile from './src/models/ConsultantProfile.js';
import Department from './src/models/Department.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/token-system';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // 1. Clear existing documents
    console.log('Clearing database tables...');
    await ClientUser.deleteMany({});
    await Client.deleteMany({});
    await ConsultantProfile.deleteMany({});
    await Department.deleteMany({});
    console.log('Database cleared.');

    // Common password hash for all seeded accounts
    const hashedPassword = await bcrypt.hash('123456', 10);

    // 2. Seed 10 Departments
    console.log('Seeding 10 Departments...');
    const departmentsData = [
      { name: 'Finance & Accounts', description: 'Financial reporting, accounting, tax computations, and cash-flow management.', categories: ['General Ledger', 'Accounts Payable', 'Accounts Receivable', 'Asset Accounting', 'GST & Taxation'] },
      { name: 'Human Resources', description: 'Employee onboarding, payroll processing, attendance tracking, and performance reviews.', categories: ['Payroll Processing', 'Attendance Tracking', 'Leave Management', 'Recruitment', 'Appraisals'] },
      { name: 'Sales & Distribution', description: 'Customer relationship management, sales order lifecycle, deliveries, and billing.', categories: ['Sales Orders', 'Shipment & Delivery', 'Customer Invoicing', 'Credit Management', 'CRM Leads'] },
      { name: 'Materials Management', description: 'Sourcing, purchase requisition, purchase orders, inventory reception, and vendor management.', categories: ['Purchase Requisition', 'Purchase Orders', 'Goods Receipt', 'Inventory Control', 'Vendor Invoicing'] },
      { name: 'IT Infrastructure', description: 'Network administration, hardware procurement, systems access, security audits, and software provisioning.', categories: ['Network Access', 'Hardware Procurement', 'Software Installations', 'Database Backups', 'Security Audits'] },
      { name: 'Production Planning', description: 'Bill of materials (BOM), material requirements planning (MRP), work orders, and shop floor management.', categories: ['Bill of Materials', 'MRP Runs', 'Production Orders', 'Capacity Planning', 'Quality Gate Checks'] },
      { name: 'Quality Assurance', description: 'Incoming material inspections, testing procedures, product quality approvals, and customer returns analysis.', categories: ['Incoming Inspections', 'Product Testing', 'QA Certifications', 'Customer Returns Audit'] },
      { name: 'Project Systems', description: 'Work breakdown structure (WBS) design, project budgeting, resource planning, and milestone tracking.', categories: ['WBS Definition', 'Budget Allocations', 'Resource Scheduling', 'Milestone Verifications'] },
      { name: 'Plant Maintenance', description: 'Preventative maintenance schedules, breakdown repairs, calibration tracking, and equipment maintenance.', categories: ['Preventative Maintenance', 'Breakdown Requests', 'Equipment Calibration', 'Spare Parts Inventory'] },
      { name: 'Customer Service', description: 'Post-sales customer complaints, warranty tracking, repair work orders, and service contract renewals.', categories: ['Warranty Claims', 'Repair Orders', 'Service Contracts', 'On-Site Scheduling'] }
    ];

    const seededDepts = await Department.insertMany(departmentsData);
    console.log(`Seeded ${seededDepts.length} departments.`);

    // 3. Seed 10 Clients
    console.log('Seeding 10 Clients...');
    const erpIncidentTypes = ['Functional / Transactional', 'Technical / Connection', 'Add-Ons'];
    const clientsData = [
      {
        name: 'Acme Corporation',
        domain: 'acme.com',
        contactPerson: 'John Doe',
        contactEmail: 'contact@acme.com',
        contactPhone: '+1-555-0101',
        erpDetails: { erpName: 'SAP B1', sapB1VersionType: 'HANA', sapB1VersionAndFP: '10.0 FP 2208', sapLicenseAMC: 'Active', sapSupportAMC: { status: 'Active', fromDate: new Date('2026-01-01'), toDate: new Date('2027-01-01') }, sapSupportAMCType: 'Unlimited', sapSupportHourlyCap: 0, erpIncidentTypes, hoursUsed: 12 },
        employeeCount: 450,
        status: 'active'
      },
      {
        name: 'Globex Industries',
        domain: 'globex.com',
        contactPerson: 'Hank Scorpio',
        contactEmail: 'contact@globex.com',
        contactPhone: '+1-555-0102',
        erpDetails: { erpName: 'SAP B1', sapB1VersionType: 'SQL', sapB1VersionAndFP: '10.0 FP 2111', sapLicenseAMC: 'Active', sapSupportAMC: { status: 'Active', fromDate: new Date('2026-02-15'), toDate: new Date('2027-02-14') }, sapSupportAMCType: 'Limited', sapSupportHourlyCap: 120, erpIncidentTypes, hoursUsed: 34 },
        employeeCount: 820,
        status: 'active'
      },
      {
        name: 'Initech Corp',
        domain: 'initech.com',
        contactPerson: 'Peter Gibbons',
        contactEmail: 'contact@initech.com',
        contactPhone: '+1-555-0103',
        erpDetails: { erpName: 'CREST', erpIncidentTypes, hoursUsed: 5 },
        employeeCount: 150,
        status: 'active'
      },
      {
        name: 'Umbrella Corp',
        domain: 'umbrella.com',
        contactPerson: 'Albert Wesker',
        contactEmail: 'contact@umbrella.com',
        contactPhone: '+1-555-0104',
        erpDetails: { erpName: 'SAP B1', sapB1VersionType: 'HANA', sapB1VersionAndFP: '10.0 FP 2305', sapLicenseAMC: 'Active', sapSupportAMC: { status: 'Active', fromDate: new Date('2026-03-01'), toDate: new Date('2027-03-01') }, sapSupportAMCType: 'Unlimited', sapSupportHourlyCap: 0, erpIncidentTypes, hoursUsed: 42 },
        employeeCount: 1200,
        status: 'active'
      },
      {
        name: 'Stark Industries',
        domain: 'stark.com',
        contactPerson: 'Pepper Potts',
        contactEmail: 'contact@stark.com',
        contactPhone: '+1-555-0105',
        erpDetails: { erpName: 'SFA', erpIncidentTypes, hoursUsed: 18 },
        employeeCount: 2500,
        status: 'active'
      },
      {
        name: 'Wayne Enterprises',
        domain: 'wayne.com',
        contactPerson: 'Lucius Fox',
        contactEmail: 'contact@wayne.com',
        contactPhone: '+1-555-0106',
        erpDetails: { erpName: 'SAP B1', sapB1VersionType: 'HANA', sapB1VersionAndFP: '10.0 FP 2308', sapLicenseAMC: 'Active', sapSupportAMC: { status: 'Active', fromDate: new Date('2026-05-01'), toDate: new Date('2027-05-01') }, sapSupportAMCType: 'Unlimited', sapSupportHourlyCap: 0, erpIncidentTypes, hoursUsed: 8 },
        employeeCount: 3400,
        status: 'active'
      },
      {
        name: 'Tyrell Corporation',
        domain: 'tyrell.com',
        contactPerson: 'Eldon Tyrell',
        contactEmail: 'contact@tyrell.com',
        contactPhone: '+1-555-0107',
        erpDetails: { erpName: 'SAP B1', sapB1VersionType: 'SQL', sapB1VersionAndFP: '9.3 PL 14', sapLicenseAMC: 'Terminated', sapSupportAMC: { status: 'Suspended', fromDate: new Date('2025-01-01'), toDate: new Date('2026-01-01') }, sapSupportAMCType: 'Limited', sapSupportHourlyCap: 50, erpIncidentTypes, hoursUsed: 0 },
        employeeCount: 500,
        status: 'suspended',
        statusReason: 'AMC Subscription Expired and unpaid invoice.'
      },
      {
        name: 'Cyberdyne Systems',
        domain: 'cyberdyne.com',
        contactPerson: 'Miles Dyson',
        contactEmail: 'contact@cyberdyne.com',
        contactPhone: '+1-555-0108',
        erpDetails: { erpName: 'SFA', erpIncidentTypes, hoursUsed: 25 },
        employeeCount: 650,
        status: 'active'
      },
      {
        name: 'Weyland-Yutani Corp',
        domain: 'weyland.com',
        contactPerson: 'Carter Burke',
        contactEmail: 'contact@weyland.com',
        contactPhone: '+1-555-0109',
        erpDetails: { erpName: 'SAP B1', sapB1VersionType: 'HANA', sapB1VersionAndFP: '10.0 FP 2202', sapLicenseAMC: 'Active', sapSupportAMC: { status: 'Active', fromDate: new Date('2026-04-10'), toDate: new Date('2027-04-09') }, sapSupportAMCType: 'Limited', sapSupportHourlyCap: 300, erpIncidentTypes, hoursUsed: 110 },
        employeeCount: 9500,
        status: 'active'
      },
      {
        name: 'Hooli Inc',
        domain: 'hooli.com',
        contactPerson: 'Gavin Belson',
        contactEmail: 'contact@hooli.com',
        contactPhone: '+1-555-0110',
        erpDetails: { erpName: 'CREST', erpIncidentTypes, hoursUsed: 80 },
        employeeCount: 4500,
        status: 'active'
      }
    ];

    const seededClients = await Client.insertMany(clientsData);
    console.log(`Seeded ${seededClients.length} clients.`);

    // 4. Seed 10 Client Users (one for each client)
    console.log('Seeding 10 Client Users (one per client)...');
    const clientUsersData = [
      { name: 'Jane Doe', email: 'jane.doe@acme.com', password: hashedPassword, role: 'clientuser', employeeCode: 'ACME001', phoneNumber: '+1-555-1001', position: 'Finance Manager', client: seededClients[0]._id, clientName: seededClients[0].name },
      { name: 'John Scorpio', email: 'john.scorpio@globex.com', password: hashedPassword, role: 'clientuser', employeeCode: 'GLOB023', phoneNumber: '+1-555-1002', position: 'Operations Supervisor', client: seededClients[1]._id, clientName: seededClients[1].name },
      { name: 'Milton Waddams', email: 'milton.waddams@initech.com', password: hashedPassword, role: 'clientuser', employeeCode: 'INIT118', phoneNumber: '+1-555-1003', position: 'Compliance Specialist', client: seededClients[2]._id, clientName: seededClients[2].name },
      { name: 'Ada Wesker', email: 'ada.wesker@umbrella.com', password: hashedPassword, role: 'clientuser', employeeCode: 'UMBR909', phoneNumber: '+1-555-1004', position: 'HR Director', client: seededClients[3]._id, clientName: seededClients[3].name },
      { name: 'Happy Hogan', email: 'happy.hogan@stark.com', password: hashedPassword, role: 'clientuser', employeeCode: 'STARK441', phoneNumber: '+1-555-1005', position: 'Logistics Lead', client: seededClients[4]._id, clientName: seededClients[4].name },
      { name: 'Alfred Pennyworth', email: 'alfred.p@wayne.com', password: hashedPassword, role: 'clientuser', employeeCode: 'WAYN007', phoneNumber: '+1-555-1006', position: 'Facilities Chief', client: seededClients[5]._id, clientName: seededClients[5].name },
      { name: 'Rachael Rosen', email: 'rachael.r@tyrell.com', password: hashedPassword, role: 'clientuser', employeeCode: 'TYR2049', phoneNumber: '+1-555-1007', position: 'Quality Inspector', client: seededClients[6]._id, clientName: seededClients[6].name },
      { name: 'Sarah Connor', email: 's.connor@cyberdyne.com', password: hashedPassword, role: 'clientuser', employeeCode: 'CYB1984', phoneNumber: '+1-555-1008', position: 'Security Lead', client: seededClients[7]._id, clientName: seededClients[7].name },
      { name: 'Bishop Ripley', email: 'bishop.r@weyland.com', password: hashedPassword, role: 'clientuser', employeeCode: 'WEYL2122', phoneNumber: '+1-555-1009', position: 'Project Architect', client: seededClients[8]._id, clientName: seededClients[8].name },
      { name: 'Richard Hendricks', email: 'richard@hooli.com', password: hashedPassword, role: 'clientuser', employeeCode: 'HOOL010', phoneNumber: '+1-555-1010', position: 'Engineering VP', client: seededClients[9]._id, clientName: seededClients[9].name }
    ];

    const seededClientUsers = await ClientUser.insertMany(clientUsersData);
    console.log(`Seeded ${seededClientUsers.length} client users.`);

    // 5. Seed 10 Consultants (ClientUser + ConsultantProfile)
    console.log('Seeding 10 Consultants (Users & Profiles)...');
    const consultantsUserData = [
      { name: 'Robert C. Martin', email: 'bob.martin@akshay.com', password: hashedPassword, role: 'consultant', employeeCode: 'CONS001', phoneNumber: '+91-98765-43210', position: 'Senior Principal Consultant' },
      { name: 'Martin Fowler', email: 'martin.fowler@akshay.com', password: hashedPassword, role: 'consultant', employeeCode: 'CONS002', phoneNumber: '+91-98765-43211', position: 'ERP Architect' },
      { name: 'Kent Beck', email: 'kent.beck@akshay.com', password: hashedPassword, role: 'consultant', employeeCode: 'CONS003', phoneNumber: '+91-98765-43212', position: 'Functional Lead' },
      { name: 'Linus Torvalds', email: 'linus.torvalds@akshay.com', password: hashedPassword, role: 'consultant', employeeCode: 'CONS004', phoneNumber: '+91-98765-43213', position: 'Technical consultant' },
      { name: 'Grace Hopper', email: 'grace.hopper@akshay.com', password: hashedPassword, role: 'consultant', employeeCode: 'CONS005', phoneNumber: '+91-98765-43214', position: 'Technical consultant' },
      { name: 'Ada Lovelace', email: 'ada.lovelace@akshay.com', password: hashedPassword, role: 'consultant', employeeCode: 'CONS006', phoneNumber: '+91-98765-43215', position: 'Implementation Lead' },
      { name: 'Alan Turing', email: 'alan.turing@akshay.com', password: hashedPassword, role: 'consultant', employeeCode: 'CONS007', phoneNumber: '+91-98765-43216', position: 'Systems Analyst' },
      { name: 'Donald Knuth', email: 'donald.knuth@akshay.com', password: hashedPassword, role: 'consultant', employeeCode: 'CONS008', phoneNumber: '+91-98765-43217', position: 'Principal Architect' },
      { name: 'Ken Thompson', email: 'ken.thompson@akshay.com', password: hashedPassword, role: 'consultant', employeeCode: 'CONS009', phoneNumber: '+91-98765-43218', position: 'Lead consultant' },
      { name: 'Dennis Ritchie', email: 'dennis.ritchie@akshay.com', password: hashedPassword, role: 'consultant', employeeCode: 'CONS010', phoneNumber: '+91-98765-43219', position: 'Technical Director' }
    ];

    const seededConsultantsUsers = await ClientUser.insertMany(consultantsUserData);
    console.log(`Seeded ${seededConsultantsUsers.length} consultant user login accounts.`);

    const consultantProfilesData = seededConsultantsUsers.map((userDoc, index) => {
      // Rotate through departments 0-9
      const deptDoc = seededDepts[index % seededDepts.length];
      
      // Give them expertise relevant to the department
      const mockExpertise = [deptDoc.categories[0], deptDoc.categories[1] || 'General'];

      return {
        user: userDoc._id,
        phone: userDoc.phoneNumber,
        expertise: mockExpertise,
        department: deptDoc._id,
        categories: deptDoc.categories,
        employeeId: userDoc.employeeCode,
        joiningDate: new Date(Date.now() - (365 * 24 * 60 * 60 * 1000) * (index + 1)), // 1-10 years ago
        isActive: true
      };
    });

    const seededProfiles = await ConsultantProfile.insertMany(consultantProfilesData);
    console.log(`Seeded ${seededProfiles.length} consultant profiles mapping to departments.`);

    // 6. Seed Super Admin User (to ensure a super admin is always available to test)
    console.log('Seeding Super Admin...');
    await ClientUser.create({
      email: 'astplticket@akshay.com',
      password: hashedPassword,
      name: 'Akshay Ticketing',
      employeeCode: '0000',
      role: 'superadmin'
    });
    console.log('Super Admin account created.');

    console.log('\n======================================================');
    console.log('🎉 Database seeding completed successfully!');
    console.log('======================================================');
    console.log(`- Departments : ${seededDepts.length}`);
    console.log(`- Clients     : ${seededClients.length}`);
    console.log(`- Client Users: ${seededClientUsers.length}`);
    console.log(`- Consultants : ${seededProfiles.length}`);
    console.log('- Super Admin : 1 (astplticket@akshay.com)');
    console.log('------------------------------------------------------');
    console.log('Credential password for all seeded accounts is: 123456');
    console.log('======================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
