const cmsPageService = require(
    "./cmsPage.service"
  );
  
  exports.listCmsPages = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await cmsPageService.listCmsPages({
          companyId: req.user.companyId,
          page: req.query.page || 1,
          pageSize:
            req.query.pageSize || 25,
          search: req.query.search,
          pageType:
            req.query.pageType,
          channel: req.query.channel,
          status: req.query.status,
          isActive:
            req.query.isActive,
          sortBy:
            req.query.sortBy ||
            "updatedAt",
          sortDirection:
            req.query.sortDirection ||
            "DESC",
        });
  
      res.status(200).json({
        success: true,
        data: result.rows,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.getCmsPageById = async (
    req,
    res,
    next
  ) => {
    try {
      const page =
        await cmsPageService.getCmsPageById({
          companyId: req.user.companyId,
          pageId: req.params.id,
        });
  
      res.status(200).json({
        success: true,
        data: page,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.createCmsPage = async (
    req,
    res,
    next
  ) => {
    try {
      const page =
        await cmsPageService.createCmsPage({
          companyId: req.user.companyId,
          userId: req.user.id,
          payload: req.body,
        });
  
      res.status(201).json({
        success: true,
        message:
          "CMS page created successfully.",
        data: page,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.updateCmsPage = async (
    req,
    res,
    next
  ) => {
    try {
      const page =
        await cmsPageService.updateCmsPage({
          companyId: req.user.companyId,
          pageId: req.params.id,
          userId: req.user.id,
          payload: req.body,
        });
  
      res.status(200).json({
        success: true,
        message:
          "CMS page updated successfully.",
        data: page,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.changeCmsPageStatus = async (
    req,
    res,
    next
  ) => {
    try {
      const page =
        await cmsPageService.changeCmsPageStatus(
          {
            companyId:
              req.user.companyId,
            pageId: req.params.id,
            userId: req.user.id,
            status: req.body.status,
          }
        );
  
      res.status(200).json({
        success: true,
        message:
          "CMS page status updated successfully.",
        data: page,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.changeCmsPageActive = async (
    req,
    res,
    next
  ) => {
    try {
      const page =
        await cmsPageService.changeCmsPageActive(
          {
            companyId:
              req.user.companyId,
            pageId: req.params.id,
            userId: req.user.id,
            isActive:
              req.body.isActive,
          }
        );
  
      res.status(200).json({
        success: true,
        message: req.body.isActive
          ? "CMS page enabled successfully."
          : "CMS page disabled successfully.",
        data: page,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.duplicateCmsPage = async (
    req,
    res,
    next
  ) => {
    try {
      const page =
        await cmsPageService.duplicateCmsPage({
          companyId: req.user.companyId,
          pageId: req.params.id,
          userId: req.user.id,
        });
  
      res.status(201).json({
        success: true,
        message:
          "CMS page duplicated successfully.",
        data: page,
      });
    } catch (error) {
      next(error);
    }
  };