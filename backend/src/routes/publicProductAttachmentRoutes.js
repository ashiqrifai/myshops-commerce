const express =
  require(
    "express"
  );

const controller =
  require(
    "../controllers/publicProductAttachmentController"
  );

const router =
  express.Router();

router.get(
  "/",
  controller
    .getProductAttachments
);

module.exports =
  router;