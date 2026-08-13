import * as attendanceService from '../services/attendance.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const checkIn = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.performCheckIn(req.user._id, req.body.remarks);
  res.status(201).json({ success: true, attendance });
});

export const checkOut = asyncHandler(async (req, res) => {
  const attendance = await attendanceService.performCheckOut(req.user._id);
  res.json({ success: true, attendance });
});

export const requestLeave = asyncHandler(async (req, res) => {
  const leave = await attendanceService.performRequestLeave(req.user._id, req.body);
  res.status(201).json({ success: true, leave });
});

export const getMonthlySummary = asyncHandler(async (req, res) => {
  const userId = req.query.userId || req.user._id;
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const result = await attendanceService.calculateMonthlySummary(userId, year, req.query.month);
  
  res.json({
    success: true,
    summary: result.summary,
    attendanceList: result.attendanceList
  });
});

export const getAllLeaves = asyncHandler(async (req, res) => {
  const leaves = await attendanceService.fetchAllLeaves(req.query.status, req.query.search);
  res.json({ success: true, leaves });
});

export const approveLeave = asyncHandler(async (req, res) => {
  const leave = await attendanceService.updateLeaveStatus(req.params.id, req.body.status);
  res.json({ success: true, leave, message: `Leave request has been ${req.body.status}.` });
});

export const getMyLeaves = asyncHandler(async (req, res) => {
  const leaves = await attendanceService.fetchMyLeaves(req.user._id);
  res.json({ success: true, leaves });
});
