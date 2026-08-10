const db = require("../models");
const AppError = require("../utils/AppError");

const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError(
          "Authentication is required.",
          401,
          "AUTHENTICATION_REQUIRED"
        );
      }

      if (req.user.isSuperAdmin) {
        return next();
      }

      const user = await db.User.findByPk(req.user.id, {
        include: [
          {
            model: db.Role,
            as: "roles",
            through: {
              attributes: [],
            },
            where: {
              isActive: true,
            },
            required: false,
            include: [
              {
                model: db.Permission,
                as: "permissions",
                through: {
                  attributes: [],
                },
                where: {
                  isActive: true,
                },
                required: false,
              },
            ],
          },
        ],
      });

      const grantedPermissions = new Set(
        (user.roles || []).flatMap((role) =>
          (role.permissions || []).map(
            (permission) => permission.code
          )
        )
      );

      const hasPermission = requiredPermissions.every(
        (permission) =>
          grantedPermissions.has(permission)
      );

      if (!hasPermission) {
        throw new AppError(
          "You do not have permission to perform this action.",
          403,
          "FORBIDDEN"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authorize;