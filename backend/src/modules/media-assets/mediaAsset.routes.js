const express = require("express");

const mediaAssetController = require(
  "./mediaAsset.controller"
);

const authenticate = require(
  "../../middleware/authenticate"
);

const authorize = require(
  "../../middleware/authorize"
);

const validateRequest = require(
  "../../middleware/validateRequest"
);

const mediaUpload = require(
  "../../middleware/media/mediaUpload"
);

const {
  mediaAssetIdValidation,
  listMediaAssetsValidation,
  uploadMediaAssetValidation,
  updateMediaAssetValidation,
} = require(
  "./mediaAsset.validation"
);

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("media.assets.read"),
  listMediaAssetsValidation,
  validateRequest,
  mediaAssetController.listMediaAssets
);

router.post(
  "/upload",
  authorize("media.assets.create"),
  mediaUpload,
  uploadMediaAssetValidation,
  validateRequest,
  mediaAssetController.uploadMediaAsset
);

router.get(
    "/:id/usage",
    authorize("media.assets.read"),
    mediaAssetIdValidation,
    validateRequest,
    mediaAssetController.getMediaAssetUsage
  );
  
  router.patch(
    "/:id/archive",
    authorize("media.assets.delete"),
    mediaAssetIdValidation,
    validateRequest,
    mediaAssetController.archiveMediaAsset
  );
  
  router.patch(
    "/:id/restore",
    authorize("media.assets.update"),
    mediaAssetIdValidation,
    validateRequest,
    mediaAssetController.restoreMediaAsset
  );

router.post(
    "/:id/reprocess",
    authorize("media.assets.update"),
    mediaAssetIdValidation,
    validateRequest,
    mediaAssetController.reprocessMediaAsset
  );

router.get(
  "/:id",
  authorize("media.assets.read"),
  mediaAssetIdValidation,
  validateRequest,
  mediaAssetController.getMediaAssetById
);

router.put(
  "/:id",
  authorize("media.assets.update"),
  updateMediaAssetValidation,
  validateRequest,
  mediaAssetController.updateMediaAsset
);

module.exports = router;