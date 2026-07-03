import Ticket from '../models/Ticket.js';

export const getDashboardStats = async (currentUser) => {
  let query = {};

  if ((currentUser.role === 'consultant' || currentUser.role === 'admin') && currentUser.department) {
    query.department = currentUser.department;
  }

  const totalTokens = await Ticket.countDocuments(query);
  const pendingTokens = await Ticket.countDocuments({ ...query, status: 'pending' });
  const assignedTokens = await Ticket.countDocuments({ ...query, status: 'assigned' });
  const resolvedTokens = await Ticket.countDocuments({ ...query, status: 'resolved' });

  const solverStats = await Ticket.aggregate([
    { $match: { status: 'resolved', ...query } },
    {
      $group: {
        _id: '$solvedBy',
        tokensSolved: { $sum: 1 },
        avgTimeToSolve: { $avg: '$timeToSolve' },
        totalTimeSpent: { $sum: '$timeToSolve' }
      }
    },
    {
      $lookup: {
        from: 'clientusers',
        localField: '_id',
        foreignField: '_id',
        as: 'solver'
      }
    },
    { $unwind: '$solver' },
    {
      $project: {
        solverName: '$solver.name',
        solverEmail: '$solver.email',
        tokensSolved: 1,
        avgTimeToSolve: 1,
        totalTimeSpent: 1
      }
    }
  ]);

  let recentTokensQuery = Ticket.find().populate(['createdBy', 'solvedBy', 'assignedTo', 'department']).sort({ createdAt: -1 }).limit(10);
  if ((currentUser.role === 'consultant' || currentUser.role === 'admin') && currentUser.department) {
    recentTokensQuery = recentTokensQuery.where('department').equals(currentUser.department);
  }
  const recentTokens = await recentTokensQuery;

  return {
    overview: {
      totalTokens,
      pendingTokens,
      assignedTokens,
      resolvedTokens
    },
    solverStats,
    recentTokens
  };
};
