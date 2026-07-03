import mongoose from 'mongoose';

const ccEmailConfigSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    client_created: {
      type: Boolean,
      default: false
    },
    client_user_created: {
      type: Boolean,
      default: false
    },
    ticket_created: {
      type: Boolean,
      default: false
    },
    ticket_status_updated: {
      type: Boolean,
      default: false
    },
    ticket_assigned: {
      type: Boolean,
      default: false
    },
    ticket_closed: {
      type: Boolean,
      default: false
    },
    password_reset: {
      type: Boolean,
      default: false
    },
    new_message: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('CcEmailConfig', ccEmailConfigSchema);
