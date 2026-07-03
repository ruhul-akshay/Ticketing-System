import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  employeeCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  clientName: {
    type: String,
    trim: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  role: {
    type: String,
    enum: ['clientuser', 'consultant', 'superadmin'],
    default: 'clientuser'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'frozen'],
    default: 'active'
  },
  statusReason: {
    type: String,
    trim: true
  },
  statusChangedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser'
  },
  statusChangedAt: {
    type: Date
  },
  lastLogin: {
    type: Date
  },

  isFirstLogin: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  preferences: {
    theme: {
      type: String,
      enum: ['dark', 'light', 'system'],
      default: 'dark'
    },
    primaryColor: {
      type: String,
      default: 'indigo'
    },
    accentColor: {
      type: String,
      default: 'blue'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    autoRefreshInterval: {
      type: Number,
      default: 4
    },
    soundEnabled: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser'
  },
  readNotifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }],
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser'
  }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for better query performance
userSchema.index({ clientName: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ department: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1, status: 1 }); // Added for better filtering

export default mongoose.model('ClientUser', userSchema);