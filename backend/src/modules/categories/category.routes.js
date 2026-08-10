const express =
  require("express");

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

const categoryController =
  require(
    "./category.controller"
  );

const {
  categoryIdValidation,
  createCategoryValidation,
  updateCategoryValidation,
  listCategoriesValidation,
  updateCategoryStatusValidation,
  reorderCategoriesValidation,
} = require(
  "./category.validation"
);

const router =
  express.Router();

router.use(authenticate);

/*
 * Fixed routes must come first.
 */

router.get(
  "/tree",
  authorize(
    "CATEGORY_VIEW"
  ),
  categoryController
    .getCategoryTree
);

router.patch(
  "/reorder/bulk",
  authorize(
    "CATEGORY_EDIT"
  ),
  reorderCategoriesValidation,
  validateRequest,
  categoryController
    .reorderCategories
);

/*
 * Collection routes.
 */

router.get(
  "/",
  authorize(
    "CATEGORY_VIEW"
  ),
  listCategoriesValidation,
  validateRequest,
  categoryController
    .listCategories
);

router.post(
  "/",
  authorize(
    "CATEGORY_CREATE"
  ),
  createCategoryValidation,
  validateRequest,
  categoryController
    .createCategory
);

/*
 * Individual category routes.
 */

router.get(
  "/:categoryId",
  authorize(
    "CATEGORY_VIEW"
  ),
  categoryIdValidation,
  validateRequest,
  categoryController
    .getCategory
);

router.put(
  "/:categoryId",
  authorize(
    "CATEGORY_EDIT"
  ),
  updateCategoryValidation,
  validateRequest,
  categoryController
    .updateCategory
);

router.patch(
  "/:categoryId/status",
  authorize(
    "CATEGORY_EDIT"
  ),
  updateCategoryStatusValidation,
  validateRequest,
  categoryController
    .updateCategoryStatus
);

router.delete(
  "/:categoryId",
  authorize(
    "CATEGORY_DELETE"
  ),
  categoryIdValidation,
  validateRequest,
  categoryController
    .deleteCategory
);

module.exports =
  router;