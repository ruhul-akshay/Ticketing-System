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

  assignedConsultants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser'
  }],

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },

  /* ===== STATUS & PRIORITY ===== */
  status: {
    type: String,
    enum: [
      'open', 'pending', 'assigned', 'resolved', 'closed', 'cancelled', 'hold', 'on hold',
      'Open', 'Pending', 'Assigned', 'Resolved', 'Closed', 'Cancelled', 'Hold', 'On Hold'
    ],
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

  /* ===== OPENED BY STATUS ===== */
  openedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser',
    default: []
  }],

  /* ===== INTERNAL TICKETS SPECIFIC FIELDS ===== */
  isInternal: {
    type: Boolean,
    default: false
  },
  
  isVisibleToClient: {
    type: Boolean,
    default: false
  },

  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    default: null
  },

  clientUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientUser',
    default: null
  },

  /* ===== TIMESTAMPS ===== */
  createdAt: {
    type: Date,
    default: Date.now
  }

});

// ── Database Indexes ──────────────────────────────────────────────────────────
// These indexes mirror the most common query patterns for tickets.
// Without indexes, every query does a full collection scan (O(n)), which
// degrades severely as the ticket count grows into the thousands.

// Most common: filter by status with date ordering (dashboard, kanban, reports)
ticketSchema.index({ status: 1, createdAt: -1 });

// Consultant's ticket list: "show me my assigned open tickets"
ticketSchema.index({ assignedTo: 1, status: 1 });

// Client user's ticket list: "show me tickets I created"
ticketSchema.index({ createdBy: 1, createdAt: -1 });

// Department-level filtering (routing rules, department reports)
ticketSchema.index({ department: 1, status: 1 });

// Internal vs external ticket filtering (consultant internal tickets)
ticketSchema.index({ isInternal: 1, status: 1, createdAt: -1 });

// Client-scoped ticket queries
ticketSchema.index({ client: 1, status: 1 });

export default mongoose.model('Ticket', ticketSchema);