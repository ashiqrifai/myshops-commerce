const settingsService = require(
    "./settings.service"
  );
  
  exports.listAdminSettings = async (
    req,
    res,
    next
  ) => {
    try {
      const settings =
        await settingsService.listAdminSettings({
          companyId: req.user.companyId,
          channel: req.query.channel,
          group: req.query.group,
          search: req.query.search,
        });
  
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.getSettingById = async (
    req,
    res,
    next
  ) => {
    try {
      const setting =
        await settingsService.getSettingById({
          companyId: req.user.companyId,
          settingId: req.params.id,
        });
  
      res.status(200).json({
        success: true,
        data: setting,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.updateSetting = async (
    req,
    res,
    next
  ) => {
    try {
      const setting =
        await settingsService.updateSetting({
          companyId: req.user.companyId,
          settingId: req.params.id,
          value: req.body.value,
          userId: req.user.id,
        });
  
      res.status(200).json({
        success: true,
        message:
          "System setting updated successfully.",
        data: setting,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.bulkUpdateSettings = async (
    req,
    res,
    next
  ) => {
    try {
      const settings =
        await settingsService.bulkUpdateSettings({
          companyId: req.user.companyId,
          settings: req.body.settings,
          userId: req.user.id,
        });
  
      res.status(200).json({
        success: true,
        message:
          "System settings updated successfully.",
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.getPublicWebsiteSettings = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await settingsService.getPublicSettings({
          companyCode:
            req.params.companyCode ||
            "MYSHOPS",
          channel: "WEBSITE",
        });
  
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.getPublicKioskSettings = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await settingsService.getKioskSettings({
          companyCode:
            req.params.companyCode ||
            "MYSHOPS",
        });
  
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };