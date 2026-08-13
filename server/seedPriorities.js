import Priority from './src/models/Priority.js';

const seedPriorities = async () => {
  const count = await Priority.countDocuments();
  if (count === 0) {
    await Priority.insertMany([
      { name: 'Low', level: 1, color: '#28a745' },
      { name: 'Medium', level: 2, color: '#ffc107' },
      { name: 'High', level: 3, color: '#dc3545' }
    ]);
    console.log('Default priorities created');
  }
};

export default seedPriorities;