import mongoose from 'mongoose';
import multer from 'multer';
import Ticket from '../models/Ticket.js';
import Department from '../models/Department.js';

export const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10
  }
});

export const generateTicketNumber = async (departmentId) => {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  let deptInitial = 'G';

  if (departmentId && isValidObjectId(departmentId)) {
    const dept = await Department.findById(departmentId).lean();
    if (dept?.name) deptInitial = dept.name[0].toUpperCase();
  }

  const count = await Ticket.countDocuments({
    ...(departmentId && { department: departmentId })
  });

  return `T${yy}${mm}${dd}${deptInitial}${String(count + 1).padStart(3, '0')}`;
};


