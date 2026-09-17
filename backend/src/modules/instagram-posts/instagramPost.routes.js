const express =
  require(
    "express"
  );

const instagramPostController =
  require(
    "./instagramPost.controller"
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
  instagramPostIdValidation,

  listInstagramPostsValidation,

  createInstagramPostValidation,

  updateInstagramPostValidation,

  changeInstagramPostStatusValidation,
} = require(
  "./instagramPost.validation"
);

const router =
  express.Router();

router.use(
  authenticate
);

router.get(
  "/",

  authorize(
    "instagram-posts.read"
  ),

  listInstagramPostsValidation,

  validateRequest,

  instagramPostController
    .listInstagramPosts
);

router.post(
  "/",

  authorize(
    "instagram-posts.create"
  ),

  createInstagramPostValidation,

  validateRequest,

  instagramPostController
    .createInstagramPost
);

router.get(
  "/:id",

  authorize(
    "instagram-posts.read"
  ),

  instagramPostIdValidation,

  validateRequest,

  instagramPostController
    .getInstagramPostById
);

router.put(
  "/:id",

  authorize(
    "instagram-posts.update"
  ),

  updateInstagramPostValidation,

  validateRequest,

  instagramPostController
    .updateInstagramPost
);

router.patch(
  "/:id/status",

  authorize(
    "instagram-posts.update"
  ),

  changeInstagramPostStatusValidation,

  validateRequest,

  instagramPostController
    .changeInstagramPostStatus
);

router.delete(
  "/:id",

  authorize(
    "instagram-posts.delete"
  ),

  instagramPostIdValidation,

  validateRequest,

  instagramPostController
    .deleteInstagramPost
);

module.exports =
  router;