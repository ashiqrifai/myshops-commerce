const mediaFolderService = require(
    "./mediaFolder.service"
  );
  
  exports.listMediaFolders = async (
    req,
    res,
    next
  ) => {
    try {
      const folders =
        await mediaFolderService.listMediaFolders({
          companyId: req.user.companyId,
          search: req.query.search,
          parentFolderId:
            req.query.parentFolderId,
          isActive:
            req.query.isActive ===
            undefined
              ? true
              : req.query.isActive,
          includeAssetCount:
            req.query
              .includeAssetCount ===
            undefined
              ? true
              : req.query
                  .includeAssetCount,
        });
  
      res.status(200).json({
        success: true,
        data: folders,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.getMediaFolderTree = async (
    req,
    res,
    next
  ) => {
    try {
      const tree =
        await mediaFolderService.getMediaFolderTree({
          companyId: req.user.companyId,
          isActive:
            req.query.isActive ===
            undefined
              ? true
              : req.query.isActive,
        });
  
      res.status(200).json({
        success: true,
        data: tree,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.getMediaFolderById = async (
    req,
    res,
    next
  ) => {
    try {
      const folder =
        await mediaFolderService.getMediaFolderById({
          companyId: req.user.companyId,
          folderId: req.params.id,
          includeChildren: true,
          includeAssets:
            req.query.includeAssets ===
            "true",
        });
  
      res.status(200).json({
        success: true,
        data: folder,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.createMediaFolder = async (
    req,
    res,
    next
  ) => {
    try {
      const folder =
        await mediaFolderService.createMediaFolder({
          companyId: req.user.companyId,
          userId: req.user.id,
          payload: req.body,
        });
  
      res.status(201).json({
        success: true,
        message:
          "Media folder created successfully.",
        data: folder,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.updateMediaFolder = async (
    req,
    res,
    next
  ) => {
    try {
      const folder =
        await mediaFolderService.updateMediaFolder({
          companyId: req.user.companyId,
          folderId: req.params.id,
          userId: req.user.id,
          payload: req.body,
        });
  
      res.status(200).json({
        success: true,
        message:
          "Media folder updated successfully.",
        data: folder,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.changeMediaFolderActive = async (
    req,
    res,
    next
  ) => {
    try {
      const folder =
        await mediaFolderService.changeMediaFolderActive({
          companyId: req.user.companyId,
          folderId: req.params.id,
          userId: req.user.id,
          isActive:
            req.body.isActive,
        });
  
      res.status(200).json({
        success: true,
        message:
          req.body.isActive
            ? "Media folder enabled successfully."
            : "Media folder disabled successfully.",
        data: folder,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.deleteMediaFolder = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await mediaFolderService.deleteMediaFolder({
          companyId: req.user.companyId,
          folderId: req.params.id,
          userId: req.user.id,
        });
  
      res.status(200).json({
        success: true,
        message:
          "Media folder removed successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };