import * as XLSX from 'xlsx';

/**
 * Format a Date object or ISO string into separate { dateStr, timeStr }
 */
export function formatDateTimeSplit(dateInput) {
  if (!dateInput) return { dateStr: '', timeStr: '' };
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return { dateStr: '', timeStr: '' };

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const timeStr = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    return { dateStr, timeStr };
  } catch {
    return { dateStr: '', timeStr: '' };
  }
}

/**
 * Exports ticket array to an Excel (.xlsx) file with proper column alignment,
 * column widths, and separate Creation Date & Creation Time columns.
 */
export function exportTicketsToExcel(tickets, filenamePrefix = 'tickets_export') {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    alert('No tickets available to export.');
    return;
  }

  const rows = [];

  // Table Headers
  const headers = [
    'Ticket Number',
    'Title',
    'Description',
    'Client',
    'Department',
    'Category',
    'Status',
    'Priority',
    'Reporter',
    'Assigned To',
    'Creation Date',
    'Creation Time',
    'Updated Date',
    'Updated Time',
    'Work Logs (Hours)',
    'Resolution'
  ];

  rows.push(headers);

  tickets.forEach((t) => {
    const orig = t.original || t;
    const totalLogsHours = (orig.workLogs || t.workLogs || []).reduce(
      (sum, log) => sum + (Number(log.hours) || 0),
      0
    );

    const createdDT = formatDateTimeSplit(t.createdAt || orig.createdAt);
    const updatedDT = formatDateTimeSplit(t.updatedAt || orig.updatedAt);

    const description = (t.description || orig.description || '').replace(/\r\n/g, '\n').trim();
    const solution = (t.solution || orig.solution || '').replace(/\r\n/g, '\n').trim();

    const row = [
      String(t.ticketNumber || orig.ticketNumber || t.id || t._id || ''),
      String(t.title || ''),
      description,
      String(t.clientName || orig.createdBy?.clientName || orig.createdBy?.client?.name || '—'),
      String(typeof t.department === 'string' ? t.department : (t.department?.name || orig.department?.name || '—')),
      String(t.category || orig.category || '—'),
      String(t.status || ''),
      String(t.priority || ''),
      String(t.user || orig.createdBy?.name || '—'),
      String(t.assignee || orig.assignedTo?.name || 'Unassigned'),
      createdDT.dateStr,
      createdDT.timeStr,
      updatedDT.dateStr,
      updatedDT.timeStr,
      totalLogsHours > 0 ? Number(totalLogsHours.toFixed(1)) : 0,
      solution
    ];

    rows.push(row);
  });

  // Create sheet from 2D array
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set explicit column widths for perfect columnwise alignment in Excel
  ws['!cols'] = [
    { wch: 18 }, // Ticket Number
    { wch: 32 }, // Title
    { wch: 45 }, // Description
    { wch: 22 }, // Client
    { wch: 20 }, // Department
    { wch: 18 }, // Category
    { wch: 14 }, // Status
    { wch: 12 }, // Priority
    { wch: 20 }, // Reporter
    { wch: 20 }, // Assigned To
    { wch: 15 }, // Creation Date
    { wch: 16 }, // Creation Time
    { wch: 15 }, // Updated Date
    { wch: 16 }, // Updated Time
    { wch: 18 }, // Work Logs (Hours)
    { wch: 35 }  // Resolution
  ];

  // Create workbook and write .xlsx file
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tickets');

  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}_${todayStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}

/**
 * Exports a dataset (array of objects or array of arrays) to Excel (.xlsx)
 */
export function exportToExcel(sheets, filename = 'export.xlsx') {
  const wb = XLSX.utils.book_new();

  if (Array.isArray(sheets)) {
    sheets.forEach((sheetObj, index) => {
      const name = sheetObj.name || `Sheet${index + 1}`;
      const data = sheetObj.data || [];
      const ws = Array.isArray(data[0])
        ? XLSX.utils.aoa_to_sheet(data)
        : XLSX.utils.json_to_sheet(data);
      if (sheetObj.cols) ws['!cols'] = sheetObj.cols;
      XLSX.utils.book_append_sheet(wb, ws, name);
    });
  }

  const finalName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, finalName);
}
