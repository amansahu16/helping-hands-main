export const requireRole = (allowedRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userRole = (req.user.role || "").toLowerCase();
    const targetRole = allowedRole.toLowerCase();

    if (userRole !== targetRole) {
      return res.status(403).json({ 
        message: `Access denied. Requires role: ${allowedRole}` 
      });
    }

    next();
  };
};
