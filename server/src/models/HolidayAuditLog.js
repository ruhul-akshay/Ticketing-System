import mongoose from 'mongoose';

const holidayAuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'WEEKEND_GENERATE']
  },
  details: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

holidayAuditLogSchema.index({ timestamp: -1 });

export default mongoose.model('HolidayAuditLog', holidayAuditLogSchema);
