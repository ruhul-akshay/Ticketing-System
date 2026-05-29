import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const departmentSchema = new mongoose.Schema({
  name: String,
  categories: mongoose.Schema.Types.Mixed
}, { strict: false });

const Department = mongoose.model('Department', departmentSchema);

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const deps = await Department.find().limit(3).lean();
    console.log(JSON.stringify(deps, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
test();
