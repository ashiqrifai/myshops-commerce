const db = require("../models");
const AppError = require("../utils/AppError");

const {
  verifyAccessToken,
} = require("../modules/auth/auth.utils");

const authenticate = async (req, res, next) => {
  try {
    const authorization =
      req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      throw new AppError(
        "Authentication token is required.",
        401,
        "AUTHENTICATION_REQUIRED"
      );
    }

    const token = authorization.substring(7).trim();

    let payload;

    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      throw new AppError(
        "Authentication token is invalid or expired.",
        401,
        "INVALID_ACCESS_TOKEN"
      );
    }

    if (
      payload.type !== "ACCESS" ||
      !payload.sub ||
      !payload.companyId
    ) {
      throw new AppError(
        "Authentication token is invalid.",
        401,
        "INVALID_ACCESS_TOKEN"
      );
    }

    const user = await db.User.findOne({
      where: {
        id: payload.sub,
        companyId: payload.companyId,
        status: "ACTIVE",
        isActive: true,
      },
      attributes: [
        "id",
        "companyId",
        "firstName",
        "lastName",
        "email",
        "username",
        "status",
        "isSuperAdmin",
      ],
    });

    if (!user) {
      throw new AppError(
        "Authenticated user is not available.",
        401,
        "USER_NOT_AVAILABLE"
      );
    }

    req.user = user.get({ plain: true });
    req.context = {
      ...(req.context || {}),
      userId: user.id,
      companyId: user.companyId,
      channel: "ADMIN",
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;