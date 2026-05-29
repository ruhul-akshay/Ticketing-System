import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const departmentSchema = new mongoose.Schema({
  name: String,
  categories: [String]
}, { strict: false });

const Department = mongoose.model('Department', departmentSchema);

async function addCat() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const dep = await Department.findOne({ name: 'IT' });
    if (dep) {
      dep.categories = ['Hardware Issues', 'Network Failure'];
      await dep.save();
      console.log('Categories added to IT');
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
addCat();
