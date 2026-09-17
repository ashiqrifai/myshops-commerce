const express =
  require(
    "express"
  );

const productAttachmentController =
  require(
    "./productAttachment.controller"
  );

const authenticate =
  require(
    "../../middleware/authenticate"
  );

const authorize =
  require(
    "../../middleware/authorize"
  );

const validateRequest =
  require(
    "../../middleware/validateRequest"
  );

const {
  productAttachmentRuleIdValidation,
  listProductAttachmentRulesValidation,
  createProductAttachmentRuleValidation,
  updateProductAttachmentRuleValidation,
  changeProductAttachmentRuleStatusValidation,
} = require(
  "./productAttachment.validation"
);

const router =
  express.Router();

router.use(
  authenticate
);

router.get(
  "/",
  authorize(
    "product_attachments.read"
  ),
  listProductAttachmentRulesValidation,
  validateRequest,
  productAttachmentController
    .listProductAttachmentRules
);

router.post(
  "/",
  authorize(
    "product_attachments.create"
  ),
  createProductAttachmentRuleValidation,
  validateRequest,
  productAttachmentController
    .createProductAttachmentRule
);

router.get(
  "/:id",
  authorize(
    "product_attachments.read"
  ),
  productAttachmentRuleIdValidation,
  validateRequest,
  productAttachmentController
    .getProductAttachmentRuleById
);

router.put(
  "/:id",
  authorize(
    "product_attachments.update"
  ),
  updateProductAttachmentRuleValidation,
  validateRequest,
  productAttachmentController
    .updateProductAttachmentRule
);

router.patch(
  "/:id/status",
  authorize(
    "product_attachments.update"
  ),
  changeProductAttachmentRuleStatusValidation,
  validateRequest,
  productAttachmentController
    .changeProductAttachmentRuleStatus
);

router.delete(
  "/:id",
  authorize(
    "product_attachments.delete"
  ),
  productAttachmentRuleIdValidation,
  validateRequest,
  productAttachmentController
    .deleteProductAttachmentRule
);

module.exports =
  router;
