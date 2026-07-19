import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser',
    required: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  type: {
    type: String,
    enum: ['casual', 'sick', 'earned'],
    required: [true, 'Leave type is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reason: {
    type: String,
    trim: true,
    required: [true, 'Reason for leave is required']
  }
}, { timestamps: true });

leaveRequestSchema.index({ user: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model('LeaveRequest', leaveRequestSchema);
