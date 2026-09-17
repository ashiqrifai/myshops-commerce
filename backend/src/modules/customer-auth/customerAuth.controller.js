const service = require(
  "./customerAuth.service"
);

const companyCode = (
  req
) =>
  req.headers[
    "x-company-code"
  ] ||
  req.body
    ?.companyCode ||
  req.query
    ?.companyCode;

const refreshToken = (
  req
) =>
  req.cookies
    ?.customerRefreshToken ||
  req.body
    ?.refreshToken ||
  null;

const cookieOptions =
  () => ({
    httpOnly: true,

    secure:
      process.env.NODE_ENV ===
      "production",

    sameSite:
      process.env.NODE_ENV ===
      "production"
        ? "none"
        : "lax",

    maxAge:
      30 *
      24 *
      60 *
      60 *
      1000,

    path:
      "/api/v1/public/customer-auth",
  });

const setCookie = (
  res,
  token
) =>
  res.cookie(
    "customerRefreshToken",
    token,
    cookieOptions()
  );

const clearCookie = (
  res
) =>
  res.clearCookie(
    "customerRefreshToken",
    cookieOptions()
  );

const context = (
  req
) => ({
  ipAddress:
    req.ip,

  userAgent:
    req.get(
      "user-agent"
    ),

  deviceId:
    req.get(
      "x-device-id"
    ),
});

exports.register =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service.register({
          companyCode:
            companyCode(req),

          ...req.body,

          ...context(req),
        });

      setCookie(
        res,
        result.refreshToken
      );

      res.status(201).json({
        success: true,
        message:
          "Customer account created successfully.",
        data: {
          customer:
            result.customer,
          accessToken:
            result.accessToken,
        },
      });
    } catch (e) {
      next(e);
    }
  };

exports.login =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service.login({
          companyCode:
            companyCode(req),

          email:
            req.body.email,

          password:
            req.body.password,

          ...context(req),
        });

      setCookie(
        res,
        result.refreshToken
      );

      res.status(200).json({
        success: true,
        data: {
          customer:
            result.customer,
          accessToken:
            result.accessToken,
        },
      });
    } catch (e) {
      next(e);
    }
  };

exports.refresh =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service.refresh({
          refreshToken:
            refreshToken(req),

          ...context(req),
        });

      setCookie(
        res,
        result.refreshToken
      );

      res.status(200).json({
        success: true,
        data: {
          customer:
            result.customer,
          accessToken:
            result.accessToken,
        },
      });
    } catch (e) {
      clearCookie(res);
      next(e);
    }
  };

exports.logout =
  async (
    req,
    res,
    next
  ) => {
    try {
      await service.logout(
        refreshToken(req)
      );

      clearCookie(res);

      res.status(200).json({
        success: true,
        message:
          "Logged out successfully.",
      });
    } catch (e) {
      next(e);
    }
  };

exports.logoutAll =
  async (
    req,
    res,
    next
  ) => {
    try {
      await service.logoutAll(
        req.customer.id
      );

      clearCookie(res);

      res.status(200).json({
        success: true,
        message:
          "Logged out from all devices successfully.",
      });
    } catch (e) {
      next(e);
    }
  };

exports.me =
  async (
    req,
    res,
    next
  ) => {
    try {
      res.status(200).json({
        success: true,
        data:
          await service.getCurrentCustomer(
            req.customer.id
          ),
      });
    } catch (e) {
      next(e);
    }
  };

exports.forgotPassword =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service.forgotPassword({
          companyCode:
            companyCode(req),

          email:
            req.body.email,

          ...context(req),
        });

      res.status(200).json({
        success: true,
        message:
          result.message,
      });
    } catch (e) {
      next(e);
    }
  };

exports.resetPassword =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service.resetPassword({
          companyCode:
            companyCode(req),

          token:
            req.body.token,

          password:
            req.body.password,

          ...context(req),
        });

      clearCookie(res);

      res.status(200).json({
        success: true,
        message:
          result.message,
      });
    } catch (e) {
      next(e);
    }
  };
