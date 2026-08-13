import * as clientService from '../services/client.service.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getClients = asyncHandler(async (req, res) => {
  const result = await clientService.getClients(req.user, req.query);
  res.json({
    success: true,
    clients: result.clients,
    pagination: {
      page: parseInt(req.query.page || 1),
      limit: parseInt(req.query.limit || 1000),
      total: result.total,
      pages: Math.ceil(result.total / (req.query.limit || 1000))
    }
  });
});

export const getMyClient = asyncHandler(async (req, res) => {
  const result = await clientService.getMyClient(req.user);
  res.json({
    success: true,
    client: result.client,
    userTickets: result.userTickets
  });
});

export const getClient = asyncHandler(async (req, res) => {
  const result = await clientService.getClientDetails(req.params.id);
  res.json({
    success: true,
    client: result.client,
    employees: result.employees,
    tickets: result.tickets,
    stats: result.stats
  });
});

export const createClient = asyncHandler(async (req, res) => {
  const client = await clientService.createClient(req.user, req.body);
  res.status(201).json({
    success: true,
    message: 'Client created successfully',
    client
  });
});

export const updateClientPut = asyncHandler(async (req, res) => {
  const client = await clientService.updateClientPut(req.user, req.params.id, req.body);
  res.json({
    success: true,
    message: 'Client updated successfully',
    client
  });
});

export const updateClientPatch = asyncHandler(async (req, res) => {
  const client = await clientService.updateClientPatch(req.user, req.params.id, req.body);
  res.json({
    success: true,
    message: 'Client updated successfully',
    client
  });
});

export const deleteClient = asyncHandler(async (req, res) => {
  await clientService.deleteClient(req.params.id);
  res.json({
    success: true,
    message: 'Client deleted successfully'
  });
});

export const refreshAnalytics = asyncHandler(async (req, res) => {
  const result = await clientService.refreshClientAnalytics(req.user);
  res.json({
    success: true,
    message: `Successfully refreshed analytics for ${result.clientsCount} clients`,
    clientCount: result.clientsCount,
    errors: result.errors.length > 0 ? result.errors : undefined
  });
});

export const getStatsOverview = asyncHandler(async (req, res) => {
  const result = await clientService.getClientStatsOverview();
  res.json({
    success: true,
    ...result
  });
});

export const getERPTypes = asyncHandler(async (req, res) => {
  const result = await clientService.getERPSystemTypes();
  res.json({
    success: true,
    erpTypes: result.erpCounts,
    totalTypes: result.totalTypes
  });
});

export const searchClientNames = asyncHandler(async (req, res) => {
  const clients = await clientService.searchClientNames(req.query.query);
  res.json({
    success: true,
    clients
  });
});

export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const count = await clientService.bulkUpdateClientStatus(req.user, req.body);
  res.json({
    success: true,
    message: `Updated ${count} clients to ${req.body.status} status`,
    modifiedCount: count
  });
});

export const exportCSV = asyncHandler(async (req, res) => {
  const csvContent = await clientService.exportClientsCSV();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=clients_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csvContent);
});

export const renewSupport = asyncHandler(async (req, res) => {
  const client = await clientService.renewClientSupportContract(req.user, req.params.id, req.body);
  res.json({
    success: true,
    message: 'Support contract renewed successfully',
    client
  });
});
