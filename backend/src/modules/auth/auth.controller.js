const authService = require("./auth.service");

const getRefreshTokenFromRequest = (req) => {
  return (
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    null
  );
};

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/api/v1/admin/auth",
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",
    path: "/api/v1/admin/auth",
  });
};

exports.login = async (req, res, next) => {
  try {
    const result = await authService.login({
      companyCode: req.body.companyCode,
      login: req.body.login,
      password: req.body.password,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const currentRefreshToken =
      getRefreshTokenFromRequest(req);

    const result = await authService.refresh({
      refreshToken: currentRefreshToken,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    clearRefreshTokenCookie(res);
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken =
      getRefreshTokenFromRequest(req);

    await authService.logout(refreshToken);

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

exports.logoutAll = async (req, res, next) => {
  try {
    await authService.logoutAll(req.user.id);

    clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: "Logged out from all devices successfully.",
    });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};