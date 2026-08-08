/**
 * Higher-order middleware that checks if user has required role(s)
 * @param {string[]} allowedRoles - Array of allowed roles (e.g., ['owner', 'software_engineer'])
 * @returns {Function} Express middleware
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
}

/**
 * Middleware that requires Owner or Software Engineer role
 */
function requireOwnerOrSoftwareEngineer(req, res, next) {
  return requireRole(['owner', 'software_engineer'])(req, res, next);
}

/**
 * Middleware that requires Admin or higher role
 */
function requireAdminOrHigher(req, res, next) {
  return requireRole(['admin', 'software_engineer', 'owner'])(req, res, next);
}

module.exports = {
  requireRole,
  requireOwnerOrSoftwareEngineer,
  requireAdminOrHigher,
};
