const bcrypt = require("bcryptjs");

const db = require("../../models");
const AppError = require("../../utils/AppError");

const {
  hashToken,
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  decodeTokenExpiration,
} = require("./auth.utils");

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

const loadUserWithAccess = async (userId) => {
  return db.User.findByPk(userId, {
    include: [
      {
        model: db.Company,
        as: "company",
        attributes: [
          "id",
          "name",
          "code",
          "currency",
          "timezone",
          "logoUrl",
          "isActive",
        ],
      },
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
};

const serializeUser = (user) => {
  const plainUser = user.get({ plain: true });

  const roles = plainUser.roles || [];

  const permissions = [
    ...new Set(
      roles.flatMap((role) =>
        (role.permissions || []).map((permission) => permission.code)
      )
    ),
  ];

  return {
    id: plainUser.id,
    companyId: plainUser.companyId,
    firstName: plainUser.firstName,
    lastName: plainUser.lastName,
    fullName: [plainUser.firstName, plainUser.lastName]
      .filter(Boolean)
      .join(" "),
    email: plainUser.email,
    username: plainUser.username,
    mobile: plainUser.mobile,
    avatarUrl: plainUser.avatarUrl,
    status: plainUser.status,
    isSuperAdmin: plainUser.isSuperAdmin,
    lastLoginAt: plainUser.lastLoginAt,
    company: plainUser.company,
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      code: role.code,
    })),
    permissions,
  };
};

const saveRefreshToken = async ({
  userId,
  token,
  tokenId,
  ipAddress,
  userAgent,
  transaction,
}) => {
  await db.RefreshToken.create(
    {
      userId,
      tokenId,
      tokenHash: hashToken(token),
      expiresAt: decodeTokenExpiration(token),
      ipAddress,
      userAgent,
      isActive: true,
    },
    {
      transaction,
    }
  );
};

const login = async ({
  companyCode,
  login,
  password,
  ipAddress,
  userAgent,
}) => {
  const company = await db.Company.findOne({
    where: {
      code: companyCode.trim().toUpperCase(),
      isActive: true,
    },
  });

  if (!company) {
    throw new AppError(
      "Invalid company or login credentials.",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  const normalizedLogin = login.trim().toLowerCase();

  const user = await db.User.findOne({
    where: {
      companyId: company.id,
      isActive: true,
      [db.sequelize.Sequelize.Op.or]: [
        {
          email: normalizedLogin,
        },
        {
          username: normalizedLogin,
        },
      ],
    },
  });

  if (!user) {
    throw new AppError(
      "Invalid company or login credentials.",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  if (user.status === "INACTIVE") {
    throw new AppError(
      "Your account is inactive.",
      403,
      "USER_INACTIVE"
    );
  }

  if (
    user.status === "LOCKED" &&
    user.lockedUntil &&
    new Date(user.lockedUntil) > new Date()
  ) {
    throw new AppError(
      "Your account is temporarily locked. Please try again later.",
      423,
      "USER_TEMPORARILY_LOCKED"
    );
  }

  if (
    user.status === "LOCKED" &&
    (!user.lockedUntil || new Date(user.lockedUntil) <= new Date())
  ) {
    user.status = "ACTIVE";
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;

    await user.save();
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    const failedLoginAttempts = user.failedLoginAttempts + 1;

    const updateValues = {
      failedLoginAttempts,
    };

    if (failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      updateValues.status = "LOCKED";
      updateValues.lockedUntil = new Date(
        Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000
      );
    }

    await user.update(updateValues);

    throw new AppError(
      "Invalid company or login credentials.",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  const transaction = await db.sequelize.transaction();

  try {
    await user.update(
      {
        failedLoginAttempts: 0,
        lockedUntil: null,
        status:
          user.status === "LOCKED"
            ? "ACTIVE"
            : user.status,
        lastLoginAt: new Date(),
      },
      {
        transaction,
      }
    );

    const accessToken = createAccessToken(user);

    const {
      token: refreshToken,
      tokenId,
    } = createRefreshToken(user);

    await saveRefreshToken({
      userId: user.id,
      token: refreshToken,
      tokenId,
      ipAddress,
      userAgent,
      transaction,
    });

    await transaction.commit();

    const hydratedUser = await loadUserWithAccess(user.id);

    return {
      user: serializeUser(hydratedUser),
      accessToken,
      refreshToken,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const refresh = async ({
  refreshToken,
  ipAddress,
  userAgent,
}) => {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AppError(
      "Refresh token is invalid or expired.",
      401,
      "INVALID_REFRESH_TOKEN"
    );
  }

  if (
    payload.type !== "REFRESH" ||
    !payload.sub ||
    !payload.jti
  ) {
    throw new AppError(
      "Refresh token is invalid.",
      401,
      "INVALID_REFRESH_TOKEN"
    );
  }

  const storedToken = await db.RefreshToken.findOne({
    where: {
      tokenId: payload.jti,
      tokenHash: hashToken(refreshToken),
      userId: payload.sub,
      isActive: true,
      revokedAt: null,
    },
  });

  if (
    !storedToken ||
    new Date(storedToken.expiresAt) <= new Date()
  ) {
    throw new AppError(
      "Refresh token is invalid or expired.",
      401,
      "INVALID_REFRESH_TOKEN"
    );
  }

  const user = await db.User.findOne({
    where: {
      id: payload.sub,
      companyId: payload.companyId,
      status: "ACTIVE",
      isActive: true,
    },
  });

  if (!user) {
    throw new AppError(
      "User is no longer available.",
      401,
      "USER_NOT_AVAILABLE"
    );
  }

  const transaction = await db.sequelize.transaction();

  try {
    const {
      token: newRefreshToken,
      tokenId: newTokenId,
    } = createRefreshToken(user);

    await storedToken.update(
      {
        isActive: false,
        revokedAt: new Date(),
        replacedByTokenId: newTokenId,
      },
      {
        transaction,
      }
    );

    await saveRefreshToken({
      userId: user.id,
      token: newRefreshToken,
      tokenId: newTokenId,
      ipAddress,
      userAgent,
      transaction,
    });

    const accessToken = createAccessToken(user);

    await transaction.commit();

    const hydratedUser = await loadUserWithAccess(user.id);

    return {
      user: serializeUser(hydratedUser),
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const logout = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    return;
  }

  await db.RefreshToken.update(
    {
      isActive: false,
      revokedAt: new Date(),
    },
    {
      where: {
        tokenId: payload.jti,
        userId: payload.sub,
        tokenHash: hashToken(refreshToken),
        isActive: true,
      },
    }
  );
};

const logoutAll = async (userId) => {
  await db.RefreshToken.update(
    {
      isActive: false,
      revokedAt: new Date(),
    },
    {
      where: {
        userId,
        isActive: true,
      },
    }
  );
};

const getCurrentUser = async (userId) => {
  const user = await loadUserWithAccess(userId);

  if (!user || !user.isActive || user.status !== "ACTIVE") {
    throw new AppError(
      "User is not available.",
      401,
      "USER_NOT_AVAILABLE"
    );
  }

  return serializeUser(user);
};

module.exports = {
  login,
  refresh,
  logout,
  logoutAll,
  getCurrentUser,
};