// models/Ticket.js
import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  /* ===== IDENTIFIERS ===== */
  ticketNumber: {
    type: String,
    unique: true,
    required: true
  },

  type: {
    type: String,
    enum: ['ticket'],
    default: 'ticket'
  },

  /* ===== BASIC DETAILS ===== */
  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  category: {
    type: String
  },

  reason: {
    type: String
  },

  /* ===== ATTACHMENTS (COMMON) ===== */
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    data: { type: Buffer, select: false }, // Store file data as Buffer
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  /* ===== TOKEN-SPECIFIC DOCUMENTS ===== */
  supportingDocuments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    data: { type: Buffer, select: false },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  /* ===== USER & DEPARTMENT ===== */
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },

  /* ===== STATUS & PRIORITY ===== */
  status: {
    type: String,
    enum: ['pending', 'assigned', 'resolved', 'closed'],
    default: 'pending'
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  /* ===== REMARKS ===== */
  remarks: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    attachments: [{
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      data: { type: Buffer, select: false }
    }]
  }],

  /* ===== RESOLUTION DETAILS ===== */
  expectedResolutionDate: {
    type: Date
  },

  actualResolutionDate: {
    type: Date
  },

  solvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  solvedAt: {
    type: Date
  },

  solution: {
    type: String
  },

  timeToSolve: {
    type: Number
  },

  /* ===== WORK LOGS ===== */
  workLogs: [{
    date: Date,
    hours: Number,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Track how many hours have already been deducted from company cap
  hoursDeducted: {
    type: Number,
    default: 0
  },

  /* ===== ADMIN ATTACHMENTS ===== */
  adminAttachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    data: { type: Buffer, select: false },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  /* ===== FEEDBACK ===== */
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },

  /* ===== TIMESTAMPS ===== */
  createdAt: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model('Ticket', ticketSchema);