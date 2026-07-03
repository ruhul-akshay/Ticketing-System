import mongoose from 'mongoose';

const preAssignmentRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true
  },
  conditionType: {
    type: String,
    enum: ['clientUser', 'client', 'department', 'erpIncidentType'],
    required: [true, 'Condition type is required']
  },
  clientUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser',
    default: null
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    default: null
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  categories: [{
    type: String,
    trim: true
  }],
  erpIncidentType: [{
    type: String,
    trim: true
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser',
    required: [true, 'Assigned Consultant is required']
  },
  ccConsultants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser'
  }],
  evaluationOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

preAssignmentRuleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('PreAssignmentRule', preAssignmentRuleSchema);
