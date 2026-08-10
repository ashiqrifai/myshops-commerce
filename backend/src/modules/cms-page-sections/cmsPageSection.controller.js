const cmsPageSectionService = require(
    "./cmsPageSection.service"
  );
  
  exports.listCmsPageSections = async (
    req,
    res,
    next
  ) => {
    try {
      const sections =
        await cmsPageSectionService.listCmsPageSections({
          companyId: req.user.companyId,
          pageId: req.params.pageId,
        });
  
      res.status(200).json({
        success: true,
        data: sections,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.getCmsPageSectionById = async (
    req,
    res,
    next
  ) => {
    try {
      const section =
        await cmsPageSectionService.getCmsPageSectionById({
          companyId: req.user.companyId,
          pageId: req.params.pageId,
          sectionId: req.params.sectionId,
        });
  
      res.status(200).json({
        success: true,
        data: section,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.createCmsPageSection = async (
    req,
    res,
    next
  ) => {
    try {
      const section =
        await cmsPageSectionService.createCmsPageSection({
          companyId: req.user.companyId,
          pageId: req.params.pageId,
          userId: req.user.id,
          payload: req.body,
        });
  
      res.status(201).json({
        success: true,
        message:
          "CMS page section added successfully.",
        data: section,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.updateCmsPageSection = async (
    req,
    res,
    next
  ) => {
    try {
      const section =
        await cmsPageSectionService.updateCmsPageSection({
          companyId: req.user.companyId,
          pageId: req.params.pageId,
          sectionId: req.params.sectionId,
          userId: req.user.id,
          payload: req.body,
        });
  
      res.status(200).json({
        success: true,
        message:
          "CMS page section updated successfully.",
        data: section,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.changeCmsPageSectionEnabled = async (
    req,
    res,
    next
  ) => {
    try {
      const section =
        await cmsPageSectionService.changeCmsPageSectionEnabled({
          companyId: req.user.companyId,
          pageId: req.params.pageId,
          sectionId: req.params.sectionId,
          userId: req.user.id,
          isEnabled: req.body.isEnabled,
        });
  
      res.status(200).json({
        success: true,
        message: req.body.isEnabled
          ? "CMS page section enabled successfully."
          : "CMS page section disabled successfully.",
        data: section,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.reorderCmsPageSections = async (
    req,
    res,
    next
  ) => {
    try {
      const sections =
        await cmsPageSectionService.reorderCmsPageSections({
          companyId: req.user.companyId,
          pageId: req.params.pageId,
          userId: req.user.id,
          sections: req.body.sections,
        });
  
      res.status(200).json({
        success: true,
        message:
          "CMS page sections reordered successfully.",
        data: sections,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.duplicateCmsPageSection = async (
    req,
    res,
    next
  ) => {
    try {
      const section =
        await cmsPageSectionService.duplicateCmsPageSection({
          companyId: req.user.companyId,
          pageId: req.params.pageId,
          sectionId: req.params.sectionId,
          userId: req.user.id,
        });
  
      res.status(201).json({
        success: true,
        message:
          "CMS page section duplicated successfully.",
        data: section,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.deleteCmsPageSection = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await cmsPageSectionService.deleteCmsPageSection({
          companyId: req.user.companyId,
          pageId: req.params.pageId,
          sectionId: req.params.sectionId,
          userId: req.user.id,
        });
  
      res.status(200).json({
        success: true,
        message:
          "CMS page section removed successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };