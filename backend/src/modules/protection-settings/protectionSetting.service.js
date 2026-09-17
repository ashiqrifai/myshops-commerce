const db =
  require(
    "../../models"
  );

const AppError =
  require(
    "../../utils/AppError"
  );

const getAttributes =
  () =>
    db
      .ProtectionSetting
      ?.rawAttributes ||
    {};

const hasAttribute =
  (
    name
  ) =>
    Boolean(
      getAttributes()[
        name
      ]
    );

const getEnabledField =
  () => {
    const candidates = [
      "isEnabled",
      "isActive",
      "protectionEnabled",
    ];

    return (
      candidates.find(
        hasAttribute
      ) ||
      null
    );
  };

const getMinimumAmountField =
  () => {
    const candidates = [
      "minimumEligibleProductAmount",
      "minimumProductAmount",
      "minimumEligibleAmount",
    ];

    return (
      candidates.find(
        hasAttribute
      ) ||
      null
    );
  };

const getCurrencyField =
  () => {
    const candidates = [
      "currencyCode",
      "currency",
    ];

    return (
      candidates.find(
        hasAttribute
      ) ||
      null
    );
  };

const getChannelField =
  () => {
    const candidates = [
      "channelCode",
      "channel",
    ];

    return (
      candidates.find(
        hasAttribute
      ) ||
      null
    );
  };

const getCreatedByField =
  () =>
    hasAttribute(
      "createdBy"
    )
      ? "createdBy"
      : null;

const getUpdatedByField =
  () =>
    hasAttribute(
      "updatedBy"
    )
      ? "updatedBy"
      : null;

const ensureModelConfigured =
  () => {
    if (
      !db.ProtectionSetting
    ) {
      throw new AppError(
        "ProtectionSetting model is not configured.",
        500,
        "PROTECTION_SETTING_MODEL_NOT_CONFIGURED"
      );
    }

    if (
      !hasAttribute(
        "companyId"
      )
    ) {
      throw new AppError(
        "ProtectionSetting model must contain companyId.",
        500,
        "PROTECTION_SETTING_COMPANY_FIELD_MISSING"
      );
    }

    if (
      !getMinimumAmountField()
    ) {
      throw new AppError(
        "ProtectionSetting model does not contain a supported minimum eligible amount field.",
        500,
        "PROTECTION_SETTING_MINIMUM_FIELD_MISSING"
      );
    }
  };

const buildWhere =
  ({
    companyId,
    channelCode =
      "WEBSITE",
  }) => {
    const where = {
      companyId,
    };

    const channelField =
      getChannelField();

    if (
      channelField
    ) {
      where[
        channelField
      ] =
        String(
          channelCode ||
            "WEBSITE"
        )
          .trim()
          .toUpperCase();
    }

    return where;
  };

const serializeSetting =
  (
    setting,
    {
      channelCode =
        "WEBSITE",
    } = {}
  ) => {
    if (
      !setting
    ) {
      return null;
    }

    const plain =
      typeof setting.get ===
        "function"
        ? setting.get({
            plain:
              true,
          })
        : setting;

    const enabledField =
      getEnabledField();

    const minimumField =
      getMinimumAmountField();

    const currencyField =
      getCurrencyField();

    const channelField =
      getChannelField();

    return {
      ...plain,

      /*
       * Stable admin API aliases.
       *
       * These aliases let the frontend remain unchanged
       * even if the underlying model uses isActive instead
       * of isEnabled, for example.
       */
      isEnabled:
        enabledField
          ? plain[
              enabledField
            ] !==
            false
          : true,

      minimumEligibleProductAmount:
        Number(
          plain[
            minimumField
          ] ||
            0
        ),

      currencyCode:
        currencyField
          ? String(
              plain[
                currencyField
              ] ||
                "AED"
            )
              .trim()
              .toUpperCase()
          : "AED",

      channelCode:
        channelField
          ? String(
              plain[
                channelField
              ] ||
                channelCode
            )
              .trim()
              .toUpperCase()
          : String(
              channelCode ||
                "WEBSITE"
            )
              .trim()
              .toUpperCase(),
    };
  };

const getProtectionSetting =
  async ({
    companyId,
    channelCode =
      "WEBSITE",
    transaction,
  }) => {
    ensureModelConfigured();

    const setting =
      await db
        .ProtectionSetting
        .findOne({
          where:
            buildWhere({
              companyId,
              channelCode,
            }),

          transaction,
        });

    return serializeSetting(
      setting,
      {
        channelCode,
      }
    );
  };

const upsertProtectionSetting =
  async ({
    companyId,
    userId,
    channelCode =
      "WEBSITE",
    payload,
  }) => {
    ensureModelConfigured();

    const transaction =
      await db
        .sequelize
        .transaction();

    try {
      const where =
        buildWhere({
          companyId,
          channelCode,
        });

      let setting =
        await db
          .ProtectionSetting
          .findOne({
            where,

            transaction,

            lock:
              transaction
                .LOCK
                .UPDATE,
          });

      const minimumField =
        getMinimumAmountField();

      const enabledField =
        getEnabledField();

      const currencyField =
        getCurrencyField();

      const channelField =
        getChannelField();

      const minimumAmount =
        Number(
          payload
            .minimumEligibleProductAmount
        );

      if (
        !Number.isFinite(
          minimumAmount
        ) ||
        minimumAmount <
          0
      ) {
        throw new AppError(
          "Minimum eligible product amount must be zero or greater.",
          400,
          "PROTECTION_SETTING_MINIMUM_AMOUNT_INVALID"
        );
      }

      const values = {
        [minimumField]:
          minimumAmount,
      };

      if (
        enabledField &&
        payload.isEnabled !==
          undefined
      ) {
        values[
          enabledField
        ] =
          Boolean(
            payload.isEnabled
          );
      }

      if (
        currencyField &&
        payload.currencyCode !==
          undefined
      ) {
        values[
          currencyField
        ] =
          String(
            payload
              .currencyCode ||
              "AED"
          )
            .trim()
            .toUpperCase();
      }

      if (
        channelField
      ) {
        values[
          channelField
        ] =
          String(
            channelCode ||
              payload
                .channelCode ||
              "WEBSITE"
          )
            .trim()
            .toUpperCase();
      }

      const updatedByField =
        getUpdatedByField();

      if (
        updatedByField
      ) {
        values[
          updatedByField
        ] =
          userId;
      }

      if (
        setting
      ) {
        await setting.update(
          values,
          {
            transaction,
          }
        );
      } else {
        const createValues = {
          companyId,
          ...values,
        };

        const createdByField =
          getCreatedByField();

        if (
          createdByField
        ) {
          createValues[
            createdByField
          ] =
            userId;
        }

        setting =
          await db
            .ProtectionSetting
            .create(
              createValues,
              {
                transaction,
              }
            );
      }

      await transaction
        .commit();

      return getProtectionSetting({
        companyId,
        channelCode,
      });
    } catch (
      error
    ) {
      if (
        !transaction.finished
      ) {
        await transaction
          .rollback();
      }

      throw error;
    }
  };

module.exports = {
  getProtectionSetting,
  upsertProtectionSetting,
};
