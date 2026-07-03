import * as clientService from '../services/client.service.js';

export const getClients = async (req, res) => {
  try {
    const result = await clientService.getClients(req.user, req.query);
    res.json({
      success: true,
      clients: result.clients,
      pagination: {
        page: parseInt(req.query.page || 1),
        limit: parseInt(req.query.limit || 10),
        total: result.total,
        pages: Math.ceil(result.total / (req.query.limit || 10))
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch clients',
      error: error.message
    });
  }
};

export const getMyClient = async (req, res) => {
  try {
    const result = await clientService.getMyClient(req.user);
    res.json({
      success: true,
      client: result.client,
      userTickets: result.userTickets
    });
  } catch (error) {
    console.error('Error fetching my client:', error);
    if (error.message.includes('not assigned')) {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch client details',
        error: error.message
      });
    }
  }
};

export const getClient = async (req, res) => {
  try {
    const result = await clientService.getClientDetails(req.params.id);
    res.json({
      success: true,
      client: result.client,
      employees: result.employees,
      tickets: result.tickets,
      stats: result.stats
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    if (error.message === 'Client not found') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch client details',
        error: error.message
      });
    }
  }
};

export const createClient = async (req, res) => {
  try {
    const client = await clientService.createClient(req.user, req.body);
    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      client
    });
  } catch (error) {
    console.error('Error creating client:', error);
    if (error.message.includes('required') || error.message.includes('already exists') || error.message.includes('Date') || error.message.includes('Invalid ERP')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create client',
        error: error.message
      });
    }
  }
};

export const updateClientPut = async (req, res) => {
  try {
    const client = await clientService.updateClientPut(req.user, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Client updated successfully',
      client
    });
  } catch (error) {
    console.error('Error updating client (put):', error);
    if (error.message === 'Client not found') {
      res.status(404).json({ success: false, message: error.message });
    } else if (error.message.includes('required') || error.message.includes('Date')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update client',
        error: error.message
      });
    }
  }
};

export const updateClientPatch = async (req, res) => {
  try {
    const client = await clientService.updateClientPatch(req.user, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Client updated successfully',
      client
    });
  } catch (error) {
    console.error('Error updating client (patch):', error);
    if (error.message === 'Client not found') {
      res.status(404).json({ success: false, message: error.message });
    } else if (error.message.includes('required') || error.message.includes('Date')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update client',
        error: error.message
      });
    }
  }
};

export const deleteClient = async (req, res) => {
  try {
    await clientService.deleteClient(req.params.id);
    res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    if (error.message === 'Client not found') {
      res.status(404).json({ success: false, message: error.message });
    } else if (error.message.includes('existing')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete client',
        error: error.message
      });
    }
  }
};

export const refreshAnalytics = async (req, res) => {
  try {
    const result = await clientService.refreshClientAnalytics(req.user);
    res.json({
      success: true,
      message: `Successfully refreshed analytics for ${result.clientsCount} clients`,
      clientCount: result.clientsCount,
      errors: result.errors.length > 0 ? result.errors : undefined
    });
  } catch (error) {
    console.error('Error refreshing clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh clients',
      error: error.message
    });
  }
};

export const getStatsOverview = async (req, res) => {
  try {
    const result = await clientService.getClientStatsOverview();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error fetching client statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client statistics',
      error: error.message
    });
  }
};

export const getERPTypes = async (req, res) => {
  try {
    const result = await clientService.getERPSystemTypes();
    res.json({
      success: true,
      erpTypes: result.erpCounts,
      totalTypes: result.totalTypes
    });
  } catch (error) {
    console.error('Error fetching ERP types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ERP types',
      error: error.message
    });
  }
};

export const searchClientNames = async (req, res) => {
  try {
    const clients = await clientService.searchClientNames(req.query.query);
    res.json({
      success: true,
      clients
    });
  } catch (error) {
    console.error('Error searching client names:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search client names',
      error: error.message
    });
  }
};

export const bulkUpdateStatus = async (req, res) => {
  try {
    const count = await clientService.bulkUpdateClientStatus(req.user, req.body);
    res.json({
      success: true,
      message: `Updated ${count} clients to ${req.body.status} status`,
      modifiedCount: count
    });
  } catch (error) {
    console.error('Error bulk updating client status:', error);
    if (error.message.includes('required')) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update client status',
        error: error.message
      });
    }
  }
};

export const exportCSV = async (req, res) => {
  try {
    const csvContent = await clientService.exportClientsCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=clients_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting clients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export clients',
      error: error.message
    });
  }
};

export const renewSupport = async (req, res) => {
  try {
    const client = await clientService.renewClientSupportContract(req.user, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Support contract renewed successfully',
      client
    });
  } catch (error) {
    console.error('Error renewing client contract:', error);
    if (error.message === 'Client not found') {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to renew contract',
        error: error.message
      });
    }
  }
};
