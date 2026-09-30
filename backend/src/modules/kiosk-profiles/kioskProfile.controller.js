const service =
  require(
    "./kioskProfile.service"
  );

exports.listProfiles =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service.listProfiles({
          companyId:
            req.user.companyId,

          search:
            req.query.search,

          isActive:
            req.query.isActive,
        });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

exports.getProfile =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service.getProfileById({
          companyId:
            req.user.companyId,

          profileId:
            req.params.id,
        });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

exports.createProfile =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service.createProfile({
          companyId:
            req.user.companyId,

          userId:
            req.user.id,

          payload:
            req.body,
        });

      res.status(201).json({
        success: true,

        message:
          "Kiosk profile created successfully.",

        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

exports.updateProfile =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service.updateProfile({
          companyId:
            req.user.companyId,

          profileId:
            req.params.id,

          userId:
            req.user.id,

          payload:
            req.body,
        });

      res.status(200).json({
        success: true,

        message:
          "Kiosk profile updated successfully.",

        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

exports.assignPage =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service.assignPage({
          companyId:
            req.user.companyId,

          profileId:
            req.params.id,

          userId:
            req.user.id,

          payload:
            req.body,
        });

      res.status(200).json({
        success: true,

        message:
          "Kiosk CMS page assigned successfully.",

        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  exports.createDedicatedHome =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service.createDedicatedHomePage({
          companyId:
            req.user.companyId,

          profileId:
            req.params.id,

          userId:
            req.user.id,

          sourceCmsPageId:
            req.body.sourceCmsPageId,
        });

      res.status(201).json({
        success: true,

        message:
          "Dedicated kiosk home page created successfully.",

        data: result,
      });
    } catch (error) {
      next(error);
    }
  };