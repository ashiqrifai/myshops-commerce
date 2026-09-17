const express =
  require(
    "express"
  );

const protectionAssignmentController =
  require(
    "./protectionAssignment.controller"
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
  protectionAssignmentIdValidation,
  listProtectionAssignmentsValidation,
  createProtectionAssignmentValidation,
  updateProtectionAssignmentValidation,
  changeProtectionAssignmentStatusValidation,
} = require(
  "./protectionAssignment.validation"
);

const router =
  express.Router();

router.use(
  authenticate
);

router.get(
  "/",
  authorize(
    "protection_assignments.read"
  ),
  listProtectionAssignmentsValidation,
  validateRequest,
  protectionAssignmentController
    .listProtectionAssignments
);

router.post(
  "/",
  authorize(
    "protection_assignments.create"
  ),
  createProtectionAssignmentValidation,
  validateRequest,
  protectionAssignmentController
    .createProtectionAssignment
);

router.get(
  "/:id",
  authorize(
    "protection_assignments.read"
  ),
  protectionAssignmentIdValidation,
  validateRequest,
  protectionAssignmentController
    .getProtectionAssignmentById
);

router.put(
  "/:id",
  authorize(
    "protection_assignments.update"
  ),
  updateProtectionAssignmentValidation,
  validateRequest,
  protectionAssignmentController
    .updateProtectionAssignment
);

router.patch(
  "/:id/status",
  authorize(
    "protection_assignments.update"
  ),
  changeProtectionAssignmentStatusValidation,
  validateRequest,
  protectionAssignmentController
    .changeProtectionAssignmentStatus
);

router.delete(
  "/:id",
  authorize(
    "protection_assignments.delete"
  ),
  protectionAssignmentIdValidation,
  validateRequest,
  protectionAssignmentController
    .deleteProtectionAssignment
);

module.exports =
  router;
