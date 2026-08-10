const mediaAssetService = require(
    "./mediaAsset.service"

  );
  
  const {
    reprocessMediaAsset,
  } = require(
    "./mediaAssetProcessing.service"
  );

  const {
    archiveMediaAsset,
    restoreMediaAsset,
  } = require(
    "./mediaAssetLifecycle.service"
  );
  
  const {
    getMediaUsage,
  } = require(
    "../../services/media/mediaUsage.service"
  );

  exports.listMediaAssets = async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await mediaAssetService.listMediaAssets({
          companyId:
            req.user.companyId,
  
          page:
            req.query.page || 1,
  
          pageSize:
            req.query.pageSize ||
            30,
  
          search:
            req.query.search,
  
          folderId:
            req.query.folderId,
  
          assetType:
            req.query.assetType,
  
          classification:
            req.query.classification,
  
          status:
            req.query.status,
  
          isPublic:
            req.query.isPublic,
  
          isActive:
            req.query.isActive ===
            undefined
              ? true
              : req.query.isActive,
  
          sortBy:
            req.query.sortBy ||
            "createdAt",
  
          sortDirection:
            req.query
              .sortDirection ||
            "DESC",
        });
  
      res.status(200).json({
        success: true,
        data: result.rows,
        pagination:
          result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.getMediaAssetById = async (
    req,
    res,
    next
  ) => {
    try {
      const asset =
        await mediaAssetService.getMediaAssetById({
          companyId:
            req.user.companyId,
  
          assetId:
            req.params.id,
        });
  
      res.status(200).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.uploadMediaAsset =
  async (
    req,
    res,
    next
  ) => {
    const files =
      Array.isArray(
        req.files
      )
        ? req.files
        : [];

    try {
      if (!files.length) {
        const error =
          new Error(
            "At least one media file is required."
          );

        error.statusCode =
          400;

        error.code =
          "MEDIA_FILES_REQUIRED";

        throw error;
      }

      const results = [];

      for (
        const file of files
      ) {
        try {
          /*
           * For multiple uploads, leave
           * title and alt text blank so
           * the service generates the
           * title from each filename.
           */
          const payload = {
            ...req.body,

            title:
              files.length ===
                1
                ? req.body
                    .title
                : "",

            altText:
              files.length ===
                1
                ? req.body
                    .altText
                : "",
          };

          const result =
            await mediaAssetService
              .uploadMediaAsset({
                companyId:
                  req.user
                    .companyId,

                userId:
                  req.user.id,

                file,

                payload,
              });

          results.push({
            success:
              true,

            fileName:
              file.originalname,

            duplicate:
              result.duplicate,

            asset:
              result.asset,
          });
        } catch (
          fileError
        ) {
          results.push({
            success:
              false,

            fileName:
              file.originalname,

            duplicate:
              false,

            error: {
              code:
                fileError.code ||
                "MEDIA_UPLOAD_FAILED",

              message:
                fileError.message ||
                "Upload failed.",
            },
          });
        }
      }

      const uploadedCount =
        results.filter(
          (result) =>
            result.success &&
            !result.duplicate
        ).length;

      const duplicateCount =
        results.filter(
          (result) =>
            result.success &&
            result.duplicate
        ).length;

      const failedCount =
        results.filter(
          (result) =>
            !result.success
        ).length;

      res.status(
        failedCount ===
          files.length
          ? 400
          : 201
      ).json({
        success:
          failedCount !==
          files.length,

        message:
          `${uploadedCount} uploaded, ${duplicateCount} duplicate, ${failedCount} failed.`,

        data:
          results,

        meta: {
          requestedCount:
            files.length,

          uploadedCount,

          duplicateCount,

          failedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.updateMediaAsset = async (
    req,
    res,
    next
  ) => {
    try {
      const asset =
        await mediaAssetService.updateMediaAsset({
          companyId:
            req.user.companyId,
  
          assetId:
            req.params.id,
  
          userId:
            req.user.id,
  
          payload:
            req.body,
        });
  
      res.status(200).json({
        success: true,
        message:
          "Media asset updated successfully.",
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  };


  exports.reprocessMediaAsset = async (
    req,
    res,
    next
  ) => {
    try {
      const asset =
        await reprocessMediaAsset({
          companyId:
            req.user.companyId,
  
          assetId:
            req.params.id,
  
          userId:
            req.user.id,
        });
  
      res.status(200).json({
        success: true,
        message:
          "Media asset processed successfully.",
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  };

  exports.getMediaAssetUsage = async (
    req,
    res,
    next
  ) => {
    try {
      const usage =
        await getMediaUsage({
          companyId:
            req.user.companyId,
  
          mediaAssetId:
            req.params.id,
  
          includeInactive:
            req.query
              .includeInactive ===
            "true",
        });
  
      res.status(200).json({
        success: true,
        data: usage,
  
        meta: {
          totalItems:
            usage.length,
        },
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.archiveMediaAsset = async (
    req,
    res,
    next
  ) => {
    try {
      const asset =
        await archiveMediaAsset({
          companyId:
            req.user.companyId,
  
          assetId:
            req.params.id,
  
          userId:
            req.user.id,
        });
  
      res.status(200).json({
        success: true,
        message:
          "Media asset archived successfully.",
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  };
  
  exports.restoreMediaAsset = async (
    req,
    res,
    next
  ) => {
    try {
      const asset =
        await restoreMediaAsset({
          companyId:
            req.user.companyId,
  
          assetId:
            req.params.id,
  
          userId:
            req.user.id,
        });
  
      res.status(200).json({
        success: true,
        message:
          "Media asset restored successfully.",
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  };