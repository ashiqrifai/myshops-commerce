const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {
  Op,
} = require("sequelize");

const db = require("../../models");
const AppError = require(
  "../../utils/AppError"
);

const {
  sendPasswordResetEmail,
} = require(
  "../../services/mailService"
);

const {
  hashToken,
  createCustomerAccessToken,
  createCustomerRefreshToken,
  verifyCustomerRefreshToken,
  decodeTokenExpiration,
} = require(
  "./customerAuth.utils"
);

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const PASSWORD_RESET_EXPIRES_MINUTES =
  Math.max(
    5,
    Number(
      process.env
        .PASSWORD_RESET_EXPIRES_MINUTES ||
        30
    )
  );

const normalizeEmail = (
  value
) =>
  String(
    value ||
      ""
  )
    .trim()
    .toLowerCase();

const serializeCustomer = (
  customer
) => {
  const c =
    customer.get
      ? customer.get({
          plain: true,
        })
      : customer;

  return {
    id:
      c.id,

    companyId:
      c.companyId,

    firstName:
      c.firstName,

    lastName:
      c.lastName,

    fullName:
      [
        c.firstName,
        c.lastName,
      ]
        .filter(Boolean)
        .join(" "),

    email:
      c.email,

    mobile:
      c.mobile,

    status:
      c.status,

    emailVerifiedAt:
      c.emailVerifiedAt,

    mobileVerifiedAt:
      c.mobileVerifiedAt,

    preferredLanguage:
      c.preferredLanguage,

    preferredCurrency:
      c.preferredCurrency,

    marketingConsent:
      c.marketingConsent,

    lastLoginAt:
      c.lastLoginAt,
  };
};

const resolveCompany =
  async (
    companyCode
  ) => {
    const company =
      await db.Company.findOne({
        where: {
          code:
            String(
              companyCode ||
                ""
            )
              .trim()
              .toUpperCase(),

          isActive:
            true,
        },
      });

    if (!company) {
      throw new AppError(
        "Company is not available.",
        404,
        "COMPANY_NOT_AVAILABLE"
      );
    }

    return company;
  };

const issueTokens =
  async ({
    customer,
    ipAddress,
    userAgent,
    deviceId,
    transaction,
  }) => {
    const accessToken =
      createCustomerAccessToken(
        customer
      );

    const {
      token:
        refreshToken,
      tokenId,
    } =
      createCustomerRefreshToken(
        customer
      );

    await db.CustomerRefreshToken.create(
      {
        customerId:
          customer.id,

        tokenId,

        tokenHash:
          hashToken(
            refreshToken
          ),

        expiresAt:
          decodeTokenExpiration(
            refreshToken
          ),

        ipAddress,

        userAgent,

        deviceId,

        isActive:
          true,
      },
      {
        transaction,
      }
    );

    return {
      accessToken,
      refreshToken,
      tokenId,
    };
  };

exports.register =
  async (
    args
  ) => {
    const company =
      await resolveCompany(
        args.companyCode
      );

    const email =
      normalizeEmail(
        args.email
      );

    if (
      await db.Customer.findOne({
        where: {
          companyId:
            company.id,

          email,
        },
      })
    ) {
      throw new AppError(
        "A customer account already exists for this email address.",
        409,
        "CUSTOMER_EMAIL_ALREADY_EXISTS"
      );
    }

    const transaction =
      await db.sequelize.transaction();

    try {
      const customer =
        await db.Customer.create(
          {
            companyId:
              company.id,

            firstName:
              String(
                args.firstName
              ).trim(),

            lastName:
              args.lastName
                ? String(
                    args.lastName
                  ).trim()
                : null,

            email,

            mobile:
              args.mobile
                ? String(
                    args.mobile
                  ).trim()
                : null,

            passwordHash:
              await bcrypt.hash(
                args.password,
                12
              ),

            status:
              "ACTIVE",

            preferredLanguage:
              args.preferredLanguage ||
              "en",

            preferredCurrency:
              company.currency ||
              "AED",

            marketingConsent:
              args.marketingConsent ===
              true,

            isActive:
              true,
          },
          {
            transaction,
          }
        );

      const tokens =
        await issueTokens({
          customer,
          ...args,
          transaction,
        });

      await transaction.commit();

      return {
        customer:
          serializeCustomer(
            customer
          ),

        ...tokens,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

exports.login =
  async (
    args
  ) => {
    const company =
      await resolveCompany(
        args.companyCode
      );

    const customer =
      await db.Customer.findOne({
        where: {
          companyId:
            company.id,

          email:
            normalizeEmail(
              args.email
            ),

          isActive:
            true,
        },
      });

    if (!customer) {
      throw new AppError(
        "Invalid email or password.",
        401,
        "INVALID_CUSTOMER_CREDENTIALS"
      );
    }

    if (
      customer.status ===
      "INACTIVE"
    ) {
      throw new AppError(
        "Your customer account is inactive.",
        403,
        "CUSTOMER_INACTIVE"
      );
    }

    if (
      customer.status ===
        "LOCKED" &&
      customer.lockedUntil &&
      new Date(
        customer.lockedUntil
      ) >
        new Date()
    ) {
      throw new AppError(
        "Your account is temporarily locked. Please try again later.",
        423,
        "CUSTOMER_TEMPORARILY_LOCKED"
      );
    }

    if (
      customer.status ===
      "LOCKED"
    ) {
      await customer.update({
        status:
          "ACTIVE",

        failedLoginAttempts:
          0,

        lockedUntil:
          null,
      });
    }

    if (
      !(
        await bcrypt.compare(
          args.password,
          customer.passwordHash
        )
      )
    ) {
      const attempts =
        Number(
          customer.failedLoginAttempts ||
            0
        ) +
        1;

      const patch = {
        failedLoginAttempts:
          attempts,
      };

      if (
        attempts >=
        MAX_ATTEMPTS
      ) {
        patch.status =
          "LOCKED";

        patch.lockedUntil =
          new Date(
            Date.now() +
              LOCK_MINUTES *
                60000
          );
      }

      await customer.update(
        patch
      );

      throw new AppError(
        "Invalid email or password.",
        401,
        "INVALID_CUSTOMER_CREDENTIALS"
      );
    }

    const transaction =
      await db.sequelize.transaction();

    try {
      await customer.update(
        {
          failedLoginAttempts:
            0,

          lockedUntil:
            null,

          status:
            "ACTIVE",

          lastLoginAt:
            new Date(),
        },
        {
          transaction,
        }
      );

      const tokens =
        await issueTokens({
          customer,
          ...args,
          transaction,
        });

      await transaction.commit();

      return {
        customer:
          serializeCustomer(
            customer
          ),

        ...tokens,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

exports.refresh =
  async (
    args
  ) => {
    if (
      !args.refreshToken
    ) {
      throw new AppError(
        "Customer refresh token is required.",
        401,
        "CUSTOMER_REFRESH_TOKEN_REQUIRED"
      );
    }

    let payload;

    try {
      payload =
        verifyCustomerRefreshToken(
          args.refreshToken
        );
    } catch {
      throw new AppError(
        "Customer refresh token is invalid or expired.",
        401,
        "INVALID_CUSTOMER_REFRESH_TOKEN"
      );
    }

    if (
      payload.type !==
        "CUSTOMER_REFRESH" ||
      !payload.sub ||
      !payload.jti ||
      !payload.companyId
    ) {
      throw new AppError(
        "Customer refresh token is invalid.",
        401,
        "INVALID_CUSTOMER_REFRESH_TOKEN"
      );
    }

    const stored =
      await db.CustomerRefreshToken.findOne(
        {
          where: {
            tokenId:
              payload.jti,

            tokenHash:
              hashToken(
                args.refreshToken
              ),

            customerId:
              payload.sub,

            isActive:
              true,

            revokedAt:
              null,
          },
        }
      );

    if (
      !stored ||
      new Date(
        stored.expiresAt
      ) <=
        new Date()
    ) {
      throw new AppError(
        "Customer refresh token is invalid or expired.",
        401,
        "INVALID_CUSTOMER_REFRESH_TOKEN"
      );
    }

    const customer =
      await db.Customer.findOne({
        where: {
          id:
            payload.sub,

          companyId:
            payload.companyId,

          status:
            "ACTIVE",

          isActive:
            true,
        },
      });

    if (!customer) {
      throw new AppError(
        "Customer account is no longer available.",
        401,
        "CUSTOMER_NOT_AVAILABLE"
      );
    }

    const transaction =
      await db.sequelize.transaction();

    try {
      const tokens =
        await issueTokens({
          customer,
          ...args,
          transaction,
        });

      await stored.update(
        {
          isActive:
            false,

          revokedAt:
            new Date(),

          replacedByTokenId:
            tokens.tokenId,
        },
        {
          transaction,
        }
      );

      await transaction.commit();

      return {
        customer:
          serializeCustomer(
            customer
          ),

        accessToken:
          tokens.accessToken,

        refreshToken:
          tokens.refreshToken,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

exports.logout =
  async (
    refreshToken
  ) => {
    if (!refreshToken) {
      return;
    }

    let payload;

    try {
      payload =
        verifyCustomerRefreshToken(
          refreshToken
        );
    } catch {
      return;
    }

    await db.CustomerRefreshToken.update(
      {
        isActive:
          false,

        revokedAt:
          new Date(),
      },
      {
        where: {
          tokenId:
            payload.jti,

          customerId:
            payload.sub,

          tokenHash:
            hashToken(
              refreshToken
            ),

          isActive:
            true,
        },
      }
    );
  };

exports.logoutAll =
  async (
    customerId
  ) =>
    db.CustomerRefreshToken.update(
      {
        isActive:
          false,

        revokedAt:
          new Date(),
      },
      {
        where: {
          customerId,

          isActive:
            true,

          revokedAt: {
            [Op.is]:
              null,
          },
        },
      }
    );

exports.getCurrentCustomer =
  async (
    customerId
  ) => {
    const customer =
      await db.Customer.findByPk(
        customerId
      );

    if (
      !customer ||
      !customer.isActive ||
      customer.status !==
        "ACTIVE"
    ) {
      throw new AppError(
        "Customer account is not available.",
        401,
        "CUSTOMER_NOT_AVAILABLE"
      );
    }

    return serializeCustomer(
      customer
    );
  };

exports.forgotPassword =
  async (
    args
  ) => {
    const company =
      await resolveCompany(
        args.companyCode
      );

    const email =
      normalizeEmail(
        args.email
      );

    const publicResult = {
      message:
        "If an account exists for that email address, a password reset link has been sent.",
    };

    const customer =
      await db.Customer.findOne({
        where: {
          companyId:
            company.id,

          email,

          isActive:
            true,

          status: {
            [Op.ne]:
              "INACTIVE",
          },
        },
      });

    if (!customer) {
      return publicResult;
    }

    const rawToken =
      crypto
        .randomBytes(32)
        .toString("hex");

    const now =
      new Date();

    const expiresAt =
      new Date(
        now.getTime() +
          PASSWORD_RESET_EXPIRES_MINUTES *
            60 *
            1000
      );

    await customer.update({
      passwordResetTokenHash:
        hashToken(
          rawToken
        ),

      passwordResetExpiresAt:
        expiresAt,

      passwordResetRequestedAt:
        now,
    });

    const storefrontUrl =
      String(
        process.env.STOREFRONT_URL ||
          "https://vkposme.tech"
      )
        .trim()
        .replace(
          /\/+$/,
          ""
        );

    const resetUrl =
      `${storefrontUrl}/account/reset-password?token=${encodeURIComponent(
        rawToken
      )}`;

    try {
      await sendPasswordResetEmail({
        to:
          customer.email,

        customerName:
          customer.firstName,

        resetUrl,

        expiresMinutes:
          PASSWORD_RESET_EXPIRES_MINUTES,
      });
    } catch (error) {
      console.error(
        "Customer password reset email failed:",
        error
      );

      await customer.update({
        passwordResetTokenHash:
          null,

        passwordResetExpiresAt:
          null,

        passwordResetRequestedAt:
          null,
      });
    }

    return publicResult;
  };

exports.resetPassword =
  async (
    args
  ) => {
    const company =
      await resolveCompany(
        args.companyCode
      );

    const tokenHash =
      hashToken(
        String(
          args.token ||
            ""
        )
      );

    const customer =
      await db.Customer.findOne({
        where: {
          companyId:
            company.id,

          passwordResetTokenHash:
            tokenHash,

          passwordResetExpiresAt: {
            [Op.gt]:
              new Date(),
          },

          isActive:
            true,

          status: {
            [Op.ne]:
              "INACTIVE",
          },
        },
      });

    if (!customer) {
      throw new AppError(
        "This password reset link is invalid or has expired. Please request a new one.",
        400,
        "INVALID_OR_EXPIRED_PASSWORD_RESET_TOKEN"
      );
    }

    const newPasswordHash =
      await bcrypt.hash(
        args.password,
        12
      );

    const transaction =
      await db.sequelize.transaction();

    try {
      await customer.update(
        {
          passwordHash:
            newPasswordHash,

          passwordChangedAt:
            new Date(),

          passwordResetTokenHash:
            null,

          passwordResetExpiresAt:
            null,

          passwordResetRequestedAt:
            null,

          failedLoginAttempts:
            0,

          lockedUntil:
            null,

          status:
            "ACTIVE",
        },
        {
          transaction,
        }
      );

      await db.CustomerRefreshToken.update(
        {
          isActive:
            false,

          revokedAt:
            new Date(),
        },
        {
          where: {
            customerId:
              customer.id,

            isActive:
              true,
          },

          transaction,
        }
      );

      await transaction.commit();

      return {
        message:
          "Your password has been reset successfully. You can now sign in with your new password.",
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };
