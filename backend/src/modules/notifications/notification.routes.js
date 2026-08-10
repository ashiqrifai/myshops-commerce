const express =
require(
  "express"
);

const controller =
require(
  "./notification.controller"
);

const validation =
require(
  "./notification.validation"
);

const authenticateCustomer =
require(
  "../../middleware/authenticateCustomer"
);

const validateRequest =
require(
  "../../middleware/validateRequest"
);

const router =
express.Router();

router.use(
  authenticateCustomer
);

router.get(
  "/",

  validation
    .listValidation,

  validateRequest,

  controller.list
);

router.get(
  "/unread-count",

  controller
    .unreadCount
);

router.patch(
  "/read-all",

  controller
    .markAllAsRead
);

router.patch(
  "/:id/read",

  validation
    .notificationIdValidation,

  validateRequest,

  controller
    .markAsRead
);

router.delete(
  "/:id",

  validation
    .notificationIdValidation,

  validateRequest,

  controller.remove
);

module.exports =
router;