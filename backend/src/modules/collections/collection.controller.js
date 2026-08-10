const collectionService = require(
    "./collection.service"
  );
  
  exports.listCollections = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await collectionService.listCollections({
          companyId:
            req.user.companyId,
  
          page:
            req.query.page ||
            1,
  
          pageSize:
            req.query.pageSize ||
            30,
  
          search:
            req.query.search,
  
          isActive:
            req.query.isActive,
  
          isFeatured:
            req.query.isFeatured,
  
          showInMenu:
            req.query.showInMenu,
  
          showOnHome:
            req.query.showOnHome,
  
          collectionType:
            req.query.collectionType,
  
          published:
            req.query.published,
  
          sortBy:
            req.query.sortBy ||
            "sortOrder",
  
          sortDirection:
            req.query.sortDirection ||
            "ASC",
        });
  
      res.status(200).json({
        success:
          true,
  
        data:
          result.rows,
  
        pagination:
          result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.createCollection = async (
    req,
    res,
    next
  ) => {
    try {
      const collection =
        await collectionService.createCollection({
          companyId:
            req.user.companyId,
  
          userId:
            req.user.id,
  
          payload:
            req.body,
        });
  
      res.status(201).json({
        success:
          true,
  
        message:
          "Collection created successfully.",
  
        data:
          collection,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.getCollectionProducts = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await collectionService.getCollectionProducts({
          companyId:
            req.user.companyId,
  
          collectionId:
            req.params.id,
  
          page:
            req.query.page ||
            1,
  
          pageSize:
            req.query.pageSize ||
            50,
  
          search:
            req.query.search,
  
          status:
            req.query.status,
        });
  
      res.status(200).json({
        success:
          true,
  
        collection:
          result.collection,
  
        data:
          result.rows,
  
        pagination:
          result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.replaceCollectionProducts = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await collectionService.replaceCollectionProducts({
          companyId:
            req.user.companyId,
  
          collectionId:
            req.params.id,
  
          userId:
            req.user.id,
  
          productIds:
            req.body.productIds ||
            [],
        });
  
      res.status(200).json({
        success:
          true,
  
        message:
          "Collection products updated successfully.",
  
        data:
          result,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.changeCollectionStatus = async (
    req,
    res,
    next
  ) => {
    try {
      const collection =
        await collectionService.changeCollectionStatus({
          companyId:
            req.user.companyId,
  
          collectionId:
            req.params.id,
  
          userId:
            req.user.id,
  
          isActive:
            req.body.isActive,
        });
  
      res.status(200).json({
        success:
          true,
  
        message:
          collection.isActive
            ? "Collection activated successfully."
            : "Collection deactivated successfully.",
  
        data:
          collection,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.getCollectionById = async (
    req,
    res,
    next
  ) => {
    try {
      const collection =
        await collectionService.getCollectionById({
          companyId:
            req.user.companyId,
  
          collectionId:
            req.params.id,
        });
  
      res.status(200).json({
        success:
          true,
  
        data:
          collection,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.updateCollection = async (
    req,
    res,
    next
  ) => {
    try {
      const collection =
        await collectionService.updateCollection({
          companyId:
            req.user.companyId,
  
          collectionId:
            req.params.id,
  
          userId:
            req.user.id,
  
          payload:
            req.body,
        });
  
      res.status(200).json({
        success:
          true,
  
        message:
          "Collection updated successfully.",
  
        data:
          collection,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.deleteCollection = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await collectionService.deleteCollection({
          companyId:
            req.user.companyId,
  
          collectionId:
            req.params.id,
        });
  
      res.status(200).json({
        success:
          true,
  
        message:
          "Collection deleted successfully.",
  
        data:
          result,
      });
    } catch (error) {
      next(error);
    }
  };