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
    ref: 'ClientUser',
    required: true
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser'
  },

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },

  /* ===== STATUS & PRIORITY ===== */
  status: {
    type: String,
    enum: ['pending', 'assigned', 'resolved', 'closed', 'cancelled', 'hold', 'on hold'],
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
      ref: 'ClientUser'
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
    }],
    isInternal: {
      type: Boolean,
      default: false
    }
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
    ref: 'ClientUser'
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
      ref: 'ClientUser'
    }
  }],

  // Track how many hours have already been deducted from client cap
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
      ref: 'ClientUser'
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

  /* ===== ASSIGNMENT HISTORY ===== */
  assignmentHistory: [{
    action: {
      type: String,
      enum: ['initial_assignment', 'assign', 'forward'],
      required: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientUser'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientUser'
    },
    forwardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientUser'
    },
    forwardedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientUser'
    },
    actionDate: {
      type: Date,
      default: Date.now
    },
    remarks: {
      type: String
    }
  }],

  /* ===== CC RECIPIENTS ===== */
  ccEmails: {
    type: [String],
    default: []
  },

  /* ===== ERP INCIDENT TYPE ===== */
  erpIncidentType: {
    type: String,
    default: null
  },

  /* ===== TIMESTAMPS ===== */
  createdAt: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model('Ticket', ticketSchema);