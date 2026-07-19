import mongoose from 'mongoose';

const weekendConfigSchema = new mongoose.Schema({
  financialYear: {
    type: String,
    required: [true, 'Financial Year is required'],
    unique: true,
    trim: true
  },
  daysConfig: {
    type: [{
      day: { type: Number, required: true },
      type: { type: String, enum: ['full', 'half'], default: 'full' }
    }],
    default: [
      { day: 0, type: 'full' },
      { day: 6, type: 'full' }
    ]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser'
  }
}, { timestamps: true });

export default mongoose.model('WeekendConfig', weekendConfigSchema);
