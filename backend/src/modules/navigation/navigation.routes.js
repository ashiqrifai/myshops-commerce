const express = require("express");

const navigationController =
  require(
    "./navigation.controller"
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
  listNavigationMenusValidation,
  navigationMenuIdValidation,
  createNavigationMenuValidation,
  updateNavigationMenuValidation,
  changeNavigationMenuActiveValidation,
  createNavigationItemValidation,
  updateNavigationItemValidation,
  navigationItemIdValidation,
  reorderNavigationItemsValidation,
} = require(
  "./navigation.validation"
);

const router =
  express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("cms.pages.read"),
  listNavigationMenusValidation,
  validateRequest,
  navigationController
    .listNavigationMenus
);

router.post(
  "/",
  authorize("cms.pages.create"),
  createNavigationMenuValidation,
  validateRequest,
  navigationController
    .createNavigationMenu
);

router.get(
  "/:id",
  authorize("cms.pages.read"),
  navigationMenuIdValidation,
  validateRequest,
  navigationController
    .getNavigationMenuById
);

router.put(
  "/:id",
  authorize("cms.pages.update"),
  updateNavigationMenuValidation,
  validateRequest,
  navigationController
    .updateNavigationMenu
);

router.patch(
  "/:id/active",
  authorize("cms.pages.update"),
  changeNavigationMenuActiveValidation,
  validateRequest,
  navigationController
    .changeNavigationMenuActive
);

router.post(
  "/:menuId/items",
  authorize("cms.pages.update"),
  createNavigationItemValidation,
  validateRequest,
  navigationController
    .createNavigationItem
);

router.put(
  "/items/:itemId",
  authorize("cms.pages.update"),
  updateNavigationItemValidation,
  validateRequest,
  navigationController
    .updateNavigationItem
);

router.delete(
  "/items/:itemId",
  authorize("cms.pages.update"),
  navigationItemIdValidation,
  validateRequest,
  navigationController
    .deleteNavigationItem
);

router.post(
  "/:menuId/reorder",
  authorize("cms.pages.update"),
  reorderNavigationItemsValidation,
  validateRequest,
  navigationController
    .reorderNavigationItems
);

module.exports = router;