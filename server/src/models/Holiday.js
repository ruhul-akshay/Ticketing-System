import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Holiday name is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Holiday date is required'],
    unique: true
  },
  type: {
    type: String,
    enum: ['full', 'half', 'weekend', 'half-weekend'],
    default: 'full'
  },
  financialYear: {
    type: String,
    required: [true, 'Financial Year is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser'
  }
}, { timestamps: true });

holidaySchema.index({ financialYear: 1 });

export default mongoose.model('Holiday', holidaySchema);
