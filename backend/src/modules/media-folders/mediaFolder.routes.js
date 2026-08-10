const express = require("express");

const mediaFolderController = require(
  "./mediaFolder.controller"
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

const {
  mediaFolderIdValidation,
  listMediaFoldersValidation,
  createMediaFolderValidation,
  updateMediaFolderValidation,
  changeMediaFolderActiveValidation,
} = require("./mediaFolder.validation");

const router = express.Router();

router.use(authenticate);

router.get(
  "/tree",
  authorize("media.folders.read"),
  listMediaFoldersValidation,
  validateRequest,
  mediaFolderController.getMediaFolderTree
);

router.get(
  "/",
  authorize("media.folders.read"),
  listMediaFoldersValidation,
  validateRequest,
  mediaFolderController.listMediaFolders
);

router.post(
  "/",
  authorize("media.folders.create"),
  createMediaFolderValidation,
  validateRequest,
  mediaFolderController.createMediaFolder
);

router.get(
  "/:id",
  authorize("media.folders.read"),
  mediaFolderIdValidation,
  validateRequest,
  mediaFolderController.getMediaFolderById
);

router.put(
  "/:id",
  authorize("media.folders.update"),
  updateMediaFolderValidation,
  validateRequest,
  mediaFolderController.updateMediaFolder
);

router.patch(
  "/:id/active",
  authorize("media.folders.update"),
  changeMediaFolderActiveValidation,
  validateRequest,
  mediaFolderController.changeMediaFolderActive
);

router.delete(
  "/:id",
  authorize("media.folders.delete"),
  mediaFolderIdValidation,
  validateRequest,
  mediaFolderController.deleteMediaFolder
);

module.exports = router;