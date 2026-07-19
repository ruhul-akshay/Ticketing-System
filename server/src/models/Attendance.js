import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'leave', 'holiday', 'half-day-holiday', 'weekend'],
    required: true
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  duration: {
    type: Number // In minutes
  },
  remarks: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Ensure one entry per user per day (using just date truncated to midnight)
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

export default mongoose.model('Attendance', attendanceSchema);
