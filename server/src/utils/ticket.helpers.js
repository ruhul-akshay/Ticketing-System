import mongoose from 'mongoose';
import multer from 'multer';
import Ticket from '../models/Ticket.js';
import Department from '../models/Department.js';

export const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 10
  }
});

import Client from '../models/Client.js';

export const generateClientInitials = async (clientName, excludeClientId = null) => {
  if (!clientName) return 'GP';

  // Clean client name: remove special characters, trim, capitalize
  const cleanName = clientName.replace(/[^a-zA-Z0-9\s]/g, '').trim().toUpperCase();
  const words = cleanName.split(/\s+/).filter(Boolean);
  
  let initials = '';
  
  if (words.length > 1) {
    // Multi-word name: take first letter of each word (first two words)
    initials = words[0][0] + words[1][0];
  } else if (words.length === 1 && words[0].length >= 2) {
    // Single-word name: take first two letters
    initials = words[0].substring(0, 2);
  } else if (words.length === 1 && words[0].length === 1) {
    initials = words[0] + 'X'; // fallback if name is 1 character
  } else {
    initials = 'GP'; // general fallback
  }

  // Ensure initials is exactly 2 characters and uppercase
  initials = initials.toUpperCase();
  if (initials.length < 2) {
    initials = (initials + 'X').substring(0, 2);
  }

  // Get all existing clients to verify uniqueness
  const query = {};
  if (excludeClientId) {
    query._id = { $ne: excludeClientId };
  }
  const existingClients = await Client.find(query).lean();
  const usedInitials = existingClients.map(c => c.initials).filter(Boolean);

  if (!usedInitials.includes(initials)) {
    return initials;
  }

  // Collision resolution: differentiate using alternate letters from their names (e.g. first and third letter)
  const fullRawText = words.join('');
  
  // Try first letter + subsequent letters (1st and 3rd, 1st and 4th, etc.)
  for (let i = 2; i < fullRawText.length; i++) {
    const candidate = (fullRawText[0] + fullRawText[i]).toUpperCase();
    if (!usedInitials.includes(candidate)) {
      return candidate;
    }
  }

  // Try second letter + subsequent letters, etc.
  for (let i = 0; i < fullRawText.length; i++) {
    for (let j = i + 1; j < fullRawText.length; j++) {
      const candidate = (fullRawText[i] + fullRawText[j]).toUpperCase();
      if (!usedInitials.includes(candidate)) {
        return candidate;
      }
    }
  }

  // Fallback to first letter + character from alphabet
  const firstLetter = fullRawText[0] || 'C';
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (const char of alphabet) {
    const candidate = (firstLetter + char).toUpperCase();
    if (!usedInitials.includes(candidate)) {
      return candidate;
    }
  }

  // Absolute fallback
  for (let code1 = 65; code1 <= 90; code1++) {
    for (let code2 = 65; code2 <= 90; code2++) {
      const candidate = String.fromCharCode(code1, code2);
      if (!usedInitials.includes(candidate)) {
        return candidate;
      }
    }
  }

  return initials;
};

export const migrateClientInitials = async () => {
  console.log('🔄 Running Client Initials Migration...');
  const clients = await Client.find({ 
    $or: [
      { initials: { $exists: false } }, 
      { initials: null }, 
      { initials: '' }
    ] 
  });
  for (const client of clients) {
    const initials = await generateClientInitials(client.name, client._id);
    client.initials = initials;
    await client.save();
    console.log(`✅ Set initials for Client "${client.name}" to "${initials}"`);
  }
};

export const generateTicketNumber = async (departmentId, clientId, isInternal = false) => {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  
  let clientInitial = 'GP';
  if (isInternal) {
    clientInitial = 'AS';
  } else if (clientId && isValidObjectId(clientId)) {
    const client = await Client.findById(clientId).lean();
    if (client?.initials) {
      clientInitial = client.initials;
    }
  }

  const count = await Ticket.countDocuments();
  const seqStr = String(count).padStart(3, '0');

  return `T${yy}${mm}${dd}${clientInitial}${seqStr}`;
};


