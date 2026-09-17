const protectionSettingService =
  require(
    "./protectionSetting.service"
  );

exports.getProtectionSetting =
  async (
    req,
    res,
    next
  ) => {
    try {
      const setting =
        await protectionSettingService
          .getProtectionSetting({
            companyId:
              req.user.companyId,

            channelCode:
              req.query
                .channelCode ||
              "WEBSITE",
          });

      res.status(200).json({
        success:
          true,

        data:
          setting,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.updateProtectionSetting =
  async (
    req,
    res,
    next
  ) => {
    try {
      const setting =
        await protectionSettingService
          .upsertProtectionSetting({
            companyId:
              req.user.companyId,

            userId:
              req.user.id,

            channelCode:
              req.body
                .channelCode ||
              req.query
                .channelCode ||
              "WEBSITE",

            payload:
              req.body,
          });

      res.status(200).json({
        success:
          true,

        message:
          "Protection settings saved successfully.",

        data:
          setting,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };
