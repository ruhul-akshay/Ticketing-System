/**
 * asyncHandler — Wraps an async Express route handler so that any
 * rejected promise is forwarded to the centralized error middleware
 * via `next(err)`.  This eliminates the need for try/catch in every
 * controller method.
 *
 * Usage:
 *   export const getTickets = asyncHandler(async (req, res) => {
 *     const tickets = await ticketService.getTickets(req.user);
 *     res.json(tickets);
 *   });
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
