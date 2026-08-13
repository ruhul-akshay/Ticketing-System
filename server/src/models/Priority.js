import mongoose from 'mongoose';

const prioritySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    level: {
      type: Number,
      required: true
    },
    color: {
      type: String,
      default: '#6c757d'
    },
    description: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Priority', prioritySchema);